/* @flow */
import type { NavigationNavigateAction } from 'react-navigation';

import {
  REHYDRATE,
  APP_ONLINE,
  APP_STATE,
  DEAD_QUEUE,
  INIT_SAFE_AREA_INSETS,
  APP_ORIENTATION,
  START_EDIT_MESSAGE,
  CANCEL_EDIT_MESSAGE,
  DEBUG_FLAG_TOGGLE,
  ACCOUNT_SWITCH,
  REALM_ADD,
  ACCOUNT_REMOVE,
  LOGIN_SUCCESS,
  LOGOUT,
  REALM_INIT,
  GOT_PUSH_TOKEN,
  UNACK_PUSH_TOKEN,
  ACK_PUSH_TOKEN,
  MESSAGE_FETCH_START,
  MESSAGE_FETCH_COMPLETE,
  MARK_MESSAGES_READ,
  INITIAL_FETCH_START,
  INITIAL_FETCH_COMPLETE,
  INIT_REALM_EMOJI,
  INIT_REALM_FILTER,
  SETTINGS_CHANGE,
  DRAFT_UPDATE,
  DO_NARROW,
  PRESENCE_RESPONSE,
  MESSAGE_SEND_START,
  MESSAGE_SEND_COMPLETE,
  DELETE_OUTBOX_MESSAGE,
  TOGGLE_OUTBOX_SENDING,
  EVENT_MESSAGE_DELETE,
  EVENT_USER_GROUP_ADD,
  EVENT_USER_GROUP_REMOVE,
  EVENT_USER_GROUP_UPDATE,
  EVENT_USER_GROUP_ADD_MEMBERS,
  EVENT_USER_GROUP_REMOVE_MEMBERS,
  EVENT_STREAM_ADD,
  EVENT_STREAM_REMOVE,
  EVENT_STREAM_UPDATE,
  EVENT_STREAM_OCCUPY,
  EVENT_TYPING_START,
  EVENT_TYPING_STOP,
  EVENT_NEW_MESSAGE,
  EVENT_REACTION_ADD,
  EVENT_REACTION_REMOVE,
  EVENT_PRESENCE,
  EVENT_UPDATE_GLOBAL_NOTIFICATIONS_SETTINGS,
  EVENT_UPDATE_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  EVENT_USER_ADD,
  CLEAR_TYPING,
  INIT_ALERT_WORDS,
  INIT_STREAMS,
  INIT_TOPICS,
  INIT_SUBSCRIPTIONS,
  EVENT_MUTED_TOPICS,
  EVENT_REALM_FILTERS,
  EVENT_USER_REMOVE,
  EVENT_USER_UPDATE,
  EVENT_REALM_EMOJI_UPDATE,
  EVENT_UPDATE_DISPLAY_SETTINGS,
  EVENT_SUBSCRIPTION,
} from './actionConstants';

import type { MessageEvent, PresenceEvent } from './api/eventTypes';

import type {
  Dimensions,
  Orientation,
  GlobalState,
  Message,
  MessagesState,
  Outbox,
  Narrow,
  Reaction,
  Identity,
  User,
  UserGroup,
  InitialData,
  RealmFilter,
  Stream,
  Subscription,
  Topic,
  PresenceState,
  RealmEmojiState,
  SettingsState,
  CaughtUpState,
  MuteState,
  AlertWordsState,
} from './types';

/**
 * Dispatched by redux-persist when the stored state is loaded.
 *
 * It can be very convenient to pass `payload` to selectors, but beware it's
 * incomplete.  At a minimum, reducers should always separately handle the
 * case where the state is empty or has `null` properties before passing the
 * object to any selector.
 *
 * @prop payload A version of the global Redux state, as persisted by the
 *     app's previous runs.  This will be empty on first startup or if the
 *     persisted store is just missing keys, and will have `null` at each
 *     key where an error was encountered in reading the persisted store.
 *     In any case it will only contain the keys we configure to be persisted.
 * @prop error
 */
type RehydrateAction = {|
  type: typeof REHYDRATE,
  payload: GlobalState | { accounts: null } | {||} | void,
  error: ?Object,
|};

type AppOnlineAction = {|
  type: typeof APP_ONLINE,
  isOnline: boolean,
|};

type AppStateAction = {|
  type: typeof APP_STATE,
  isActive: boolean,
|};

type DeadQueueAction = {|
  type: typeof DEAD_QUEUE,
|};

type InitSafeAreaInsetsAction = {|
  type: typeof INIT_SAFE_AREA_INSETS,
  safeAreaInsets: Dimensions,
|};

type AppOrientationAction = {|
  type: typeof APP_ORIENTATION,
  orientation: Orientation,
|};

