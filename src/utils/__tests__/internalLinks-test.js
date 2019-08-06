/* @flow strict-local */
/* eslint-disable spellcheck/spell-checker */
import type { User } from '../../api/modelTypes';
import { streamNarrow, topicNarrow } from '../narrow';
import {
  isInternalLink,
  isMessageLink,
  getLinkType,
  getNarrowFromLink,
  getMessageIdFromLink,
} from '../internalLinks';

describe('isInternalLink', () => {
  test('when link is external, return false', () => {
    expect(isInternalLink('https://example.com', 'https://another.com')).toBe(false);
  });

  test('when link is internal, but not in app, return false', () => {
    expect(isInternalLink('https://example.com/user_uploads', 'https://example.com')).toBe(false);
  });

  test('when link is internal and in app, return true', () => {
    expect(isInternalLink('https://example.com/#narrow/stream/jest', 'https://example.com')).toBe(
      true,
    );
  });

  test('when link is relative and in app, return true', () => {
    expect(isInternalLink('#narrow/stream/jest/topic/topic1', 'https://example.com')).toBe(true);
    expect(isInternalLink('/#narrow/stream/jest', 'https://example.com')).toBe(true);
  });

  test('links including IDs are also recognized', () => {
    expect(isInternalLink('#narrow/stream/123-jest/topic/topic1', 'https://example.com')).toBe(
      true,
    );
    expect(isInternalLink('/#narrow/stream/123-jest', 'https://example.com')).toBe(true);
    expect(isInternalLink('/#narrow/pm-with/123-mark', 'https://example.com')).toBe(true);
  });
});

describe('isMessageLink', () => {
  test('only in-app link containing "near/<message-id>" is a message link', () => {
    expect(isMessageLink('https://example.com/#narrow/stream/jest', 'https://example.com')).toBe(
      false,
    );
    expect(isMessageLink('https://example.com/#narrow/#near/1', 'https://example.com')).toBe(true);
  });
});

describe('getLinkType', () => {
  test('links to a different domain are of "external" type', () => {
    expect(getLinkType('https://google.com/some-path', 'https://example.com')).toBe('external');
  });

  test('only in-app link containing "stream" is a stream link', () => {
    expect(
      getLinkType('https://example.com/#narrow/pm-with/1,2-group', 'https://example.com'),
    ).toBe('pm');
    expect(getLinkType('https://example.com/#narrow/stream/jest', 'https://example.com')).toBe(
      'stream',
    );
    expect(getLinkType('https://example.com/#narrow/stream/stream/', 'https://example.com')).toBe(
      'stream',
    );
  });

  test('when a url is not a topic narrow return false', () => {
    expect(
      getLinkType('https://example.com/#narrow/pm-with/1,2-group', 'https://example.com'),
    ).toBe('pm');
    expect(getLinkType('https://example.com/#narrow/stream/jest', 'https://example.com')).toBe(
      'stream',
    );
    expect(
      getLinkType(
        'https://example.com/#narrow/stream/stream/topic/topic/near/',
        'https://example.com',
      ),
    ).toBe('home');
    expect(getLinkType('https://example.com/#narrow/stream/topic/', 'https://example.com')).toBe(
      'stream',
    );
  });

  test('when a url is a topic narrow return true', () => {
    expect(
      getLinkType('https://example.com/#narrow/stream/jest/topic/test', 'https://example.com'),
    ).toBe('topic');
    expect(
      getLinkType(
        'https://example.com/#narrow/stream/mobile/subject/topic/near/378333',
        'https://example.com',
      ),
    ).toBe('topic');
    expect(
      getLinkType('https://example.com/#narrow/stream/mobile/topic/topic/', 'https://example.com'),
    ).toBe('topic');
    expect(
      getLinkType(
        'https://example.com/#narrow/stream/stream/topic/topic/near/1',
        'https://example.com',
      ),
    ).toBe('topic');
    expect(
      getLinkType(
        'https://example.com/#narrow/stream/stream/subject/topic/near/1',
        'https://example.com',
      ),
    ).toBe('topic');

    expect(getLinkType('/#narrow/stream/stream/subject/topic', 'https://example.com')).toBe(
      'topic',
    );
  });

  test('only in-app link containing "pm-with" is a group link', () => {
    expect(
      getLinkType('https://example.com/#narrow/stream/jest/topic/test', 'https://example.com'),
    ).toBe('topic');
    expect(
      getLinkType('https://example.com/#narrow/pm-with/1,2-group', 'https://example.com'),
    ).toBe('pm');
    expect(
      getLinkType('https://example.com/#narrow/pm-with/1,2-group/near/1', 'https://example.com'),
    ).toBe('pm');
    expect(
      getLinkType(
        'https://example.com/#narrow/pm-with/a.40b.2Ecom.c.d.2Ecom/near/3',
        'https://example.com',
      ),
    ).toBe('pm');
  });

  test('only in-app link containing "is" is a special link', () => {
    expect(
      getLinkType('https://example.com/#narrow/stream/jest/topic/test', 'https://example.com'),
    ).toBe('topic');
    expect(getLinkType('https://example.com/#narrow/is/private', 'https://example.com')).toBe(
      'special',
    );
    expect(getLinkType('https://example.com/#narrow/is/starred', 'https://example.com')).toBe(
      'special',
    );
    expect(getLinkType('https://example.com/#narrow/is/mentioned', 'https://example.com')).toBe(
      'special',
    );
    expect(getLinkType('https://example.com/#narrow/is/men', 'https://example.com')).toBe('home');
    expect(getLinkType('https://example.com/#narrow/is/men/stream', 'https://example.com')).toBe(
      'home',
    );
    expect(getLinkType('https://example.com/#narrow/are/men/stream', 'https://example.com')).toBe(
      'home',
    );
  });
});

