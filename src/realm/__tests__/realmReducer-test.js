/* @flow strict-local */
import deepFreeze from 'deep-freeze';

import realmReducer from '../realmReducer';
import {
  ACCOUNT_SWITCH,
  EVENT_REALM_EMOJI_UPDATE,
  EVENT_UPDATE_DISPLAY_SETTINGS,
  EVENT_REALM_FILTERS,
} from '../../actionConstants';
import * as eg from '../../__tests__/lib/exampleData';

describe('realmReducer', () => {
  describe('ACCOUNT_SWITCH', () => {
    test('resets state', () => {
      const initialState = eg.plusReduxState.realm;

      const action = deepFreeze({
        type: ACCOUNT_SWITCH,
        index: 1,
      });

      const expectedState = eg.baseReduxState.realm;

      const actualState = realmReducer(initialState, action);

      expect(actualState).toEqual(expectedState);
    });
  });

  describe('EVENT_UPDATE_DISPLAY_SETTINGS', () => {
    test('change the display settings', () => {
      const initialState = eg.reduxStatePlus({
        realm: {
          ...eg.plusReduxState.realm,
          twentyFourHourTime: false,
          emoji: {
            customEmoji1: {
              code: 'customEmoji1',
              deactivated: false,
              name: 'Custom Emoji 1',
              source_url: 'https://emoji.zulip.invalid/?id=custom1',
            },
          },
        },
      }).realm;

      const action = deepFreeze({
        type: EVENT_UPDATE_DISPLAY_SETTINGS,
        id: 1,
        setting: true,
        setting_name: 'twenty_four_hour_time',
      });

      const expectedState = {
        ...initialState,
        twentyFourHourTime: true,
      };

      const actualState = realmReducer(initialState, action);

      expect(actualState).toEqual(expectedState);
    });
  });

  describe('EVENT_REALM_EMOJI_UPDATE', () => {
    test('update state to new realm_emoji', () => {
      const initialState = eg.reduxStatePlus({
        realm: {
          ...eg.plusReduxState.realm,
          twentyFourHourTime: false,
          emoji: {},
          filters: [],
        },
      }).realm;

      const action = deepFreeze({
        id: 4,
        realm_emoji: {
          customEmoji1: {
            code: 'customEmoji1',
            deactivated: false,
            name: 'Custom Emoji 1',
            source_url: 'https://emoji.zulip.invalid/?id=custom1',
          },
          customEmoji2: {
            code: 'customEmoji2',
            deactivated: false,
            name: 'Custom Emoji 2',
            source_url: 'https://emoji.zulip.invalid/?id=custom2',
          },
        },
        type: EVENT_REALM_EMOJI_UPDATE,
      });

      const expectedState = {
        ...initialState,
        emoji: {
          customEmoji1: {
            code: 'customEmoji1',
            deactivated: false,
            name: 'Custom Emoji 1',
            source_url: 'https://emoji.zulip.invalid/?id=custom1',
          },
          customEmoji2: {
            code: 'customEmoji2',
            deactivated: false,
            name: 'Custom Emoji 2',
            source_url: 'https://emoji.zulip.invalid/?id=custom2',
          },
        },
      };

      const newState = realmReducer(initialState, action);

      expect(newState).toEqual(expectedState);
    });
  });

  describe('EVENT_REALM_FILTERS', () => {
    test('update state to new realm_filter', () => {
      const initialState = eg.reduxStatePlus({
        realm: {
          ...eg.plusReduxState.realm,
          twentyFourHourTime: false,
          emoji: {},
          filters: [],
        },
      }).realm;

      const action = deepFreeze({
        id: 4,
        realm_filters: [['#(?P<id>[0-9]+)', 'https://github.com/zulip/zulip/issues/%(id)s', 2]],
        type: EVENT_REALM_FILTERS,
      });

      const expectedState = {
        ...initialState,
        filters: [['#(?P<id>[0-9]+)', 'https://github.com/zulip/zulip/issues/%(id)s', 2]],
      };

      const newState = realmReducer(initialState, action);

      expect(newState).toEqual(expectedState);
    });
  });
});
