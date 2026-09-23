import React from 'react';
import FocusTrap from 'focus-trap-react';
import { QRCodeSVG } from 'qrcode.react';
import { RegistrationBotConfig } from '../../plugins/registration-bot';
import { useRegistrationLink } from '../../hooks/useRegistrationLink';
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
            this server.
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