describe('getNarrowFromLink', () => {
  // $FlowFixMe ill-typed test
  const usersById: Map<number, User> = new Map([
    [1, { email: 'abc@example.com', user_id: 1 }],
    [2, { email: 'xyz@example.com', user_id: 2 }],
    [3, { email: 'def@example.com', user_id: 3 }],
  ]);

  const get = url => getNarrowFromLink(url, 'https://example.com', usersById);

  test('when link is not in-app link, return null', () => {
    expect(get('https://example.com/user_uploads')).toEqual(null);
  });

  test('when link is stream link, return matching streamNarrow', () => {
    expect(get('https://example.com/#narrow/stream/jest')).toEqual(streamNarrow('jest'));
    expect(get('https://example.com/#narrow/stream/bot.20testing')).toEqual(
      streamNarrow('bot testing'),
    );
    expect(get('https://example.com/#narrow/stream/jest.API')).toEqual(streamNarrow('jest.API'));
    expect(get('https://example.com/#narrow/stream/stream')).toEqual(streamNarrow('stream'));
    expect(get('https://example.com/#narrow/stream/topic')).toEqual(streamNarrow('topic'));
  });

  test('when link is stream link, without realm info, return matching streamNarrow', () => {
    expect(get('/#narrow/stream/jest')).toEqual(streamNarrow('jest'));
    expect(get('#narrow/stream/jest')).toEqual(streamNarrow('jest'));
  });

  test('when link is a topic link and encoded, decode stream and topic names and return matching streamNarrow and topicNarrow', () => {
    expect(get('https://example.com/#narrow/stream/jest/topic/(no.20topic)')).toEqual(
      topicNarrow('jest', '(no topic)'),
    );

    expect(get('https://example.com/#narrow/stream/jest/topic/google.com')).toEqual(
      topicNarrow('jest', 'google.com'),
    );

    expect(get('https://example.com/#narrow/stream/topic/topic/topic.20name')).toEqual(
      topicNarrow('topic', 'topic name'),
    );

    expect(get('https://example.com/#narrow/stream/topic/topic/stream')).toEqual(
      topicNarrow('topic', 'stream'),
    );

    expect(get('https://example.com/#narrow/stream/stream/topic/topic')).toEqual(
      topicNarrow('stream', 'topic'),
    );
  });

  test('when link is pointing to a topic without realm info, return matching topicNarrow', () => {
    expect(get('/#narrow/stream/stream/topic/topic')).toEqual(topicNarrow('stream', 'topic'));
    expect(get('#narrow/stream/stream/topic/topic')).toEqual(topicNarrow('stream', 'topic'));
  });

  test('when link is a group link, return matching groupNarrow', () => {
    const expectedValue = [
      {
        operator: 'pm-with',
        operand: 'abc@example.com,xyz@example.com,def@example.com',
      },
    ];
    expect(get('https://example.com/#narrow/pm-with/1,2,3-group')).toEqual(expectedValue);
  });

  test('if any of the user ids are not found return null', () => {
    expect(get('https://example.com/#narrow/pm-with/1,2,10-group')).toEqual(null);
  });

  test('when link is a special link, return matching specialNarrow', () => {
    const expectedValue = [
      {
        operator: 'is',
        operand: 'starred',
      },
    ];
    expect(get('https://example.com/#narrow/is/starred')).toEqual(expectedValue);
  });

  test('when link is a message link, return matching narrow', () => {
    expect(get('https://example.com/#narrow/pm-with/1,3-group/near/2')).toEqual([
      {
        operator: 'pm-with',
        operand: 'abc@example.com,def@example.com',
      },
    ]);

    expect(get('https://example.com/#narrow/stream/jest/topic/test/near/1')).toEqual(
      topicNarrow('jest', 'test'),
    );

    expect(get('https://example.com/#narrow/stream/jest/subject/test/near/1')).toEqual(
      topicNarrow('jest', 'test'),
    );
  });
});

describe('getMessageIdFromLink', () => {
  test('not message link', () => {
    expect(
      getMessageIdFromLink('https://example.com/#narrow/is/private', 'https://example.com'),
    ).toBe(0);
  });

  test('when link is a group link, return anchor message id', () => {
    expect(
      getMessageIdFromLink(
        'https://example.com/#narrow/pm-with/1,3-group/near/1/',
        'https://example.com',
      ),
    ).toBe(1);
  });

  test('when link is a topic link, return anchor message id', () => {
    expect(
      getMessageIdFromLink(
        'https://example.com/#narrow/stream/jest/topic/test/near/1',
        'https://example.com',
      ),
    ).toBe(1);
  });
});
