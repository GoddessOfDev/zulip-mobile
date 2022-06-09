/* @flow strict-local */
import React, { useEffect } from 'react';
import type { Node, ComponentType } from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import * as NavigationService from '../nav/NavigationService';
import * as logging from '../utils/logging';
import ReactionUserList from './ReactionUserList';
import { connect } from '../react-redux';
import type { Dispatch, Message, UserId } from '../types';
import Screen from '../common/Screen';
import ZulipTextIntl from '../common/ZulipTextIntl';
import ZulipText from '../common/ZulipText';
import { getOwnUserId } from '../selectors';
import aggregateReactions from './aggregateReactions';
import styles from '../styles';
import { materialTopTabNavigatorConfig } from '../styles/tabs';
import Emoji from '../emoji/Emoji';
import { emojiTypeFromReactionType } from '../emoji/data';
import { navigateBack } from '../nav/navActions';
import { usePrevious } from '../reactUtils';

// The tab navigator we make here has a dynamic set of route names, but they
// all take `void` for parameters.
type NavParamList = {| +[name: string]: void |};

const Tab = createMaterialTopTabNavigator<NavParamList>();

type OuterProps = $ReadOnly<{|
  // These should be passed from React Navigation
  navigation: AppNavigationProp<'message-reactions'>,
  route: RouteProp<'message-reactions', {| reactionName?: string, messageId: number |}>,
|}>;

type SelectorProps = $ReadOnly<{|
  message: Message | void,
  ownUserId: UserId,
|}>;

type Props = $ReadOnly<{|
  ...OuterProps,

  // from `connect`
  dispatch: Dispatch,
  ...SelectorProps,
|}>;

/**
 * A screen showing who made what reaction on a given message.
 *
 * The `reactionName` nav-prop controls what reaction is focused when the
 * screen first appears.
 */
function MessageReactionsScreenInner(props: Props): Node {
  useEffect(() => {
    if (props.message === undefined) {
      const { messageId } = props.route.params;
      logging.warn(
        'MessageReactionsScreen unexpectedly created without props.message; '
          + 'message with messageId is missing in state.messages',
        { messageId },
      );
    }
  }, [props.message, props.route.params]);

  const prevMessage = usePrevious(props.message);
  useEffect(() => {
    if (prevMessage !== undefined && props.message === undefined) {
      // The message was present, but got purged (currently only caused by a
      // REGISTER_COMPLETE following a dead event queue), so go back.
      NavigationService.dispatch(navigateBack());
    }
  }, [prevMessage, props.message]);

  const { message, route, ownUserId } = props;
  const { reactionName } = route.params;

  const content: Node = (() => {
    if (message === undefined) {
      return <View style={styles.flexed} />;
    } else if (message.reactions.length === 0) {
      return (
        <View style={[styles.flexed, styles.center]}>
          <ZulipTextIntl style={styles.largerText} text="No reactions" />
        </View>
      );
    } else {
      const aggregatedReactions = aggregateReactions(message.reactions, ownUserId);

      return (
        <View style={styles.flexed}>
          <Tab.Navigator
            backBehavior="none"
            // The user may have originally navigated here to look at a reaction
            // that's since been removed.  Ignore the nav hint in that case.
            initialRouteName={
              aggregatedReactions.some(aR => aR.name === reactionName) ? reactionName : undefined
            }
            {...materialTopTabNavigatorConfig()}
            swipeEnabled
          >
            {
              // Generate tabs for the reaction list. The tabs depend
              // on the distinct reactions on the message.
            }
            {aggregatedReactions.map(aggregatedReaction => (
              // Each tab corresponds to an aggregated reaction, and has a user list.
              <Tab.Screen
                key={aggregatedReaction.name}
                name={aggregatedReaction.name}
                component={() => <ReactionUserList reactedUserIds={aggregatedReaction.users} />}
                options={{
                  tabBarLabel: () => (
                    <View style={styles.row}>
                      <Emoji
                        code={aggregatedReaction.code}
                        type={emojiTypeFromReactionType(aggregatedReaction.type)}
                      />
                      <ZulipText style={styles.paddingLeft} text={`${aggregatedReaction.count}`} />
                    </View>
                  ),
                }}
              />
            ))}
          </Tab.Navigator>
        </View>
      );
    }
  })();

  return (
    <Screen title="Reactions" scrollEnabled={false}>
      {content}
    </Screen>
  );
}

const MessageReactionsScreen: ComponentType<OuterProps> = connect<SelectorProps, _, _>(
  (state, props) => ({
    // message *can* be undefined; see componentDidUpdate for explanation and handling.
    message: state.messages.get(props.route.params.messageId),
    ownUserId: getOwnUserId(state),
  }),
)(MessageReactionsScreenInner);

export default MessageReactionsScreen;
