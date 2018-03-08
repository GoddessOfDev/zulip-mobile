/* eslint-disable */
import { codeToEmojiMap } from '../emoji/emojiMap';

import { BORDER_COLOR } from '../styles/theme';
import { BRAND_COLOR, REACTION_HEIGHT, REACTION_SPINNER_OFFSET } from '../styles';
import cssEmojis from './cssEmojis';

const defaultTheme = `
html {
  -webkit-user-select: none; /* Safari 3.1+ */
  -moz-user-select: none; /* Firefox 2+ */
  -ms-user-select: none; /* IE 10+ */
  user-select: none; /* Standard syntax */
  -khtml-user-select: none;
  -webkit-touch-callout: none;
}
body {
  font-family: sans-serif;
  line-height: 1.4;
  margin: 0;
  width: 100%;
  max-width: 100%;
  font-size: 15px;
}
a {
  color: #08c;
}
p {
  margin: 0;
}
code {
  font-size: .857em;
  white-space: pre-wrap;
  padding: 0 0.25em;
}
pre {
  padding: 0.5em;
  margin: 0.5em 0;
  font-size: 0.75em;
  white-space: pre;
  overflow-x: auto;
  word-wrap: normal;
}
code, pre {
  border-radius: 3px;
  border: 1px solid rgba(127, 127, 127, 0.25);
  background-color: rgba(127, 127, 127, 0.125);
  font-family: Monaco, Menlo, Consolas, "Courier New", monospace;
}
table {
  border-collapse: collapse;
  width: 100%;
}
table, th, td {
  border: 1px solid rgba(127, 127, 127, 0.25);
}
thead {
  background: rgba(127, 127, 127, 0.1);
}
th, td {
  align: center;
  padding: 0.25em 0.5em;
}
hr {
  margin: 1em 0;
  border: 0;
  border-top: 1px solid rgba(127, 127, 127, 0.5);
}
.highlight {
  background-color: hsl(51, 94%, 74%);
}
.subheader {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 0.25em;
}
.timerow {
  text-align: center;
  color: #999;
  display: flex;
  align-items: center;
  padding: 0.5em 0;
}
.timerow-left,
.timerow-right {
  flex: 1;
  height: 1px;
  margin: 0.5em;
}
.timerow-left {
  background: -webkit-linear-gradient(left, transparent 10%, #999 100%);
}
.timerow-right {
  background: -webkit-linear-gradient(left, #999 0%, transparent 90%);
}
.timestamp {
  color: #999;
  font-size: 14px;
  line-height: 1;
}
.message {
  display: flex;
  word-wrap: break-word;
  padding: 0.5em;
}
.message-brief {
  padding: 0 0 0.5em 3em;
}
.avatar {
  min-width: 2.5em;
  width: 2.5em;
  height: 2.5em;
}
.avatar img {
  width: 100%;
  border-radius: 4px;
}
.content {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0 0 0 0.5em;
}
.username {
  font-weight: bold;
  line-height: 1;
}
.user-mention {
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  padding: 0 .2em;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}
.header-wrapper {
  position: -webkit-sticky;
  position: sticky;
  top: -1px;
  padding: 0.5em;
  z-index: 100;
}
.avatar,
.header-wrapper {
  cursor: pointer;
}
.stream-header {
  padding: 0;
  display: flex;
  flex-direction: row;
}
.stream-text,
.topic-text,
.private-header {
  padding: 0 0.5em;
  line-height: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topic-text {
  flex: 1;
  padding-left: 0.5em;
  background: #ccc;
}
[data-mentioned="true"], [data-wildcard_mentioned="true"] {
  background: rgba(255, 0, 0, 0.05);
}
.message:not([data-read="true"]) {
}
.arrow-right {
  width: 0;
  height: 0;
  border-top: 1em solid transparent;
  border-bottom: 1em solid transparent;
  border-left: 1em solid green;
}
.private-header {
  background: #444;
  color: white;
}
.loading-avatar {
  min-width: 2.5em;
  width: 2.5em;
  height: 2.5em;
  margin-right: 0.5em;
  border-radius: 4px;
  background: rgba(127, 127, 127, 0.9);
}
.loading-content {
  width: 100%;
}
.loading-subheader {
  display: flex;
  justify-content: space-between;
}
.loading-content .block {
  background: linear-gradient(
    to right,
    rgba(127, 127, 127, 0.5) 0%,
    rgba(127, 127, 127, 0.5) 40%,
    rgba(127, 127, 127, 0.25) 51%,
    rgba(127, 127, 127, 0.5) 60%,
    rgba(127, 127, 127, 0.5) 100%
  );
  background-size: 200% 200%;
	animation: gradient-scroll 1s linear infinite;

  border-radius: 10px;
  height: 8px;
  margin-bottom: 10px;
}
@keyframes gradient-scroll {
	0% { background-position: 100% 50% }
	100% { background-position: 0 50% }
}
.loading-subheader .name {
  width: 120px;
  background-color: rgba(127, 127, 127, 0.9);
}
.loading-subheader .timestamp {
  width: 60px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.loading-spinner, .outbox-spinner {
  width: 2em;
  height: 2em;
  border-radius: 50%;
  margin: 1em auto;
  font-size: 10px;
  border: 3px solid rgba(82, 194, 175, 0.25);
  border-left: 3px solid rgba(82, 194, 175, 0.75);
  animation: spin 1s linear infinite;
}
.outbox-spinner {
  margin: -16px 0 0 0;
  border-width: 2px;
  width: 12px;
  height: 12px;
  float: right;
}
.message_inline_image {
  text-align: center;
}
.message_inline_image img,
.twitter-image img {
  width: 100%;
  max-height: 40vh;
  object-fit: cover;
  border-radius: 4px;
}
blockquote {
  padding-left: 0.5em;
  margin: 0.5em 0 0.5em 0;
  border-left: 3px solid rgba(127, 127, 127, 0.5);
}
ul {
  padding-left: 1em;
  margin: 0.5em 0;
}
.codehilite .gi { color: #00a000; }
.codehilite .gd { color: #a00000; }
.codehilite .k { color: #008000; font-weight: bold; }
.codehilite .kd { color: #008000; font-weight: bold; }
.codehilite .nf { color: #00f; }
.codehilite .s2 { color: #ba2121; }
.codehilite .cp { color: #bc7a00; }
.codehilite .kt { color: #b00040; }
.codehilite .nc { color: #00f; font-weight: bold; }
.codehilite .nb { color: #008000; }
.codehilite .s1 { color: #ba2121; }
.twitter-tweet {
  border: 2px solid rgba(29, 161, 242, 0.5);
  background: rgba(29, 161, 242, 0.1);
  border-radius: 0.25em;
  padding: 0.5em 0.75em;
  margin: 0.5em 0;
}
.twitter-avatar {
  border-radius: 0.25em;
  margin: 0.4em 0.4em 0.2em 0;
  float: left;
  width: 2.2em;
  height: 2.2em;
}
.twitter-image {
  text-align: center;
  margin: 0.5em auto;
}
.message-tags {
  text-align: right;
  margin: 0.25em 0;
  font-size: 10px;
}
.message-tag {
  padding: 0.25em 0.5em;
  margin-left: 4;
  border-radius: 2px;
  color: rgba(127, 127, 127, 0.75);
  background: rgba(0, 0, 0, 0.1);
}
.reaction-list {
  line-height: 2;
  margin: 0.5em 0;
}
.reaction {
  color: rgba(127, 127, 127, 1);
  padding: 4px;
  border-radius: 4px;
  border: 1px solid rgba(127, 127, 127, 0.75);
}
.reaction + .reaction {
  margin-left: 0.5em;
}
.realm-reaction {
  pointer-events: none;
  cursor: default;
  height: "auto";
  width: 1em;
  max-height: 1em;
  vertical-align: middle;
}
.self-voted {
  color: ${BRAND_COLOR};
  border: 1px solid ${BRAND_COLOR};
  background: rgba(36, 202, 194, 0.1);
}
.hidden {
  display: none;
}
.emoji {
  display: inline-block;
  height: 18px;
  width: 18px;
  white-space: nowrap;
  color: transparent;
  vertical-align: text-top;
}
.emoji:before {
  color: white;
}
#typing {
  display: flex;
  padding: 0.5em;
}
#typing .content {
  padding-left: 0.5em;
  padding-top: 1em;
}
#typing span {
  display: inline-block;
  background-color: #B6B5BA;
  width: 0.75em;
  height: 0.75em;
  border-radius: 100%;
  margin-right: 5px;
  animation: bob 2s infinite;
}
#typing span:nth-child(2) {
  animation-delay: 0.15s;
}
#typing span:nth-child(3) {
  animation-delay: 0.3s;
  margin-right: 0;
}
@keyframes bob {
  10% {
    transform: translateY(-10px);
    background-color: #9E9DA2;
  }
  50% {
    transform: translateY(0);
    background-color: #B6B5BA;
  }
}
.typing-list {
  background: green;
  height: 20px;
}
#message-loading {
  opacity: 0.25;
}
#js-error {
  position: fixed;
  width: 100%;
  background: red;
  color: white;
  font-size: 10px;
}
#scroll-bottom {
  position: fixed;
  z-index: 200;
  right: 5px;
  bottom: 15px;
}
#scroll-bottom a {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(82, 194, 175, 0.5);
}
#scroll-bottom svg {
  width: 32px;
  height: 32px;
  fill: rgba(255, 255, 255, 0.75);
}
`;

const darkTheme = `
body {
  color: #d5d9dd;
  background: #212D3B;
}
.topic-text {
  background: #54606E;
}
.highlight {
  background-color: hsla(51, 100%, 64%, 0.42);
}
`;

export default (theme: ThemeType, highlightUnreadMessages: boolean) => `
<style>
${defaultTheme}
${theme === 'night' ? darkTheme : ''}
${cssEmojis}
${highlightUnreadMessages ? '.message:not([data-read="true"]) { background: red; }' : ''}
</style>
`;
