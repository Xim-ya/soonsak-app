/**
 * useQuickExploreGrid - 무한 가상화 그리드 상태 관리 훅
 *
 * 화면에 보이는 영역만 렌더링하고, 스크롤 시 새로운 콘텐츠를 로드합니다.
 * 셀 기반으로 콘텐츠를 관리하여 무한 그리드를 구현합니다.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api';
import { BaseContentModel } from '@/core/types/content/baseContentModel';
import { AppSize } from '@/presentation/utils/appSize';
import type { ContentFilter } from '@/core/types/filter/contentFilter';
import { isFilterActive } from '@/core/types/filter/contentFilter';
import { Logger } from '@/core/utils';

const QuickExploreLogger = Logger.create('QuickExplore');

// 그리드 레이아웃 상수
const GRID_UNIT_WIDTH = 256;
const CARD_HEIGHT = 344;
const CARD_MARGIN = 10;
const BUFFER_CELLS = 1; // 뷰포트 밖 버퍼 셀 수 (메모리 최적화)
const BATCH_SIZE = 20; // 한 번에 로드할 콘텐츠 수
export const ZIGZAG_OFFSET = 192; // 지그재그 오프셋 (짝수 인덱스 셀에 적용)

/** 짝수 인덱스 셀의 지그재그 Y 오프셋 계산 */
export function calcZigzagOffset(
  row: number,
  col: number,
  columns: number,
  zigzagValue: number,
): number {
  const globalIndex = row * columns + col;
  return globalIndex % 2 === 0 ? zigzagValue : 0;
}

interface CellPosition {
  row: number;
  col: number;
}

// position 객체 캐시 (리렌더링 시 동일 참조 유지, 최대 500개)
const POSITION_CACHE_LIMIT = 500;
const positionCache = new Map<string, CellPosition>();
const getPosition = (row: number, col: number): CellPosition => {
  const key = `${row}|${col}`;
  let position = positionCache.get(key);
  if (!position) {
    if (positionCache.size >= POSITION_CACHE_LIMIT) {
      // 가장 오래된 항목 제거 (Map은 삽입 순서 보장)
      const firstKey = positionCache.keys().next().value;
      if (firstKey !== undefined) positionCache.delete(firstKey);
    }
    position = { row, col };
    positionCache.set(key, position);
  }
  return position;
};

interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface GridCell {
  position: CellPosition;
  content: BaseContentModel | null;
}

// 콘텐츠와 위치 정보 (포커스 기능용)
export interface ContentWithPosition {
  content: BaseContentModel;
  position: CellPosition;
  translateX: number; // 해당 셀을 화면 중앙에 배치하기 위한 translate 값
  translateY: number;
}

interface UseQuickExploreGridReturn {
  // 그리드 상태
  cells: GridCell[];
  isLoading: boolean;
  columns: number;
  hasMoreContents: boolean;

  // 그리드 크기
  cellWidth: number;
  cellHeight: number;

  // 초기 위치 (화면 중앙에 (0,0) 셀 배치)
  initialTranslateX: number;
  initialTranslateY: number;

  // 뷰포트 업데이트
  updateViewport: (translateX: number, translateY: number) => void;

  // 랜덤 콘텐츠 선택 (포커스 기능용)
  getRandomContent: () => ContentWithPosition | null;

  // 필터 변경 시 그리드 리셋
  resetGrid: () => void;
}

/** 배열 순서에 무관한 안정적 필터 키 생성 */
function getStableFilterKey(filter: ContentFilter): string {
  return JSON.stringify({
    ...filter,
    genreIds: [...filter.genreIds].sort((a, b) => a - b),
    countryCodes: [...filter.countryCodes].sort(),
    channelIds: [...filter.channelIds].sort(),
  });
}