type StartEditMessageAction = {|
  type: typeof START_EDIT_MESSAGE,
  messageId: number,
  message: string,
  topic: string,
|};

type CancelEditMessageAction = {|
  type: typeof CANCEL_EDIT_MESSAGE,
|};

type DebugFlagToggleAction = {|
  type: typeof DEBUG_FLAG_TOGGLE,
  key: string,
  value: string,
|};

export type NavigateAction = NavigationNavigateAction;

type AccountSwitchAction = {|
  type: typeof ACCOUNT_SWITCH,
  index: number,
|};

type RealmAddAction = {|
  type: typeof REALM_ADD,
  realm: string,
|};

type AccountRemoveAction = {|
  type: typeof ACCOUNT_REMOVE,
  index: number,
|};

type LoginSuccessAction = {|
  type: typeof LOGIN_SUCCESS,
  realm: string,
  email: string,
  apiKey: string,
|};

type LogoutAction = {|
  type: typeof LOGOUT,
|};

type RealmInitAction = {|
  type: typeof REALM_INIT,
  data: InitialData,
|};

/** We learned the device token from the system.  See `SessionState`. */
type GotPushTokenAction = {|
  type: typeof GOT_PUSH_TOKEN,
  pushToken: string,
|};

/** We're about to tell the server to forget our device token. */
type UnackPushTokenAction = {|
  type: typeof UNACK_PUSH_TOKEN,
  identity: Identity,
|};

/** The server acknowledged our device token. */
type AckPushTokenAction = {|
  type: typeof ACK_PUSH_TOKEN,
  identity: Identity,
  pushToken: string,
|};

type MessageFetchStartAction = {|
  type: typeof MESSAGE_FETCH_START,
  narrow: Narrow,
  numBefore: number,
  numAfter: number,
|};

type MessageFetchCompleteAction = {|
  type: typeof MESSAGE_FETCH_COMPLETE,
  messages: Message[],
  narrow: Narrow,
  anchor: number,
  numBefore: number,
  numAfter: number,
|};

type MarkMessagesReadAction = {|
  type: typeof MARK_MESSAGES_READ,
  messageIds: number[],
|};

type InitialFetchStartAction = {|
  type: typeof INITIAL_FETCH_START,
|};

type InitialFetchCompleteAction = {|
  type: typeof INITIAL_FETCH_COMPLETE,
|};

type ServerEvent = {|
  id: number,
|};

type EventAlertWordsAction = {|
  type: typeof INIT_ALERT_WORDS,
  alertWords: AlertWordsState,
|};

type EventRealmFiltersAction = {|
  type: typeof EVENT_REALM_FILTERS,
  [string]: any,
|};

type EventUpdateGlobalNotificationsSettingsAction = {|
  ...ServerEvent,
  type: typeof EVENT_UPDATE_GLOBAL_NOTIFICATIONS_SETTINGS,
  notification_name: | 'enable_offline_push_notiications'
    | 'enable_online_push_notiications'
    | 'enable_stream_push_notifiations',
  setting: boolean,
|};

type EventSubscriptionAddAction = {|
  ...ServerEvent,
  type: typeof EVENT_SUBSCRIPTION,
  op: 'add',
  subscriptions: Subscription[],
|};

type EventSubscriptionRemoveAction = {|
  ...ServerEvent,
  type: typeof EVENT_SUBSCRIPTION,
  op: 'remove',
  subscriptions: Array<{
    name: string,
    stream_id: number,
  }>,
|};

type EventSubscriptionUpdateAction = {|
  ...ServerEvent,
  type: typeof EVENT_SUBSCRIPTION,
  op: 'update',
  email: string,
  name: string,
  property: string,
  stream_id: number,
  value: boolean | number | string,
|};

type EventSubscriptionPeerAddAction = {|
  ...ServerEvent,
  type: typeof EVENT_SUBSCRIPTION,
  op: 'peer_add',
  subscriptions: string[],
  user_id: number,
|};

type EventSubscriptionPeerRemoveAction = {|
  ...ServerEvent,
  type: typeof EVENT_SUBSCRIPTION,
  op: 'peer_remove',
  subscriptions: string[],
  user_id: number,
|};

type EventStreamAddAction = {|
  ...ServerEvent,
  type: typeof EVENT_STREAM_ADD,
  op: 'create',
  streams: Stream[],
|};

type EventStreamRemoveAction = {|
  ...ServerEvent,
  type: typeof EVENT_STREAM_REMOVE,
  op: 'delete',
  streams: Stream[],
|};

