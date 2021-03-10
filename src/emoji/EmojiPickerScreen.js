/* @flow strict-local */

import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import * as NavigationService from '../nav/NavigationService';
import * as api from '../api';
import { unicodeCodeByName } from './codePointMap';
import { Screen } from '../common';
import EmojiRow from './EmojiRow';
import { getFilteredEmojis } from './data';
import type { RealmEmojiById, Auth, Dispatch, ReactionType } from '../types';
import { connect } from '../react-redux';
import { getAuth, getActiveImageEmojiByName } from '../selectors';
import { navigateBack } from '../nav/navActions';
import zulipExtraEmojiMap from './zulipExtraEmojiMap';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'emoji-picker'>,
  route: RouteProp<'emoji-picker', {| messageId: number |}>,

  activeImageEmojiByName: RealmEmojiById,
  auth: Auth,
  dispatch: Dispatch,
|}>;

type State = {|
  filter: string,
|};

class EmojiPickerScreen extends PureComponent<Props, State> {
  state = {
    filter: '',
  };

  handleInputChange = (text: string) => {
    this.setState({
      filter: text.toLowerCase(),
    });
  };

  getReactionTypeAndCode = (
    emojiName: string,
  ): {| reactionType: ReactionType, emojiCode: string |} => {
    const { activeImageEmojiByName } = this.props;
    const imageEmoji = activeImageEmojiByName[emojiName];
    if (imageEmoji) {
      return {
        reactionType: zulipExtraEmojiMap[emojiName] ? 'zulip_extra_emoji' : 'realm_emoji',
        emojiCode: imageEmoji.code,
      };
    }
    return { reactionType: 'unicode_emoji', emojiCode: unicodeCodeByName[emojiName] };
  };

  addReaction = (emojiName: string) => {
    const { auth, route } = this.props;
    const { messageId } = route.params;

    const { reactionType, emojiCode } = this.getReactionTypeAndCode(emojiName);
    api.emojiReactionAdd(auth, messageId, reactionType, emojiCode, emojiName);
    NavigationService.dispatch(navigateBack());
  };

  render() {
    const { activeImageEmojiByName } = this.props;
    const { filter } = this.state;

    const emojiNames = getFilteredEmojis(filter, activeImageEmojiByName);

    return (
      <Screen search scrollEnabled={false} searchBarOnChange={this.handleInputChange}>
        <FlatList
          keyboardShouldPersistTaps="always"
          initialNumToRender={20}
          data={emojiNames}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <EmojiRow
              type={item.emoji_type}
              code={item.code}
              name={item.name}
              onPress={this.addReaction}
            />
          )}
        />
      </Screen>
    );
  }
}

export default connect(state => ({
  activeImageEmojiByName: getActiveImageEmojiByName(state),
  auth: getAuth(state),
}))(EmojiPickerScreen);
