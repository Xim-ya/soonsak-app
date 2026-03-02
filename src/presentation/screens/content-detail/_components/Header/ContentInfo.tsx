import React, { useMemo } from 'react';
import styled from '@emotion/native';
import { TouchableOpacity } from 'react-native';
import ContentTypeChip from '@/presentation/components/chip/ContentTypeChip';
import DarkChip from '@/presentation/components/chip/DarkChip';
import { videoTagConfigs } from '@/shared/types/content/videoTag.enum';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { StartRateView } from '../StartRateView';
import { useContentDetail } from '../../_hooks/useContentDetail';
import { useContentVideos } from '../../_provider/ContentDetailProvider';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import { formatter } from '@/shared/utils/formatter';
import { useContentDetailRoute } from '../../_hooks/useContentDetailRoute';
import { useContentInfoActions } from '../../_hooks/useContentInfoActions';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { RatingBottomSheet } from '@/presentation/components/bottom-sheet/RatingBottomSheet';
import HeartBlankSvg from '@assets/icons/heart_blank.svg';
import HeartFilledSvg from '@assets/icons/heart_filled.svg';
import StarBlankSvg from '@assets/icons/star_blank.svg';
import StarFilledSvg from '@assets/icons/star_filled.svg';

const ICON_SIZE = 14;

/** 태블릿 레이아웃 상수 */
const TABLET_CONTENT_MAX_WIDTH = 800;

/**
 * 콘텐츠 기본 정보 표시 컴포넌트
 *
 * 책임:
 * - 콘텐츠 타입 칩
 * - 콘텐츠 제목, 개봉년도, 장르 리스트
 * - 찜/평점 액션 버튼
 * - 비디오 타이틀
 * - 별점 표시
 *
 * 액션 로직은 useContentInfoActions 훅으로 분리되어 있습니다.
 * (Toss Frontend Fundamentals - 단일 책임 원칙)
 */
