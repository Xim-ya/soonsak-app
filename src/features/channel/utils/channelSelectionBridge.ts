/**
 * channelSelectionBridge - 바텀시트 ↔ 채널 선택 페이지 간 상태 브릿지
 *
 * 채널 선택 페이지에서 선택한 결과를 QuickExplorePage로 전달하기 위한
 * 모듈 레벨 브릿지입니다.
 *
 * 흐름:
 * 1. 채널 선택 페이지에서 "적용" 클릭 → setChannelResult(selectedIds) 저장
 * 2. QuickExplorePage 복귀 시 consumeChannelResult()로 결과 회수 후 클리어
 */

// 모듈 레벨 상태 변수
let channelResult: string[] | null = null;

/** 채널 선택 페이지에서 선택 결과를 저장 */
function setChannelResult(selectedIds: string[]): void {
  channelResult = selectedIds;
}

/** 채널 선택 결과를 가져오고 지연 클리어 (StrictMode 중복 호출 대응) */
function consumeChannelResult(): string[] | null {
  const result = channelResult;
  if (result !== null) {
    setTimeout(() => {
      channelResult = null;
    }, 0);
  }
  return result;
}

export const channelSelectionBridge = {
  setChannelResult,
  consumeChannelResult,
};
