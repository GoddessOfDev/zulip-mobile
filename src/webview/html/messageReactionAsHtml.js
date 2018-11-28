/* @flow strict-local */
import type { AggregatedReaction, RealmEmojiType } from '../../types';
import { codeToEmojiMap } from '../../emoji/data';
import template from './template';

const getRealmEmojiHtml = (realmEmoji: RealmEmojiType): string =>
  template`<img src="${realmEmoji.source_url}"/>
  `;

export default (
  messageId: number,
  reaction: AggregatedReaction,
  allRealmEmojiById: { [id: string]: RealmEmojiType },
): string =>
  template`<span onClick="" class="reaction${reaction.selfReacted ? ' self-voted' : ''}"
        data-name="${reaction.name}"
        data-code="${reaction.code}"
        data-type="${reaction.type}">$!${
    allRealmEmojiById[reaction.code]
      ? getRealmEmojiHtml(allRealmEmojiById[reaction.code])
      : codeToEmojiMap[reaction.code]
  }&nbsp;${reaction.count}
</span>`;
