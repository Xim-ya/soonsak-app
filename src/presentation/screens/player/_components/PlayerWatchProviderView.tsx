import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import { useWatchProviders } from '@/features/tmdb/hooks/useWatchProviders';
import { PlayerWatchProviderBottomSheet } from './PlayerWatchProviderBottomSheet';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface PlayerWatchProviderViewProps {
  readonly contentId: number;
  readonly contentType: ContentType;
}

function PlayerWatchProviderView({ contentId, contentType }: PlayerWatchProviderViewProps) {
  const { data: providers } = useWatchProviders(contentId, contentType);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const handleOpen = useCallback(() => {
    setIsBottomSheetVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsBottomSheetVisible(false);
  }, []);

  if (providers.length === 0) return null;

  return (
    <>
      <Button onPress={handleOpen} activeOpacity={0.7}>
        <LogoRow>
          {providers.map((provider, index) => (
            <ProviderLogo
              key={provider.providerId}
              source={{
                uri: formatter.prefixTmdbImgUrl(provider.logoPath, { size: TmdbImageSize.w92 }),
              }}
              isFirst={index === 0}
            />
          ))}
        </LogoRow>
        <ButtonText>풀버전</ButtonText>
        <RightArrowIcon width={16} height={16} />
      </Button>

      <PlayerWatchProviderBottomSheet
        visible={isBottomSheetVisible}
        onClose={handleClose}
        providers={providers}
      />
    </>
  );
}

const MemoizedPlayerWatchProviderView = React.memo(PlayerWatchProviderView);
MemoizedPlayerWatchProviderView.displayName = 'PlayerWatchProviderView';

export { MemoizedPlayerWatchProviderView as PlayerWatchProviderView };

/* Styled Components */

const Button = styled.TouchableOpacity({
  alignSelf: 'flex-end',
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 16,
  marginTop: 16,
  marginRight: 16,
});

const LogoRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  marginRight: 8,
});

const ProviderLogo = styled(Image)<{ isFirst: boolean }>(({ isFirst }) => ({
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 2,
  borderColor: colors.black,
  marginLeft: isFirst ? 0 : -8,
}));

const ButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  marginRight: 4,
});