export function useQuickExploreGrid(filter?: ContentFilter): UseQuickExploreGridReturn {
  // 반응형 크기
  const cellWidth = AppSize.ratioWidth(GRID_UNIT_WIDTH);
  const cellHeight = AppSize.ratioHeight(CARD_HEIGHT) + AppSize.ratioWidth(CARD_MARGIN) * 2;

  // 화면 크기 기반 열 수 (화면에 보이는 열 수 + 버퍼)
  const screenWidth = AppSize.screenWidth;
  const screenHeight = AppSize.screenHeight;
  const visibleCols = Math.ceil(screenWidth / cellWidth) + BUFFER_CELLS * 2;
  const visibleRows = Math.ceil(screenHeight / cellHeight) + BUFFER_CELLS * 2;

  // 고정 열 수 (무한 그리드이므로 충분히 큰 값)
  const columns = 10;

  // 화면 중앙에 (0,0) 셀이 오도록 초기 translate 값 계산
  const initialTranslateX = screenWidth / 2 - cellWidth / 2;
  const initialTranslateY = screenHeight / 2 - cellHeight / 2;

  // 초기 translate 기반 뷰포트 계산
  const initialStartCol = Math.floor(-initialTranslateX / cellWidth) - BUFFER_CELLS;
  const initialStartRow = Math.floor(-initialTranslateY / cellHeight) - BUFFER_CELLS;

  // 셀-콘텐츠 매핑 (cellKey -> content)
  const [contentMap, setContentMap] = useState<Map<string, BaseContentModel>>(new Map());

  // 현재 뷰포트 범위 (초기값은 계산된 translate 기반)
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startRow: initialStartRow,
    endRow: initialStartRow + visibleRows,
    startCol: initialStartCol,
    endCol: initialStartCol + visibleCols,
  });

  // 로드된 콘텐츠 ID 추적 (중복 방지)
  const loadedIdsRef = useRef<Set<number>>(new Set());

  // contentMap ref (useEffect에서 최신 값 접근용)
  const contentMapRef = useRef<Map<string, BaseContentModel>>(contentMap);
  contentMapRef.current = contentMap;

  // 이전 뷰포트 (변경 감지용)
  const prevViewportRef = useRef<VisibleRange | null>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 더 로드할 콘텐츠 여부
  const [hasMoreContents, setHasMoreContents] = useState(true);

  // 초기 로드 완료 여부
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // 필터 적용 여부
  const hasFilter = filter ? isFilterActive(filter) : false;

  // 필터 변경 추적용 키 (배열 순서 독립적 직렬화)
  const filterKey = filter ? getStableFilterKey(filter) : 'none';

  // 초기 콘텐츠 로드 (필터 포함)
  const { data: initialContents, isLoading: isInitialLoading } = useQuery({
    queryKey: ['quickExploreInitialContents', filterKey],
    queryFn: async () => {
      const contents =
        hasFilter && filter
          ? await contentApi.getFilteredRandomContents(filter, [], BATCH_SIZE)
          : await contentApi.getRandomContents([], BATCH_SIZE);
      return contents.map((dto) => BaseContentModel.fromContentDto(dto));
    },
    staleTime: Infinity,
  });

  // 초기 콘텐츠를 셀에 배치 ((0,0) 중심 나선형 배치)
  useEffect(() => {
    if (!initialContents || initialContents.length === 0 || isInitialLoadDone) return;

    const newMap = new Map<string, BaseContentModel>();

    // (0,0) 중심으로 나선형 배치
    const positions: CellPosition[] = [];
    const maxRadius = Math.ceil(Math.sqrt(initialContents.length));

    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let row = -radius; row <= radius; row++) {
        for (let col = -radius; col <= radius; col++) {
          if (Math.abs(row) === radius || Math.abs(col) === radius) {
            positions.push({ row, col });
          }
        }
      }
    }

    initialContents.forEach((content, index) => {
      const position = positions[index];
      if (position) {
        const key = `${position.row}|${position.col}`;
        newMap.set(key, content);
        loadedIdsRef.current.add(content.id);
      }
    });

    // ref도 즉시 업데이트 (getRandomContent에서 사용)
    contentMapRef.current = newMap;
    setContentMap(newMap);
    setIsInitialLoadDone(true);
    QuickExploreLogger.log(
      `초기 로드 완료, 콘텐츠 수: ${initialContents.length}, 배치 범위: (${positions[0]?.row},${positions[0]?.col}) ~ (${positions[initialContents.length - 1]?.row},${positions[initialContents.length - 1]?.col})`,
    );
    QuickExploreLogger.log(
      `현재 뷰포트: row(${visibleRange.startRow}~${visibleRange.endRow}), col(${visibleRange.startCol}~${visibleRange.endCol})`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContents]);

  // 셀 키 생성
  const getCellKey = useCallback((row: number, col: number) => `${row}|${col}`, []);

  // 뷰포트 업데이트 (드래그 위치 기반, 음수 좌표 지원)
  const updateViewport = useCallback(
    (translateX: number, translateY: number) => {
      // 현재 뷰포트의 시작 셀 계산 (음수 좌표 허용)
      const startCol = Math.floor(-translateX / cellWidth) - BUFFER_CELLS;
      const startRow = Math.floor(-translateY / cellHeight) - BUFFER_CELLS;

      const endCol = startCol + visibleCols;
      const endRow = startRow + visibleRows;

      // 뷰포트가 실제로 변경되었을 때만 업데이트
      setVisibleRange((prev) => {
        if (
          prev.startRow === startRow &&
          prev.endRow === endRow &&
          prev.startCol === startCol &&
          prev.endCol === endCol
        ) {
          return prev;
        }
        QuickExploreLogger.log(
          `뷰포트 변경: row(${startRow}~${endRow}), col(${startCol}~${endCol})`,
        );
        return { startRow, endRow, startCol, endCol };
      });
    },
    [cellWidth, cellHeight, visibleCols, visibleRows],
  );

  // 새 뷰포트 영역의 빈 셀 수 계산
  const countNewEmptyCells = useCallback(
    (current: VisibleRange, prev: VisibleRange): number => {
      const currentContentMap = contentMapRef.current;
      let count = 0;

      for (let row = current.startRow; row <= current.endRow; row++) {
        for (let col = current.startCol; col <= current.endCol; col++) {
          const key = getCellKey(row, col);
          if (!currentContentMap.has(key)) {
            const wasInPrevViewport =
              row >= prev.startRow &&
              row <= prev.endRow &&
              col >= prev.startCol &&
              col <= prev.endCol;

            if (!wasInPrevViewport) {
              count++;
            }
          }
        }
      }
      return count;
    },
    [getCellKey],
  );

  // 빈 셀에 새 콘텐츠를 로드하여 배치
  const loadAndPlaceContents = useCallback(
    async (range: VisibleRange) => {
      setIsLoading(true);

      try {
        const excludeIds = Array.from(loadedIdsRef.current);
        const newContents =
          hasFilter && filter
            ? await contentApi.getFilteredRandomContents(filter, excludeIds, BATCH_SIZE)
            : await contentApi.getRandomContents(excludeIds, BATCH_SIZE);

        if (newContents.length === 0) {
          setHasMoreContents(false);
          return;
        }

        const models = newContents.map((dto) => BaseContentModel.fromContentDto(dto));

        setContentMap((prevMap) => {
          const newMap = new Map(prevMap);
          let contentIndex = 0;

          for (
            let row = range.startRow;
            row <= range.endRow && contentIndex < models.length;
            row++
          ) {
            for (
              let col = range.startCol;
              col <= range.endCol && contentIndex < models.length;
              col++
            ) {
              const key = getCellKey(row, col);
              const content = models[contentIndex];
              if (!newMap.has(key) && content) {
                newMap.set(key, content);
                loadedIdsRef.current.add(content.id);
                contentIndex++;
              }
            }
          }

          contentMapRef.current = newMap;
          return newMap;
        });
      } catch (error) {
        QuickExploreLogger.error('콘텐츠 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [getCellKey, filter, hasFilter],
  );

  // 뷰포트 변경 시 빈 셀이 충분하면 콘텐츠 로드
  useEffect(() => {
    if (!isInitialLoadDone || isLoading || !hasMoreContents) return;

    const prev = prevViewportRef.current;
    if (!prev) {
      prevViewportRef.current = visibleRange;
      return;
    }

    const hasChanged =
      prev.startRow !== visibleRange.startRow ||
      prev.endRow !== visibleRange.endRow ||
      prev.startCol !== visibleRange.startCol ||
      prev.endCol !== visibleRange.endCol;

    if (!hasChanged) return;

    const newEmptyCellCount = countNewEmptyCells(visibleRange, prev);
    prevViewportRef.current = visibleRange;

    const MIN_EMPTY_CELLS_TO_LOAD = 10;
    if (newEmptyCellCount < MIN_EMPTY_CELLS_TO_LOAD) return;

    loadAndPlaceContents(visibleRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleRange,
    isInitialLoadDone,
    isLoading,
    hasMoreContents,
    countNewEmptyCells,
    loadAndPlaceContents,
  ]);

  // 현재 뷰포트에 보이는 셀 목록 생성
  const cells = useMemo(() => {
    const result: GridCell[] = [];

    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const key = getCellKey(row, col);
        const content = contentMap.get(key) ?? null;

        result.push({
          position: getPosition(row, col), // 캐싱된 position 사용
          content,
        });
      }
    }

    return result;
  }, [visibleRange, contentMap, getCellKey]);

  // 랜덤 콘텐츠 선택 (포커스 기능용)
  const getRandomContent = useCallback((): ContentWithPosition | null => {
    const entries = Array.from(contentMapRef.current.entries());
    QuickExploreLogger.log(`getRandomContent 호출, 콘텐츠 맵 크기: ${entries.length}`);
    if (entries.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * entries.length);
    const entry = entries[randomIndex];
    if (!entry) return null;

    const [key, content] = entry;
    const parts = key.split('|');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const row = parseInt(parts[0], 10);
    const col = parseInt(parts[1], 10);

    const zigzag = calcZigzagOffset(row, col, columns, AppSize.ratioHeight(ZIGZAG_OFFSET));

    // 해당 셀을 화면 중앙에 배치하기 위한 translate 값 계산
    // 실제 셀 Y 위치: row * cellHeight + translateY + zigzag
    const targetTranslateX = screenWidth / 2 - cellWidth / 2 - col * cellWidth;
    const targetTranslateY = screenHeight / 2 - cellHeight / 2 - row * cellHeight - zigzag;

    return {
      content,
      position: { row, col },
      translateX: targetTranslateX,
      translateY: targetTranslateY,
    };
  }, [screenWidth, screenHeight, cellWidth, cellHeight]);

  // 그리드 리셋 (필터 변경 시 호출)
  const resetGrid = useCallback(() => {
    const emptyMap = new Map<string, BaseContentModel>();
    contentMapRef.current = emptyMap;
    setContentMap(emptyMap);
    loadedIdsRef.current = new Set();
    prevViewportRef.current = null;
    setIsInitialLoadDone(false);
    setHasMoreContents(true);
    setVisibleRange({
      startRow: initialStartRow,
      endRow: initialStartRow + visibleRows,
      startCol: initialStartCol,
      endCol: initialStartCol + visibleCols,
    });
  }, [initialStartRow, visibleRows, initialStartCol, visibleCols]);

  // 필터 변경 시 그리드 자동 리셋
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      resetGrid();
    }
  }, [filterKey, resetGrid]);

  return {
    cells,
    isLoading: isLoading || isInitialLoading,
    columns,
    hasMoreContents,
    cellWidth,
    cellHeight,
    initialTranslateX,
    initialTranslateY,
    updateViewport,
    getRandomContent,
    resetGrid,
  };
}
