/* @flow strict-local */

import invariant from 'invariant';
import * as React from 'react';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import * as MailComposer from 'expo-mail-composer';
import { nativeApplicationVersion } from 'expo-application';
// $FlowFixMe[untyped-import]
import uniq from 'lodash.uniq';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import Screen from '../common/Screen';
import { createStyleSheet } from '../styles';
import { useGlobalSelector, useSelector } from '../react-redux';
import { getAccounts, getGlobalSession, getSettings } from '../directSelectors';
import {
  getAccount,
  getServerVersion,
  getZulipFeatureLevel,
  tryGetActiveAccountState,
} from '../account/accountsSelectors';
import { showToast } from '../utils/info';
import Input from '../common/Input';
import ZulipButton from '../common/ZulipButton';
import { identityOfAccount, keyOfIdentity } from '../account/accountMisc';
import AlertItem from '../common/AlertItem';
import ZulipText from '../common/ZulipText';
import type { Identity } from '../types';
import type { SubsetProperties } from '../generics';
import type { ZulipVersion } from '../utils/zulipVersion';
import { useAppState } from '../reactNativeUtils';
import * as logging from '../utils/logging';
import { getHaveServerData } from '../haveServerDataSelectors';
import { TranslationContext } from '../boot/TranslationProvider';
import isAppOwnDomain from '../isAppOwnDomain';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'notif-troubleshooting'>,
  route: RouteProp<'notif-troubleshooting', void>,
|}>;

/**
 * Something that's very likely to prevent notifications from working.
 */
enum NotificationProblem {
  TokenNotAcked = 0,
}

/**
 * Data relevant to an account's push notifications, for support requests.
 *
 * Use jsonifyNotificationReport to get this into the form we want the user
 * to send the data in.
 */
export type NotificationReport = {|
  ...Identity,
  +isSelfHosted: boolean,
  +platform: SubsetProperties<typeof Platform, {| +OS: mixed, +Version: mixed, +isPad: boolean |}>,
  +nativeApplicationVersion: string | null,
  +problems: $ReadOnlyArray<NotificationProblem>,
  +isLoggedIn: boolean,
  +devicePushToken: string | null,
  +ackedPushToken: string | null,

  /**
   * Server data from an event queue, if any.
   *
   * Pre-#5006, this will only be present for the active, logged-in
   * account, if it exists.
   */
  // TODO(#5006): When we store server data for multiple accounts, include
  //   this for all accounts that have server data.
  +serverData: {|
    +zulipVersion: ZulipVersion,
    +zulipFeatureLevel: number,
    +offlineNotification: boolean,
    +onlineNotification: boolean,
    +streamNotification: boolean,
  |} | null,
|};

/**
 * Put a NotificationReport into the form we'd like to receive the data in.
 */
function jsonifyNotificationReport(report: NotificationReport): string {
  return JSON.stringify(
    { ...report, problems: report.problems.map(p => NotificationProblem.getName(p)) },
    null,
    2,
  );
}

/**
 * Generate and return a NotificationReport for all accounts we know about.
 */
export function useNotificationReportsByIdentityKey(): Map<string, NotificationReport> {
  const platform = React.useMemo(
    () => ({ OS: Platform.OS, Version: Platform.Version, isPad: Platform.isPad }),
    [],
  );
  const pushToken = useGlobalSelector(state => getGlobalSession(state).pushToken);
  const accounts = useGlobalSelector(getAccounts);
  const activeAccountState = useGlobalSelector(tryGetActiveAccountState);

  return React.useMemo(
    () =>
      new Map(
        accounts.map(account => {
          const { ackedPushToken, apiKey } = account;
          const identity = identityOfAccount(account);
          const isLoggedIn = apiKey !== '';

          let serverData = null;
          if (
            activeAccountState
            && keyOfIdentity(identityOfAccount(getAccount(activeAccountState)))
              === keyOfIdentity(identityOfAccount(account))
            && getHaveServerData(activeAccountState)
          ) {
            serverData = {
              zulipVersion: getServerVersion(activeAccountState),
              zulipFeatureLevel: getZulipFeatureLevel(activeAccountState),
              offlineNotification: getSettings(activeAccountState).offlineNotification,
              onlineNotification: getSettings(activeAccountState).onlineNotification,
              streamNotification: getSettings(activeAccountState).streamNotification,
            };
          }

          const problems = [];
          if (isLoggedIn) {
            if (ackedPushToken == null || pushToken !== ackedPushToken) {
              problems.push(NotificationProblem.TokenNotAcked);
            }
          }

          return [
            keyOfIdentity(identityOfAccount(account)),
            {
              ...identity,
              isSelfHosted: !isAppOwnDomain(identity.realm),
              platform,
              nativeApplicationVersion,
              problems,
              isLoggedIn,
              devicePushToken: pushToken,
              ackedPushToken,
              serverData,
            },
          ];
        }),
      ),
    [accounts, activeAccountState, pushToken, platform],
  );
}

/**
 * MailComposer.isAvailableAsync(), with polling on appState changes.
 */
function useMailComposerIsAvailable(): boolean | null {
  const [result, setResult] = React.useState(null);

  const getAndSetResult = React.useCallback(async () => {
    setResult(await MailComposer.isAvailableAsync());
  }, []);

  const appState = useAppState();
  React.useEffect(() => {
    getAndSetResult();
  }, [getAndSetResult, appState]);

  return result;
}

