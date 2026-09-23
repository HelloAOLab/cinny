import React, { FormEventHandler, useCallback, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { MatrixError } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useCapabilities } from '../../hooks/useCapabilities';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useAlive } from '../../hooks/useAlive';
import { stopPropagation } from '../../utils/keyboard';
import {
  CommunityVisibility,
  createCommunity,
  waitForCommunitySync,
} from '../../features/create-community/createCommunity';
import * as css from './CreateCommunityFlow.css';

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

const VISIBILITY_OPTIONS: { value: CommunityVisibility; label: string; subtitle: string }[] = [
  {
    value: 'private',
    label: 'Private',
    subtitle: 'Only people you invite can join',
  },
  {
    value: 'public',
    label: 'Public',
    subtitle: 'Anyone can find, join and read posts',
  },
];

type CreateCommunityFlowProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (communityId: string) => void;
};

function CreateCommunityForm({ onClose, onCreate }: Omit<CreateCommunityFlowProps, 'open'>) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const roomVersion = useCapabilities()['m.room_versions']?.default;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('private');

  const [createState, create] = useAsyncCallback<string, Error | MatrixError, []>(
    useCallback(async () => {
      const result = await createCommunity(mx, { name, description, visibility, roomVersion });
      // The shell only renders joined communities, so hold here until the
      // new one has synced rather than navigating to a "not found" page.
      await waitForCommunitySync(mx, result);
      return result.spaceId;
    }, [mx, name, description, visibility, roomVersion])
  );
  const busy = createState.status === AsyncStatus.Loading;
  const error = createState.status === AsyncStatus.Error ? createState.error : undefined;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    if (busy || !name.trim()) return;
    create().then((spaceId) => {
      if (alive()) onCreate(spaceId);
    });
  };

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: false,
        onDeactivate: () => !busy && onClose(),
        clickOutsideDeactivates: false,
        escapeDeactivates: stopPropagation,
      }}
    >
      <div className={css.Overlay} role="dialog" aria-label="New community">
        <div className={css.Header}>
          <button
            type="button"
            aria-label="Cancel"
            className={css.HeaderButton}
            disabled={busy}
            onClick={onClose}
          >
            {CLOSE_ICON}
          </button>
          <div className={css.HeaderSpacer} />
          <span className={css.HeaderTitle}>New Community</span>
          <div className={css.HeaderSpacer} />
          <div style={{ width: 22 }} />
        </div>
        <form className={css.Body} onSubmit={handleSubmit}>
          <label className={css.Field} htmlFor="create-community-name">
            <span className={css.Label}>Name</span>
            <input
              id="create-community-name"
              className={css.Input}
              value={name}
              onChange={(evt) => setName(evt.target.value)}
              placeholder="e.g. Grace Church"
              autoComplete="off"
              maxLength={255}
              required
              disabled={busy}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </label>
          <label className={css.Field} htmlFor="create-community-description">
            <span className={css.Label}>Description (optional)</span>
            <textarea
              id="create-community-description"
              className={css.TextArea}
              value={description}
              onChange={(evt) => setDescription(evt.target.value)}
              placeholder="What is this community about?"
              disabled={busy}
            />
          </label>
          <div className={css.Field}>
            <span className={css.Label} id="create-community-visibility">
              Who can join?
            </span>
            <div
              className={css.Options}
              role="radiogroup"
              aria-labelledby="create-community-visibility"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={visibility === option.value}
                  className={css.Option}
                  disabled={busy}
                  onClick={() => setVisibility(option.value)}
                >
                  <div className={css.OptionTitle}>{option.label}</div>
                  <div className={css.OptionSubtitle}>{option.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
          {error && <span className={css.Error}>{error.message}</span>}
          <button type="submit" className={css.SubmitButton} disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create Community'}
          </button>
        </form>
      </div>
    </FocusTrap>
  );
}

/**
 * Full-screen form, styled like the rest of /app, for creating a community:
 * a space plus the posts and chat rooms the /app shell reads from.
 */
export function CreateCommunityFlow({ open, onClose, onCreate }: CreateCommunityFlowProps) {
  // Mounting the form only while open resets its fields between uses.
  if (!open) return null;
  return <CreateCommunityForm onClose={onClose} onCreate={onCreate} />;
}
