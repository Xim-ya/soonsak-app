import { SvgProps } from 'react-native-svg';
import HomeIcon from '@assets/icons/home_tab.svg';
import ExploreIcon from '@assets/icons/explore_tab.svg';
import ChannelIcon from '@assets/icons/channel_tab.svg';
import MyIcon from '@assets/icons/my_tab.svg';

enum TabRoutes {
  Home = 'Home',
  Explore = 'Explore',
  Channel = 'Channel',
  My = 'My',
}

interface BottomTabItem {
  label: string;
  icon: React.FC<SvgProps>;
}

const TabConfig: Record<TabRoutes, BottomTabItem> = {
  [TabRoutes.Home]: {
    label: '홈',
    icon: HomeIcon,
  },
  [TabRoutes.Explore]: {
    label: '탐색',
    icon: ExploreIcon,
  },
  [TabRoutes.Channel]: {
    label: '채널',
    icon: ChannelIcon,
  },
  [TabRoutes.My]: {
    label: 'MY',
    icon: MyIcon,
  },
};

export { TabRoutes, TabConfig };