export const ContentInfo = React.memo(() => {
  const { id, title, type } = useContentDetailRoute();
  const contentId = Number(id);
  const isLargeScreen = AppSize.isLargeScreen();

  const {
    data: contentInfo,
    isLoading: isContentInfoLoading,
    error: contentInfoError,
  } = useContentDetail(contentId, type);

  const { primaryVideo, isLoading: isVideosLoading } = useContentVideos();

  // 찜/평점 액션 관리 (훅으로 분리)
  const {
    isFavorited,
    hasRating,
    currentRating,
    isLoginDialogVisible,
    isRatingSheetVisible,
    handleFavoritePress,
    handleRatingPress,
    handleSubmitRating,
    handleCloseRatingSheet,
    handleCloseDialog,
    loginSuccessCallback,
  } = useContentInfoActions({
    contentId,
    contentType: type,
    contentTitle: title ?? '',
  });

  // 연도 추출
  const releaseYear = contentInfo?.releaseDate ? formatter.dateToYear(contentInfo.releaseDate) : '';

  // 평점 계산 (10점 만점 -> 5점 만점)
  const rating = contentInfo?.voteAverage ? contentInfo.voteAverage / 2 : 0;

  // 장르 존재 여부
  const hasGenres = contentInfo?.genres && contentInfo.genres.length > 0;

  // 결말 포함 칩 표시 여부
  const showEndingChip = primaryVideo?.includesEnding;

  // 태블릿 중앙 정렬 스타일 (매 렌더링마다 객체 재생성 방지)
  const tabletContainerStyle = useMemo(
    () => (isLargeScreen ? { width: '100%' as const, alignItems: 'center' as const } : undefined),
    [isLargeScreen],
  );

  const tabletContentStyle = useMemo(
    () =>
      isLargeScreen ? { maxWidth: TABLET_CONTENT_MAX_WIDTH, width: '100%' as const } : undefined,
    [isLargeScreen],
  );

  return (
    <Container style={tabletContainerStyle}>
      <ContentWrapper style={tabletContentStyle}>
        {/* 콘텐츠 타입 및 결말 포함 칩 */}
        <ChipRow>
          <ContentTypeChip contentType={type} />
          {showEndingChip && (
            <>
              <Gap size={6} />
              <DarkChip content={videoTagConfigs.includesEnding.label} />
            </>
          )}
        </ChipRow>
        <Gap size={4} />

        {/* 제목 - route params에서 바로 표시 */}
        <Title>{title}</Title>
        <Gap size={2} />

        {/* 연도/장르 - 로딩 중이면 스켈레톤 */}
        {isContentInfoLoading ? (
          <SubTextView>
            <SkeletonView width={200} height={18} borderRadius={4} />
          </SubTextView>
        ) : contentInfoError ? null : (
          <SubTextView>
            {releaseYear && <SubText>{releaseYear}</SubText>}
            {hasGenres && (
              <>
                {releaseYear && <DotText> · </DotText>}
                {contentInfo!.genres.map((genre, index) => (
                  <React.Fragment key={genre.id}>
                    <SubText>{genre.name}</SubText>
                    {index < contentInfo!.genres.length - 1 && <SubText> · </SubText>}
                  </React.Fragment>
                ))}
              </>
            )}
          </SubTextView>
        )}
        <Gap size={10} />

        {/* 비디오 타이틀 */}
        {isVideosLoading ? (
          <SkeletonView width={250} height={20} borderRadius={4} />
        ) : (
          <ContentTitle>{primaryVideo?.title || '비디오를 불러오는 중...'}</ContentTitle>
        )}
        <Gap size={8} />

        {/* 별점 */}
        <RatingWrapper>
          <StartRateView rating={rating} />
        </RatingWrapper>
        <Gap size={12} />

        {/* 찜/평점 액션 버튼 */}
        <ActionButtonRow>
          <ActionButton onPress={handleFavoritePress} activeOpacity={0.7}>
            {isFavorited ? (
              <HeartFilledSvg width={ICON_SIZE} height={ICON_SIZE} />
            ) : (
              <HeartBlankSvg width={ICON_SIZE} height={ICON_SIZE} />
            )}
            <ActionButtonText>찜</ActionButtonText>
          </ActionButton>
          <Gap size={8} />
          <ActionButton onPress={handleRatingPress} activeOpacity={0.7}>
            {hasRating ? (
              <StarFilledSvg width={ICON_SIZE} height={ICON_SIZE} />
            ) : (
              <StarBlankSvg width={ICON_SIZE} height={ICON_SIZE} />
            )}
            <ActionButtonText>평점</ActionButtonText>
          </ActionButton>
        </ActionButtonRow>
      </ContentWrapper>

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={handleCloseDialog}
        onLoginSuccess={loginSuccessCallback}
      />

      {/* 평점 등록 바텀시트 */}
      <RatingBottomSheet
        visible={isRatingSheetVisible}
        contentTitle={title ?? ''}
        currentRating={currentRating}
        onSubmitRating={handleSubmitRating}
        onClose={handleCloseRatingSheet}
      />
    </Container>
  );
});

ContentInfo.displayName = 'ContentInfo';

/* Styled Components - ContentInfo 전용 */
const Container = styled.View({
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 20,
  paddingHorizontal: 16,
  pointerEvents: 'box-none' as const,
});

/** 태블릿에서 max-width 적용을 위한 래퍼 */
const ContentWrapper = styled.View({
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
});

const ChipRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 26, // DarkChip 높이 기준 (레이아웃 점프 방지)
});

const Title = styled.Text({
  ...textStyles.headline1,
  textAlign: 'center',
});

const ContentTitle = styled.Text({
  ...textStyles.body3,
  textAlign: 'center',
});

const SubTextView = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'center',
  width: '100%',
});

const SubText = styled.Text({
  ...textStyles.alert1,
  color: colors.gray01,
});

const DotText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const RatingWrapper = styled.View({
  alignItems: 'center',
});

const ActionButtonRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const ActionButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(40, 40, 49, 0.6)',
  borderRadius: 16,
  paddingVertical: 6,
  paddingHorizontal: 12,
  gap: 4,
});

const ActionButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  marginRight: 2,
});
