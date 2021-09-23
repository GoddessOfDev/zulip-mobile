/* @flow strict-local */
import type { GetText, Narrow, MessageListElement } from '../../types';
import { ensureUnreachable } from '../../generics';
import type { BackgroundData } from '../MessageList';

import messageAsHtml from './messageAsHtml';
import messageHeaderAsHtml from './messageHeaderAsHtml';
import timeRowAsHtml from './timeRowAsHtml';

export default ({
  backgroundData,
  narrow,
  messageListElements,
  _,
}: {|
  backgroundData: BackgroundData,
  narrow: Narrow,
  messageListElements: $ReadOnlyArray<MessageListElement>,
  _: GetText,
|}): string =>
  messageListElements
    .map(element => {
      switch (element.type) {
        case 'time':
          return timeRowAsHtml(element.timestamp, element.subsequentMessage);
        case 'header':
          return messageHeaderAsHtml(backgroundData, narrow, element.subsequentMessage);
        case 'message':
          return messageAsHtml(backgroundData, element.message, element.isBrief, _);
        default:
          ensureUnreachable(element);
          throw new Error(`Unidentified element.type: '${element.type}'`);
      }
    })
    .join('');
