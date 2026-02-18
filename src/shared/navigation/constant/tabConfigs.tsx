import { SvgProps } from 'react-native-svg';
import HomeIcon from '@assets/icons/home_tab.svg';
import ExploreIcon from '@assets/icons/explore_tab.svg';
import SearchIcon from '@assets/icons/search_tab.svg';
import MyIcon from '@assets/icons/my_tab.svg';

enum TabRoutes {
  Home = 'Home',
  Explore = 'Explore',
  QuickExplore = 'QuickExplore',
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
    icon: SearchIcon,
  },
  [TabRoutes.QuickExplore]: {
    label: '빠른탐색',
    icon: ExploreIcon,
  },
  [TabRoutes.My]: {
    label: 'MY',
    icon: MyIcon,
  },
};

export { TabRoutes, TabConfig };
