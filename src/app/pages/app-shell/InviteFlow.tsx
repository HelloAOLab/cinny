import React, { useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { QRCodeSVG } from 'qrcode.react';
import { RegistrationBotConfig } from '../../plugins/registration-bot';
import { useRegistrationLink } from '../../hooks/useRegistrationLink';
import { useRegistrationInvites } from '../../hooks/useRegistrationInvites';
import { describeInvite, summarizeInvites } from './inviteList';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './InviteFlow.css';

const CLOSE_ICON = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const LINK_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

const formatTime = (ms: number): string =>
  new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const TONE_CLASS = {
  positive: css.BadgePositive,
  neutral: css.BadgeNeutral,
  muted: css.BadgeMuted,
};

function InviteList({ botConfig, link }: { botConfig: RegistrationBotConfig; link?: string }) {
  const { invites, loading, error, refresh } = useRegistrationInvites(botConfig);

  // A newly generated link belongs in the list, so reload it once one arrives.
  useEffect(() => {
    if (link) refresh();
  }, [link, refresh]);

  return (
    <section className={css.Field} aria-labelledby="invite-list-title">
      <div className={css.ListHeader}>
        <span className={css.Label} id="invite-list-title">
          Your Invites
        </span>
        {invites && invites.length > 0 && (
          <span className={css.ListSummary}>{summarizeInvites(invites)}</span>
        )}
      </div>
      {error && <span className={css.Error}>{error}</span>}
      {!invites && loading && <span className={css.ListEmpty}>Loading invites…</span>}
      {invites && invites.length === 0 && (
        <span className={css.ListEmpty}>You haven&apos;t generated any invite links yet.</span>
      )}
      {invites && invites.length > 0 && (
        <ul className={css.InviteList}>
          {invites.map((invite) => {
            const { label, tone, detail } = describeInvite(invite, formatTime);
            return (
              <li key={invite.tokenSha256} className={css.InviteCard}>
                <div className={css.InviteRow}>
                  <span className={css.OptionTitle}>
                    {invite.issuedAt === null ? 'Unknown date' : formatTime(invite.issuedAt)}
                  </span>
                  <span className={`${css.Badge} ${TONE_CLASS[tone]}`}>{label}</span>
                </div>
                {detail && <div className={css.InviteDetail}>{detail}</div>}
                <div className={css.OptionSubtitle}>
                  {invite.clientId && `${invite.clientId} · `}
                  {`Link ${invite.tokenSha256.slice(0, 8)}…`}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type InviteFlowProps = {
  open: boolean;
  botConfig: RegistrationBotConfig;
  onClose: () => void;
};

function InviteForm({ botConfig, onClose }: Omit<InviteFlowProps, 'open'>) {
  const {
    clients,
    clientsLoading,
    clientId,
    setClientId,
    loading,
    link,
    error,
    getLink,
    copied,
    copyLink,
  } = useRegistrationLink(botConfig);

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: false,
        onDeactivate: () => !loading && onClose(),
        clickOutsideDeactivates: false,
        escapeDeactivates: stopPropagation,
      }}
    >
      <div className={css.Overlay} role="dialog" aria-label="Invite people">
        <div className={css.Header}>
          <button
            type="button"
            aria-label="Close"
            className={css.HeaderButton}
            disabled={loading}
            onClick={onClose}
          >
            {CLOSE_ICON}
          </button>
          <div className={css.HeaderSpacer} />
          <span className={css.HeaderTitle}>Invite People</span>
          <div className={css.HeaderSpacer} />
          <div style={{ width: 22 }} />
        </div>
        <div className={css.Body}>
          <p className={css.Description}>
            Get a single-use link you can send to someone to invite them to create an account on
            this server, and see who has used the links you already sent.
          </p>
          {clients && clients.length > 1 && !link && (
            <div className={css.Field}>
              <span className={css.Label} id="invite-client">
                App
              </span>
              <div className={css.Options} role="radiogroup" aria-labelledby="invite-client">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    role="radio"
                    aria-checked={clientId === client.id}
                    className={css.Option}
                    disabled={loading}
                    onClick={() => setClientId(client.id)}
                  >
                    <div className={css.OptionTitle}>{client.id}</div>
                    <div className={css.OptionSubtitle}>{client.baseUrl}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <span className={css.Error}>{error}</span>}
          {link && (
            <div className={css.Field}>
              <div className={css.QRCard}>
                <QRCodeSVG value={link} size={200} marginSize={0} />
              </div>
              <input
                readOnly
                aria-label="Registration link"
                className={css.Input}
                value={link}
                onFocus={(evt) => evt.target.select()}
              />
              <button type="button" className={css.SecondaryButton} onClick={copyLink}>
                {LINK_ICON}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
          <InviteList botConfig={botConfig} link={link} />
          <div className={css.Actions}>
            {link ? (
              <button type="button" className={css.SubmitButton} onClick={onClose}>
                Done
              </button>
            ) : (
              <button
                type="button"
                className={css.SubmitButton}
                disabled={loading || clientsLoading}
                onClick={getLink}
              >
                {loading ? 'Getting Link…' : 'Get Invite Link'}
              </button>
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}

/**
 * Full-screen flow, styled like the rest of /app, for inviting someone to register
 * on the homeserver. Shares its logic with `RegistrationLinkDialog` via
 * `useRegistrationLink`.
 */
export function InviteFlow({ open, botConfig, onClose }: InviteFlowProps) {
  // Mounting the form only while open requests a fresh link on each use.
  if (!open) return null;
  return <InviteForm botConfig={botConfig} onClose={onClose} />;
}
