/* @flow strict-local */
import type { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheet';

import { BRAND_COLOR } from './constants';

type Props = $ReadOnly<{|
  showLabel: boolean,
  showIcon: boolean,
  style?: ViewStyle,
|}>;

export default ({ showLabel, showIcon, style }: Props) => ({
  tabBarOptions: {
    showLabel,
    showIcon,
    upperCaseLabel: false,
    pressColor: BRAND_COLOR,
    activeTintColor: BRAND_COLOR,
    inactiveTintColor: 'gray',
    labelStyle: {
      fontSize: 13,
      margin: 0,
    },
    indicatorStyle: {
      backgroundColor: BRAND_COLOR,
    },
    tabStyle: {
      flex: 1,
    },
    style: {
      backgroundColor: 'transparent',
      // Setting a zero-width border (instead of none) works around an issue
      // affecting react-navigation's createMaterialTopTabNavigator.
      // https://github.com/zulip/zulip-mobile/issues/2065
      // https://github.com/satya164/react-native-tab-view/pull/519#issuecomment-689724208
      borderWidth: 0,
      elevation: 0,
      ...style,
    },
  },
});