type EventStreamUpdateAction = {|
  ...ServerEvent,
  type: typeof EVENT_STREAM_UPDATE,
  op: 'update',
  stream_id: number,
  name: string,
  property: string,
  value: string,
|};

type EventStreamOccupyAction = {|
  ...ServerEvent,
  type: typeof EVENT_STREAM_OCCUPY,
  op: 'occupy',
  streams: Stream[],
|};

type EventNewMessageAction = {|
  ...$Diff<MessageEvent, { flags: mixed }>,
  type: typeof EVENT_NEW_MESSAGE,
  caughtUp: CaughtUpState,
  ownEmail: string,
|};

type EventMessageDeleteAction = {|
  type: typeof EVENT_MESSAGE_DELETE,
  messageId: number,
|};
type EventUpdateMessageAction = {|
  ...ServerEvent,
  type: typeof EVENT_UPDATE_MESSAGE,
  edit_timestamp: number,
  message_id: number,
  orig_content: string,
  orig_subject?: string,
  orig_rendered_content: string,
  prev_rendered_content_version: number,
  rendered_content: string,
  subject_links: string[],
  subject: string,
  user_id: number,
|};

type EventReactionCommon = {|
  ...ServerEvent,
  ...$Exact<Reaction>,
  message_id: number,
|};

type EventReactionAddAction = {|
  ...ServerEvent,
  ...EventReactionCommon,
  type: typeof EVENT_REACTION_ADD,
|};

type EventReactionRemoveAction = {|
  ...ServerEvent,
  ...EventReactionCommon,
  type: typeof EVENT_REACTION_REMOVE,
|};

type EventPresenceAction = {|
  ...PresenceEvent,
  type: typeof EVENT_PRESENCE,
|};

type EventTypingCommon = {|
  ...ServerEvent,
  ownEmail: string,
  recipients: Array<{
    user_id: number,
    email: string,
  }>,
  sender: {
    user_id: number,
    email: string,
  },
  time: number,
|};

type EventTypingStartAction = {|
  ...EventTypingCommon,
  type: typeof EVENT_TYPING_START,
  op: 'start',
|};

type EventTypingStopAction = {|
  ...EventTypingCommon,
  type: typeof EVENT_TYPING_STOP,
  op: 'stop',
|};

type EventUpdateMessageFlagsAction = {|
  ...ServerEvent,
  type: typeof EVENT_UPDATE_MESSAGE_FLAGS,
  all: boolean,
  allMessages: MessagesState,
  flag: string,
  messages: number[],
  operation: 'add' | 'remove',
|};

type EventUserAddAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_ADD,
  person: User,
|};

type EventUserRemoveAction = {|
  type: typeof EVENT_USER_REMOVE,
  // In reality there's more -- but this will prevent accidentally using
  // the type before going and adding those other properties here properly.
|};

type EventUserUpdateAction = {|
  type: typeof EVENT_USER_UPDATE,
  // In reality there's more -- but this will prevent accidentally using
  // the type before going and adding those other properties here properly.
|};

type EventMutedTopicsAction = {|
  ...ServerEvent,
  type: typeof EVENT_MUTED_TOPICS,
  muted_topics: MuteState,
|};

type EventUserGroupAddAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_GROUP_ADD,
  op: 'add',
  group: UserGroup,
|};

type EventUserGroupRemoveAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_GROUP_REMOVE,
  op: 'remove',
  group_id: number,
|};

type EventUserGroupUpdateAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_GROUP_UPDATE,
  op: 'update',
  group_id: number,
  data: { description?: string, name?: string },
|};

type EventUserGroupAddMembersAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_GROUP_ADD_MEMBERS,
  op: 'add_members',
  group_id: number,
  user_ids: number[],
|};

type EventUserGroupRemoveMembersAction = {|
  ...ServerEvent,
  type: typeof EVENT_USER_GROUP_REMOVE_MEMBERS,
  op: 'remove_members',
  group_id: number,
  user_ids: number[],
|};

type EventRealmEmojiUpdateAction = {|
  type: typeof EVENT_REALM_EMOJI_UPDATE,
  [string]: any,
|};

type EventUpdateDisplaySettingsAction = {|
  type: typeof EVENT_UPDATE_DISPLAY_SETTINGS,
  [string]: any,
|};

type EventReactionAction = EventReactionAddAction | EventReactionRemoveAction;

type EventStreamAction =
  | EventStreamAddAction
  | EventStreamRemoveAction
  | EventStreamUpdateAction
  | EventStreamOccupyAction;

type EventSubscriptionAction =
  | EventSubscriptionAddAction
  | EventSubscriptionRemoveAction
  | EventSubscriptionUpdateAction
  | EventSubscriptionPeerAddAction
  | EventSubscriptionPeerRemoveAction;

