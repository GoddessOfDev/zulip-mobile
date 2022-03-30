/* @flow strict-local */
import React, { useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { ComponentType, Node } from 'react';
import { Platform, View } from 'react-native';
import type { DocumentPickerResponse } from 'react-native-document-picker';
import type { LayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { compose } from 'redux';
import invariant from 'invariant';

import { usePrevious } from '../reactUtils';
import * as apiConstants from '../api/constants';
import { withSafeAreaInsets } from '../react-native-safe-area-context';
import { ThemeContext, BRAND_COLOR } from '../styles';
import type {
  Auth,
  Narrow,
  InputSelection,
  UserOrBot,
  Dispatch,
  GetText,
  Subscription,
  Stream,
  UserId,
  VideoChatProvider,
} from '../types';
import { connect } from '../react-redux';
import { withGetText } from '../boot/TranslationProvider';
import { draftUpdate, sendTypingStart, sendTypingStop } from '../actions';
import Touchable from '../common/Touchable';
import Input from '../common/Input';
import { showToast, showErrorAlert } from '../utils/info';
import { IconDone, IconSend } from '../common/Icons';
import {
  isConversationNarrow,
  isStreamNarrow,
  isStreamOrTopicNarrow,
  isTopicNarrow,
  streamIdOfNarrow,
  topicNarrow,
  topicOfNarrow,
} from '../utils/narrow';
import ComposeMenu from './ComposeMenu';
import getComposeInputPlaceholder from './getComposeInputPlaceholder';
import NotSubscribed from '../message/NotSubscribed';
import AnnouncementOnly from '../message/AnnouncementOnly';
import MentionWarnings from './MentionWarnings';
import {
  getAuth,
  getIsAdmin,
  getStreamInNarrow,
  getStreamsById,
  getVideoChatProvider,
  getRealm,
} from '../selectors';
import {
  getIsActiveStreamSubscribed,
  getIsActiveStreamAnnouncementOnly,
} from '../subscriptions/subscriptionSelectors';
import TopicAutocomplete from '../autocomplete/TopicAutocomplete';
import AutocompleteView from '../autocomplete/AutocompleteView';
import { getAllUsersById, getOwnUserId } from '../users/userSelectors';
import * as api from '../api';
import { ensureUnreachable } from '../generics';

/* eslint-disable no-shadow */

type SelectorProps = {|
  auth: Auth,
  ownUserId: UserId,
  allUsersById: Map<UserId, UserOrBot>,
  isAdmin: boolean,
  isAnnouncementOnly: boolean,
  isSubscribed: boolean,
  videoChatProvider: VideoChatProvider | null,
  mandatoryTopics: boolean,
  stream: Subscription | {| ...Stream, in_home_view: boolean |},
  streamsById: Map<number, Stream>,
|};

type OuterProps = $ReadOnly<{|
  /** The narrow shown in the message list.  Must be a conversation or stream. */
  // In particular `getDestinationNarrow` makes assumptions about the narrow
  // (and other code might too.)
  narrow: Narrow,

  onSend: (message: string, destinationNarrow: Narrow) => void,

  isEditing: boolean,

  /** The contents of the message that the ComposeBox should contain when it's first rendered */
  initialMessage?: string,
  /** The topic of the message that the ComposeBox should contain when it's first rendered */
  initialTopic?: string,

  /** Whether the topic input box should auto-foucs when the component renders.
   *
   * Passed through to the TextInput's autofocus prop. */
  autoFocusTopic?: boolean,
  /** Whether the message input box should auto-foucs when the component renders.
   *
   * Passed through to the TextInput's autofocus prop. */
  autoFocusMessage?: boolean,
|}>;

type Props = $ReadOnly<{|
  ...OuterProps,
  ...SelectorProps,

  // From 'withGetText'
  _: GetText,

  // from withSafeAreaInsets
  insets: EdgeInsets,

  // from `connect`
  dispatch: Dispatch,
  ...SelectorProps,
|}>;

// TODO(?): Could deduplicate with this type in ShareWrapper.
export type ValidationError = 'upload-in-progress' | 'message-empty' | 'mandatory-topic-empty';

const FOCUS_DEBOUNCE_TIME_MS = 16;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const updateTextInput = (textInput, text) => {
  if (textInput === null) {
    // Depending on the lifecycle events this function is called from,
    // this might not be set yet.
    return;
  }

  // `textInput` is untyped; see definition.
  textInput.setNativeProps({ text });
};

function ComposeBoxInner(props: Props): Node {
  const {
    narrow,
    onSend,
    isEditing,
    initialMessage,
    initialTopic,
    autoFocusTopic,
    autoFocusMessage,
    auth,
    ownUserId,
    allUsersById,
    isAdmin,
    isAnnouncementOnly,
    isSubscribed,
    videoChatProvider,
    mandatoryTopics,
    stream,
    streamsById,
    _,
    insets,
    dispatch,
  } = props;

  // We should replace the fixme with
  // `React$ElementRef<typeof TextInput>` when we can. Currently, that
  // would make `.current` be `any(implicit)`, which we don't want;
  // this is probably down to bugs in Flow's special support for React.
  const messageInputRef = React.useRef<$FlowFixMe | null>(null);
  const topicInputRef = React.useRef<$FlowFixMe | null>(null);

  const mentionWarnings = React.useRef<React$ElementRef<typeof MentionWarnings> | null>(null);

  const inputBlurTimeoutId = useRef<?TimeoutID>(null);

  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(20);
  const [numUploading, setNumUploading] = useState<number>(0);

  const [focusState, setFocusState] = useState<{|
    message: boolean,
    topic: boolean,

    /** Almost the same as message || topic ... except debounced, to stay
     * true while those flip from false/true to true/false and back. */
    either: boolean,
  |}>({
    message: false,
    topic: false,
    either: false,
  });

  // The topic input is currently uncontrolled, for performance concerns;
  // see #2738. That means if you change this state, it won't cause the
  // input value to change; callers should call updateTextInput for that.
  // But if callers do that, they should *also* update this state, because
  // it's our best read of what the actual value is, so it needs to be
  // up-to-date. That's what setTopicInputValue (far below) is for; it does
  // both.
  // TODO(?): Make custom Hook to encapsulate this uncontrolled-input logic.
  const [topicInputState, setTopicInputState] = useState<{| value: string |}>({
    value: initialTopic ?? (isTopicNarrow(narrow) ? topicOfNarrow(narrow) : ''),
  });

  // The message input is currently uncontrolled, for performance concerns;
  // see #2738. That means if you change this state, it won't cause the
  // input value to change; callers should call updateTextInput for that.
  // But if callers do that, they should *also* update this state, because
  // it's our best read of what the actual value is, so it needs to be
  // up-to-date. That's what setMessageInputValue (far below) is for; it does
  // both.
  // TODO(?): Make custom Hook to encapsulate this uncontrolled-input logic.
  const [messageInputState, setMessageInputState] = useState<{|
    value: string,
    selection: InputSelection,
  |}>({
    value: initialMessage ?? '',
    selection: { start: 0, end: 0 },
  });

  useEffect(
    () => () => {
      clearTimeout(inputBlurTimeoutId.current);
      inputBlurTimeoutId.current = null;
    },
    [],
  );

  const prevMessageInputState = usePrevious(messageInputState);
  useEffect(() => {
    const messageInputValue = messageInputState.value;
    const prevMessageInputValue = prevMessageInputState?.value;

    if (prevMessageInputValue !== messageInputValue) {
      if (messageInputValue.length === 0) {
        dispatch(sendTypingStop(narrow));
      } else {
        dispatch(sendTypingStart(narrow));
      }
      if (!isEditing) {
        dispatch(draftUpdate(narrow, messageInputValue));
      }
    }
  }, [dispatch, isEditing, narrow, messageInputState, prevMessageInputState]);

  const updateIsFocused = useCallback(() => {
    setFocusState(state => ({ ...state, either: state.message || state.topic }));
  }, []);

  const getCanSelectTopic = useCallback(() => {
    if (isEditing) {
      return isStreamOrTopicNarrow(narrow);
    }
    if (!isStreamNarrow(narrow)) {
      return false;
    }
    return focusState.either;
  }, [isEditing, narrow, focusState.either]);

  const handleMessageChange = useCallback((value: string) => {
    setMessageInputState(state => ({ ...state, value }));
    setIsMenuExpanded(false);
  }, []);

  const setMessageInputValue = useCallback(
    (updater: (typeof messageInputState) => string) => {
      setMessageInputState(state => {
        const newValue = updater(state);

        // TODO: try to do something less dirty for this; see
        //   https://github.com/zulip/zulip-mobile/pull/5312#discussion_r838866807
        updateTextInput(messageInputRef.current, newValue);

        return { ...state, value: newValue };
      });
      setIsMenuExpanded(false);
    },
    [messageInputState],
  );

  const handleTopicChange = useCallback((value: string) => {
    setTopicInputState({ value });
    setIsMenuExpanded(false);
  }, []);

  const setTopicInputValue = useCallback(
    (topic: string) => {
      updateTextInput(topicInputRef.current, topic);
      handleTopicChange(topic);
    },
    [handleTopicChange],
  );

  const insertMessageTextAtCursorPosition = useCallback(
    (text: string) => {
      setMessageInputValue(
        state =>
          state.value.slice(0, state.selection.start)
          + text
          + state.value.slice(state.selection.end, state.value.length),
      );
    },
    [setMessageInputValue],
  );

  const insertVideoCallLinkAtCursorPosition = useCallback(
    (url: string) => {
      const linkMessage = _('Click to join video call');
      const linkText = `[${linkMessage}](${url})`;

      insertMessageTextAtCursorPosition(linkText);
    },
    [insertMessageTextAtCursorPosition, _],
  );

  const insertVideoCallLink = useCallback(
    (videoChatProvider: VideoChatProvider) => {
      if (videoChatProvider.name === 'jitsi_meet') {
        // This is meant to align with the way the webapp generates jitsi video
        // call IDs. That logic can be found in the ".video_link" click handler
        // in static/js/compose.js.
        const videoCallId = randomInt(100000000000000, 999999999999999);
        const videoCallUrl = `${videoChatProvider.jitsiServerUrl}/${videoCallId}`;
        insertVideoCallLinkAtCursorPosition(videoCallUrl);
      }
    },
    [insertVideoCallLinkAtCursorPosition],
  );

  const insertAttachment = useCallback(
    async (attachments: $ReadOnlyArray<DocumentPickerResponse>) => {
      setNumUploading(n => n + 1);
      try {
        const fileNames: string[] = [];
        const placeholders: string[] = [];
        for (let i = 0; i < attachments.length; i++) {
          const fileName = attachments[i].name ?? _('Attachment {num}', { num: i + 1 });
          fileNames.push(fileName);
          const placeholder = `[${_('Uploading {fileName}...', { fileName })}]()`;
          placeholders.push(placeholder);
        }
        insertMessageTextAtCursorPosition(placeholders.join('\n\n'));

        for (let i = 0; i < attachments.length; i++) {
          const fileName = fileNames[i];
          const placeholder = placeholders[i];
          let response = null;
          try {
            response = await api.uploadFile(auth, attachments[i].uri, fileName);
          } catch {
            showToast(_('Failed to upload file: {fileName}', { fileName }));
            setMessageInputValue(state =>
              state.value.replace(
                placeholder,
                `[${_('Failed to upload file: {fileName}', { fileName })}]()`,
              ),
            );
            continue;
          }

          const linkText = `[${fileName}](${response.uri})`;
          setMessageInputValue(state =>
            state.value.indexOf(placeholder) !== -1
              ? state.value.replace(placeholder, linkText)
              : `${state.value}\n${linkText}`,
          );
        }
      } finally {
        setNumUploading(n => n - 1);
      }
    },
    [insertMessageTextAtCursorPosition, _, auth, setMessageInputValue],
  );

  const handleComposeMenuToggle = useCallback(() => {
    setIsMenuExpanded(x => !x);
  }, []);

  const handleLayoutChange = useCallback((event: LayoutEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  const handleTopicAutocomplete = useCallback(
    (topic: string) => {
      setTopicInputValue(topic);
      messageInputRef.current?.focus();
    },
    [setTopicInputValue],
  );

  // See JSDoc on 'onAutocomplete' in 'AutocompleteView.js'.
  const handleMessageAutocomplete = useCallback(
    (completedText: string, completion: string, lastWordPrefix: string) => {
      setMessageInputValue(() => completedText);

      if (lastWordPrefix === '@') {
        // https://github.com/eslint/eslint/issues/11045
        // eslint-disable-next-line no-unused-expressions
        mentionWarnings.current?.handleMentionSubscribedCheck(completion);
      }
    },
    [setMessageInputValue],
  );

  const handleMessageSelectionChange = useCallback(
    (event: { +nativeEvent: { +selection: InputSelection, ... }, ... }) => {
      const { selection } = event.nativeEvent;
      setMessageInputState(state => ({ ...state, selection }));
    },
    [],
  );

  const handleMessageFocus = useCallback(() => {
    if (
      !isEditing
      && isStreamNarrow(narrow)
      && !focusState.either
      && topicInputState.value === ''
    ) {
      // We weren't showing the topic input when the user tapped on the input
      // to focus it, but we're about to show it.  Focus that, if the user
      // hasn't already selected a topic.
      topicInputRef.current?.focus();
    } else {
      setFocusState(state => ({ ...state, message: true, either: true }));
      setIsMenuExpanded(false);
    }
  }, [isEditing, narrow, focusState.either, topicInputState.value]);

  const handleMessageBlur = useCallback(() => {
    setFocusState(state => ({ ...state, message: false }));
    setIsMenuExpanded(false);
    dispatch(sendTypingStop(narrow));
    // give a chance to the topic input to get the focus
    clearTimeout(inputBlurTimeoutId.current);
    inputBlurTimeoutId.current = setTimeout(updateIsFocused, FOCUS_DEBOUNCE_TIME_MS);
  }, [dispatch, narrow, updateIsFocused]);

  const handleTopicFocus = useCallback(() => {
    setFocusState(state => ({ ...state, topic: true, either: true }));
    setIsMenuExpanded(false);
  }, []);

  const handleTopicBlur = useCallback(() => {
    setFocusState(state => ({ ...state, topic: false }));
    setIsMenuExpanded(false);
    // give a chance to the message input to get the focus
    clearTimeout(inputBlurTimeoutId.current);
    inputBlurTimeoutId.current = setTimeout(updateIsFocused, FOCUS_DEBOUNCE_TIME_MS);
  }, [updateIsFocused]);

  const handleInputTouchStart = useCallback(() => {
    setIsMenuExpanded(false);
  }, []);

  // TODO: This can just be `const destinationNarrow: Narrow`
  const getDestinationNarrow = useCallback((): Narrow => {
    if (isStreamNarrow(narrow) || (isTopicNarrow(narrow) && isEditing)) {
      const streamId = streamIdOfNarrow(narrow);
      const topic = topicInputState.value.trim() || apiConstants.NO_TOPIC_TOPIC;
      return topicNarrow(streamId, topic);
    }
    invariant(isConversationNarrow(narrow), 'destination narrow must be conversation');
    return narrow;
  }, [isEditing, narrow, topicInputState.value]);

  // TODO: This can just be `const validationErrors: $ReadOnlyArray<ValidationError>`
  const getValidationErrors = useCallback((): $ReadOnlyArray<ValidationError> => {
    const destinationNarrow = getDestinationNarrow();
    const { value: messageInputValue } = messageInputState;

    const result = [];

    if (
      isTopicNarrow(destinationNarrow)
      && topicOfNarrow(destinationNarrow) === apiConstants.NO_TOPIC_TOPIC
      && mandatoryTopics
    ) {
      result.push('mandatory-topic-empty');
    }

    if (messageInputValue.trim().length === 0) {
      result.push('message-empty');
    }

    if (numUploading > 0) {
      result.push('upload-in-progress');
    }

    return result;
  }, [getDestinationNarrow, mandatoryTopics, numUploading, messageInputState]);

  const handleSubmit = useCallback(() => {
    const { value: messageInputValue } = messageInputState;
    const destinationNarrow = getDestinationNarrow();
    const validationErrors = getValidationErrors();

    if (validationErrors.length > 0) {
      const msg = validationErrors
        .map(error => {
          // 'upload-in-progress' | 'message-empty' | 'mandatory-topic-empty'
          switch (error) {
            case 'upload-in-progress':
              return _('Please wait for the upload to complete.');
            case 'mandatory-topic-empty':
              return _('Please specify a topic.');
            case 'message-empty':
              return _('Message is empty.');
            default:
              ensureUnreachable(error);
              throw new Error();
          }
        })
        .join('\n\n');

      // TODO is this enough to handle the `isEditing` case? See
      //   https://github.com/zulip/zulip-mobile/pull/4798#discussion_r731341400.
      showErrorAlert(isEditing ? _('Message not saved') : _('Message not sent'), msg);
      return;
    }

    onSend(messageInputValue, destinationNarrow);

    setMessageInputValue(() => '');

    if (mentionWarnings.current) {
      mentionWarnings.current.clearMentionWarnings();
    }

    dispatch(sendTypingStop(destinationNarrow));
  }, [
    getDestinationNarrow,
    getValidationErrors,
    _,
    dispatch,
    isEditing,
    onSend,
    setMessageInputValue,
    messageInputState,
  ]);

  const inputMarginPadding = useMemo(
    () => ({
      paddingHorizontal: 8,
      paddingVertical: Platform.select({
        ios: 8,
        android: 2,
      }),
    }),
    [],
  );

  const { backgroundColor } = useContext(ThemeContext);
  const styles = useMemo(
    () => ({
      wrapper: {
        flexShrink: 1,
        maxHeight: '60%',
      },
      autocompleteWrapper: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
      },
      composeBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        flexShrink: 1,
      },
      composeText: {
        flex: 1,
        paddingVertical: 8,
      },
      submitButtonContainer: {
        padding: 8,
      },
      submitButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BRAND_COLOR,
        borderRadius: 32,
        padding: 8,
      },
      topicInput: {
        borderWidth: 0,
        borderRadius: 5,
        marginBottom: 8,
        ...inputMarginPadding,
      },
      composeTextInput: {
        borderWidth: 0,
        borderRadius: 5,
        fontSize: 15,
        flexShrink: 1,
        ...inputMarginPadding,
        backgroundColor,
      },
    }),
    [inputMarginPadding, backgroundColor],
  );

  const submitButtonHitSlop = useMemo(() => ({ top: 8, right: 8, bottom: 8, left: 8 }), []);

  const { value: messageInputValue, selection: messageInputSelection } = messageInputState;

  if (!isSubscribed) {
    return <NotSubscribed narrow={narrow} />;
  } else if (isAnnouncementOnly && !isAdmin) {
    return <AnnouncementOnly />;
  }

  const placeholder = getComposeInputPlaceholder(narrow, ownUserId, allUsersById, streamsById);
  const style = {
    paddingBottom: insets.bottom,
    backgroundColor: 'hsla(0, 0%, 50%, 0.1)',
  };

  const SubmitButtonIcon = isEditing ? IconDone : IconSend;
  const submitButtonDisabled = getValidationErrors().length > 0;

  return (
    <View style={styles.wrapper}>
      <MentionWarnings narrow={narrow} stream={stream} ref={mentionWarnings} />
      <View style={[styles.autocompleteWrapper, { marginBottom: height }]}>
        <TopicAutocomplete
          isFocused={focusState.topic}
          narrow={narrow}
          text={topicInputState.value}
          onAutocomplete={handleTopicAutocomplete}
        />
        <AutocompleteView
          isFocused={focusState.message}
          selection={messageInputSelection}
          text={messageInputValue}
          onAutocomplete={handleMessageAutocomplete}
        />
      </View>
      <View style={[styles.composeBox, style]} onLayout={handleLayoutChange}>
        <ComposeMenu
          destinationNarrow={getDestinationNarrow()}
          expanded={isMenuExpanded}
          insertAttachment={insertAttachment}
          insertVideoCallLink={
            videoChatProvider !== null ? () => insertVideoCallLink(videoChatProvider) : null
          }
          onExpandContract={handleComposeMenuToggle}
        />
        <View style={styles.composeText}>
          <Input
            style={[
              styles.topicInput,
              { backgroundColor },
              // This is a really dumb hack to work around
              // https://github.com/facebook/react-native/issues/16405.
              // Someone suggests in that thread that { position: absolute,
              // zIndex: -1 } will work, which it does not (the border of the
              // TextInput is still visible, even with very negative zIndex
              // values). Someone else suggests { transform: [{scale: 0}] }
              // (https://stackoverflow.com/a/49817873), which doesn't work
              // either. However, a combinarion of the two of them seems to
              // work.
              !getCanSelectTopic() && { position: 'absolute', transform: [{ scale: 0 }] },
            ]}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            placeholder="Topic"
            defaultValue={topicInputState.value}
            autoFocus={autoFocusTopic}
            selectTextOnFocus
            textInputRef={topicInputRef}
            onChangeText={handleTopicChange}
            onFocus={handleTopicFocus}
            onBlur={handleTopicBlur}
            onTouchStart={handleInputTouchStart}
            onSubmitEditing={() => messageInputRef.current?.focus()}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Input
            // TODO(#5291): Don't switch between true/false for multiline
            multiline={!isMenuExpanded}
            style={styles.composeTextInput}
            underlineColorAndroid="transparent"
            placeholder={placeholder}
            defaultValue={messageInputValue}
            autoFocus={autoFocusMessage}
            textInputRef={messageInputRef}
            onBlur={handleMessageBlur}
            onChangeText={handleMessageChange}
            onFocus={handleMessageFocus}
            onSelectionChange={handleMessageSelectionChange}
            onTouchStart={handleInputTouchStart}
          />
        </View>
        <View style={styles.submitButtonContainer}>
          <View
            // Mask the Android ripple-on-touch so it doesn't extend
            //   outside the circle…
            // TODO: `Touchable` should do this, and the `hitSlop`
            //   workaround below.
            style={{
              borderRadius: styles.submitButton.borderRadius,
              overflow: 'hidden',
            }}
            // …and don't defeat the `Touchable`'s `hitSlop`.
            hitSlop={submitButtonHitSlop}
          >
            <Touchable
              style={[styles.submitButton, { opacity: submitButtonDisabled ? 0.25 : 1 }]}
              onPress={handleSubmit}
              accessibilityLabel={isEditing ? _('Save message') : _('Send message')}
              hitSlop={submitButtonHitSlop}
            >
              <SubmitButtonIcon size={16} color="white" />
            </Touchable>
          </View>
        </View>
      </View>
    </View>
  );
}

// TODO: Use Hooks, not HOCs.
const ComposeBox: ComponentType<OuterProps> = compose(
  connect<SelectorProps, _, _>((state, props) => ({
    auth: getAuth(state),
    ownUserId: getOwnUserId(state),
    allUsersById: getAllUsersById(state),
    isAdmin: getIsAdmin(state),
    isAnnouncementOnly: getIsActiveStreamAnnouncementOnly(state, props.narrow),
    isSubscribed: getIsActiveStreamSubscribed(state, props.narrow),
    stream: getStreamInNarrow(state, props.narrow),
    streamsById: getStreamsById(state),
    videoChatProvider: getVideoChatProvider(state),
    mandatoryTopics: getRealm(state).mandatoryTopics,
  })),
  withSafeAreaInsets,
)(withGetText(ComposeBoxInner));

export default ComposeBox;
