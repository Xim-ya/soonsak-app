import React from 'react';
import { FlatList } from 'react-native';
import styled from '@emotion/native';
import textStyles from '@/shared/styles/textStyles';
import colors from '@/shared/styles/colors';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import { useCredits } from '../_hooks/useCredits';
import { CreditPersonModel } from '../_types/creditModel.cd';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';

function CaseView() {
  const { id, type } = useContentDetailRoute();
  const { data: creditList, isLoading, error } = useCredits(id, type);
  const screenWidth = AppSize.screenWidth;
  const pageWidth = screenWidth * 0.93; // viewportFraction: 0.93과 동일

  // 에러 발생 시 아무것도 렌더링하지 않음
  if (error) {
    return null;
  }

  // 3개씩 순서대로 채우기 (마지막 페이지에만 남은 개수)
  const itemsPerPage = 3;
  const pages: CreditPersonModel[][] = [];
  for (let i = 0; i < creditList.length; i += itemsPerPage) {
    pages.push(creditList.slice(i, i + itemsPerPage));
  }

  const renderPage = ({ item: page }: { item: CreditPersonModel[]; index: number }) => (
    <PageContainer style={{ width: pageWidth }}>
      {page.map((credit) => (
        <CreditItem key={credit.id}>
          <RoundedAvatorView
            source={
              credit?.profilePath
                ? formatter.prefixTmdbImgUrl(credit.profilePath, { size: TmdbImageSize.w185 })
                : ''
            }
            size={56}
          />
          <InfoContainer>
            <NameText>{credit.name}</NameText>
            <RoleText>{credit.character || '정보 없음'}</RoleText>
          </InfoContainer>
        </CreditItem>
      ))}
    </PageContainer>
  );

  // 로딩 스켈레톤 렌더링 (6개 아이템)
  const renderLoadingSkeleton = () => {
    const skeletonItems = Array.from({ length: 6 }, (_, index) => (
      <CreditItem key={index}>
        <RoundedAvatorView source="" size={56} />
        <InfoContainer>
          <SkeletonContainer>
            <SkeletonView width={80} height={16} />
          </SkeletonContainer>
          <SkeletonView width={60} height={16} />
        </InfoContainer>
      </CreditItem>
    ));

    // 3개씩 2페이지로 분할
    const page1 = skeletonItems.slice(0, 3);
    const page2 = skeletonItems.slice(3, 6);

    return [
      <PageContainer key="page1" style={{ width: pageWidth }}>
        {page1}
      </PageContainer>,
      <PageContainer key="page2" style={{ width: pageWidth }}>
        {page2}
      </PageContainer>,
    ];
  };

  if (isLoading) {
    return (
      <Container>
        <TitleText>출연진</TitleText>
        <FlatList
          data={renderLoadingSkeleton()}
          renderItem={({ item }) => item}
          keyExtractor={(_, index) => `skeleton-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={pageWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
        <BottomSpace />
      </Container>
    );
  }

  return (
    <Container>
      {creditList.length > 0 && (
        <>
          <TitleText>출연진</TitleText>

          <FlatList
            data={pages}
            renderItem={renderPage}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={pageWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />

          <BottomSpace />
        </>
      )}
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  paddingTop: 24,
});

const TitleText = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  paddingLeft: 16,
  paddingBottom: 12,
});

const PageContainer = styled.View({
  height: 220,
  justifyContent: 'flex-start',
  paddingRight: 16,
});

const CreditItem = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
});

const InfoContainer = styled.View({
  marginLeft: 12,
  justifyContent: 'center',
});

const NameText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  marginBottom: 2,
});

const RoleText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray01,
});

const BottomSpace = styled.View({
  height: 40,
});

const SkeletonContainer = styled.View({
  marginBottom: 2,
});

export default CaseView;