/**
 * A per-account screen for troubleshooting notifications.
 *
 * Shows an alert (or alerts) when we know something is wrong, giving a
 * diagnosis and fix when we can, and otherwise asking the user to contact
 * support.
 *
 * Offers data (in JSON) that we can use in support requests and bug
 * reports. The user can tap a copy-to-clipboard button or open an email
 * composing session in their platform's native mail app.
 */
export default function NotifTroubleshootingScreen(props: Props): React.Node {
  const _ = React.useContext(TranslationContext);

  const account = useSelector(getAccount);
  const notificationReportsByIdentityKey = useNotificationReportsByIdentityKey();
  const report = notificationReportsByIdentityKey.get(keyOfIdentity(identityOfAccount(account)));
  invariant(report, 'NotifTroubleshootingScreen: expected report');

  const styles = React.useMemo(
    () =>
      createStyleSheet({
        contentArea: {
          flex: 1,
        },
        button: {
          marginBottom: 8,
        },
        emailText: {
          fontWeight: 'bold',
        },
        reportTextInput: {
          flex: 1,
          fontFamily:
            Platform.OS === 'ios'
              ? 'Courier' // This doesn't seem to work on Android
              : 'monospace', // This doesn't seem to work on iOS
        },
      }),
    [],
  );

  const reportJson = React.useMemo(() => jsonifyNotificationReport(report), [report]);

  const handlePressCopy = React.useCallback(() => {
    Clipboard.setString(reportJson);
    showToast(_('Copied'));
  }, [reportJson, _]);

  const mailComposerIsAvailable = useMailComposerIsAvailable();

  const handlePressEmailSupport = React.useCallback(async () => {
    const result = await MailComposer.composeAsync({
      recipients: ['support@zulip.com'],
      subject: 'Zulip push notifications',
      body: `\
<h3>The problem:</h3>
<p>(${_('Please describe the problem.')})</p>
<h3>Other details:</h3>
<p>(${_('If there are other details you would like to share, please write them here.')})</p>
<hr>
<p>This email was written from a template provided by the Zulip mobile app.</p>
<details>
  <summary>Technical details:</summary>
  <pre>${reportJson}</pre>
</details>\
`,
      isHtml: true,
    });

    switch (result.status) {
      case MailComposer.MailComposerStatus.CANCELLED:
        break;
      case MailComposer.MailComposerStatus.SAVED:
        showToast(_('Draft saved'));
        break;
      case MailComposer.MailComposerStatus.SENT:
        showToast(_('Email sent'));
        logging.info('NotifTroubleshootingScreen: MailComposer reports a sent email.');
        break;
      case MailComposer.MailComposerStatus.UNDETERMINED:
        logging.warn('MailComposerStatus.UNDETERMINED');
        break;
    }
  }, [reportJson, _]);

  // Generic "contact support" alert for any/all problems that the user
  // can't resolve themselves. If multiple problems map to this alert, we
  // deduplicate the alert.
  const genericAlert = (
    <AlertItem
      bottomMargin
      text={{
        text: 'Notifications for this account may not arrive. Please contact {supportEmail} with the details below.',
        values: {
          supportEmail: (
            <ZulipText
              inheritColor
              inheritFontSize
              style={styles.emailText}
              text="support@zulip.com"
            />
          ),
        },
      }}
    />
  );
  const alerts = [];
  report.problems.forEach(problem => {
    switch (problem) {
      case NotificationProblem.TokenNotAcked: {
        // TODO: Could offer:
        //   - Re-request the device token from the platform (#5329 may be
        //     an obstacle), and show if a/the request hasn't completed
        //   - Re-request registering token with server, and show if a/the
        //     request hasn't completed
        alerts.push(genericAlert);
      }
    }
  });

  return (
    <Screen scrollEnabled={false} title="Troubleshooting" padding>
      <SafeAreaView mode="padding" edges={['right', 'left']} style={styles.contentArea}>
        {
          // TODO: Avoid comparing these complex UI-describing objects:
          //   https://github.com/zulip/zulip-mobile/pull/5654#discussion_r1105122407
          uniq(alerts) // Deduplicate genericAlert, which multiple problems might map to
        }
        {mailComposerIsAvailable === true && (
          <ZulipButton
            style={styles.button}
            text={{
              text: 'Email {supportEmail}',
              values: {
                supportEmail: (
                  <ZulipText
                    inheritColor
                    inheritFontSize
                    style={styles.emailText}
                    text="support@zulip.com"
                  />
                ),
              },
            }}
            onPress={handlePressEmailSupport}
          />
        )}
        <ZulipButton style={styles.button} text="Copy to clipboard" onPress={handlePressCopy} />
        {Platform.OS === 'android' ? (
          // ScrollView for Android-only symptoms like
          // facebook/react-native#23117
          <ScrollView style={{ flex: 1 }}>
            <Input editable={false} multiline style={styles.reportTextInput} value={reportJson} />
          </ScrollView>
        ) : (
          <Input editable={false} multiline style={styles.reportTextInput} value={reportJson} />
        )}
      </SafeAreaView>
    </Screen>
  );
}
