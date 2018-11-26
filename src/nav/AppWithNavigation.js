/* @flow */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { addNavigationHelpers } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import type { Dispatch, GlobalState, PlainDispatch } from '../types';
import { getNav } from '../selectors';
import AppNavigator from './AppNavigator';

type Props = {
  dispatch: Dispatch,
  nav: Object,
};

class AppWithNavigation extends PureComponent<Props> {
  props: Props;

  render() {
    const { nav } = this.props;
    const dispatch = (this.props.dispatch: PlainDispatch);
    const addListener = createReduxBoundAddListener('root');

    return (
      // $FlowFixMe-56 flow-typed object type is incompatible with statics of React.Component
      <AppNavigator
        navigation={addNavigationHelpers({
          state: nav,
          // $FlowFixMe flow-typed says react-navigation expects `dispatch` to return boolean
          dispatch,
          addListener,
        })}
      />
    );
  }
}

export default connect((state: GlobalState) => ({
  nav: getNav(state),
}))(AppWithNavigation);