type EventTypingAction = EventTypingStartAction | EventTypingStopAction;

type EventUserAction = EventUserAddAction | EventUserRemoveAction | EventUserUpdateAction;

type EventUserGroupAction =
  | EventUserGroupAddAction
  | EventUserGroupRemoveAction
  | EventUserGroupUpdateAction
  | EventUserGroupAddMembersAction
  | EventUserGroupRemoveMembersAction;

/** Covers all actions we make from server events. */
export type EventAction =
  // Specific actions.
  | EventAlertWordsAction
  | EventMessageDeleteAction
  | EventMutedTopicsAction
  | EventNewMessageAction
  | EventPresenceAction
  | EventRealmEmojiUpdateAction
  | EventRealmFiltersAction
  | EventUpdateGlobalNotificationsSettingsAction
  | EventUpdateDisplaySettingsAction
  | EventUpdateMessageAction
  | EventUpdateMessageFlagsAction
  // Unions, found just above.
  | EventReactionAction
  | EventStreamAction
  | EventSubscriptionAction
  | EventTypingAction
  | EventUserAction
  | EventUserGroupAction
  // Dummy actions.
  | {| type: 'ignore' |}
  | {| type: 'unknown', event: {} |};

type InitRealmEmojiAction = {|
  type: typeof INIT_REALM_EMOJI,
  emojis: RealmEmojiState,
|};

type InitRealmFilterAction = {|
  type: typeof INIT_REALM_FILTER,
  filters: RealmFilter[],
|};

type SettingsChangeAction = {|
  type: typeof SETTINGS_CHANGE,
  update: $Shape<SettingsState>,
|};

type DraftUpdateAction = {|
  type: typeof DRAFT_UPDATE,
  narrow: Narrow,
  content: string,
|};

type DoNarrowAction = {|
  type: typeof DO_NARROW,
  narrow: Narrow,
|};

type PresenceResponseAction = {|
  type: typeof PRESENCE_RESPONSE,
  presence: PresenceState,
  serverTimestamp: number,
|};

type MessageSendStartAction = {|
  type: typeof MESSAGE_SEND_START,
  outbox: Outbox,
|};

type MessageSendCompleteAction = {|
  type: typeof MESSAGE_SEND_COMPLETE,
  local_message_id: number,
|};

type DeleteOutboxMessageAction = {|
  type: typeof DELETE_OUTBOX_MESSAGE,
  local_message_id: number,
|};

type ToggleOutboxSendingAction = {|
  type: typeof TOGGLE_OUTBOX_SENDING,
  sending: boolean,
|};

type ClearTypingAction = {|
  type: typeof CLEAR_TYPING,
  outdatedNotifications: string[],
|};

type InitStreamsAction = {|
  type: typeof INIT_STREAMS,
  streams: Stream[],
|};

type InitTopicsAction = {|
  type: typeof INIT_TOPICS,
  topics: Topic[],
  streamId: number,
|};

type InitSubscriptionsAction = {|
  type: typeof INIT_SUBSCRIPTIONS,
  subscriptions: Subscription[],
|};

//
// The `Action` union type.
//

type AccountAction =
  | AccountSwitchAction
  | RealmAddAction
  | AccountRemoveAction
  | LoginSuccessAction
  | LogoutAction;

type LoadingAction = DeadQueueAction | InitialFetchStartAction | InitialFetchCompleteAction;

type MessageAction = MarkMessagesReadAction | MessageFetchStartAction | MessageFetchCompleteAction;

type OutboxAction = MessageSendStartAction | MessageSendCompleteAction | DeleteOutboxMessageAction;

type RealmAction =
  | RealmInitAction
  | UnackPushTokenAction
  | AckPushTokenAction
  | InitRealmEmojiAction
  | InitRealmFilterAction;

type SessionAction =
  | RehydrateAction
  | AppStateAction
  | AppOnlineAction
  | InitSafeAreaInsetsAction
  | AppOrientationAction
  | DoNarrowAction
  | GotPushTokenAction
  | StartEditMessageAction
  | CancelEditMessageAction
  | DebugFlagToggleAction
  | ToggleOutboxSendingAction;

/** Covers all actions we ever `dispatch`. */
// The grouping here is completely arbitrary; don't worry about it.
export type Action =
  | EventAction
  | AccountAction
  | LoadingAction
  | MessageAction
  | OutboxAction
  | RealmAction
  | SessionAction
  | DraftUpdateAction
  | PresenceResponseAction
  | SettingsChangeAction
  | InitStreamsAction
  | InitSubscriptionsAction
  | InitTopicsAction
  | ClearTypingAction;
