/* @flow strict-local */
import React, { useState, useContext, useCallback } from 'react';
import type { Node } from 'react';
import { FlatList, View } from 'react-native';
import { TranslationContext } from '../boot/TranslationProvider';
import { createStyleSheet } from '../styles';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { useSelector } from '../react-redux';
import Input from '../common/Input';
import SelectableOptionRow from '../common/SelectableOptionRow';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import { getAuth, getOwnUserId } from '../selectors';
import { getUserStatus } from './userStatusesModel';
import { IconCancel, IconDone } from '../common/Icons';
import statusSuggestions from './userStatusTextSuggestions';
import * as api from '../api';

const styles = createStyleSheet({
  statusTextInput: {
    margin: 16,
  },
  buttonsWrapper: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    margin: 8,
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'user-status'>,
  route: RouteProp<'user-status', void>,
|}>;

export default function UserStatusScreen(props: Props): Node {
  const { navigation } = props;

  const auth = useSelector(getAuth);
  const ownUserId = useSelector(getOwnUserId);
  const userStatusText = useSelector(state => getUserStatus(state, ownUserId).status_text);

  const [textInputValue, setTextInputValue] = useState<string>(userStatusText ?? '');
  const _ = useContext(TranslationContext);

  const sendToServer = useCallback(
    partialUserStatus => {
      api.updateUserStatus(auth, partialUserStatus);
      navigation.goBack();
    },
    [navigation, auth],
  );

  const handlePressUpdate = useCallback(() => {
    sendToServer({ status_text: textInputValue });
  }, [textInputValue, sendToServer]);

  const handlePressClear = useCallback(() => {
    setTextInputValue('');
    sendToServer({ status_text: null });
  }, [sendToServer]);

  return (
    <Screen title="User status">
      <Input
        autoFocus
        maxLength={60}
        style={styles.statusTextInput}
        placeholder="What’s your status?"
        value={textInputValue}
        onChangeText={setTextInputValue}
      />
      <FlatList
        data={statusSuggestions}
        keyboardShouldPersistTaps="always"
        keyExtractor={item => item}
        renderItem={({ item, index }) => (
          <SelectableOptionRow
            key={item}
            itemKey={item}
            title={item}
            selected={item === textInputValue}
            onRequestSelectionChange={itemKey => {
              setTextInputValue(_(itemKey));
            }}
          />
        )}
      />
      <View style={styles.buttonsWrapper}>
        <ZulipButton
          style={styles.button}
          secondary
          text="Clear"
          onPress={handlePressClear}
          Icon={IconCancel}
        />
        <ZulipButton
          style={styles.button}
          text="Update"
          onPress={handlePressUpdate}
          Icon={IconDone}
        />
      </View>
    </Screen>
  );
}
