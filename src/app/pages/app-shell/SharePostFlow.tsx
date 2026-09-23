import React, { useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { PostSharingLevel } from '../../features/create-post/postSharing';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './SharePostFlow.css';

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

const BACK_ICON = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

type ShareOption = {
  label: string;
  subtitle: string;
  value: PostSharingLevel;
};

const SHARING_OPTIONS: ShareOption[] = [
  { label: 'Yes', subtitle: 'Share without any changes', value: 'public' },
  {
    label: 'Yes, anonymously',
    subtitle: 'Share with changed names and places',
    value: 'anonymous',
  },
  { label: 'No', subtitle: 'Never share with others', value: 'private' },
];

const MEDIA_OPTIONS: ShareOption[] = [
  { label: 'Yes', subtitle: 'Include images and videos as they are', value: 'public' },
  {
    label: 'Yes, but blur faces',
    subtitle: 'Include images and videos with faces blurred',
    value: 'anonymous',
  },
  {
    label: 'No',
    subtitle: "Don't include any images or videos",
    value: 'private',
  },
];

type SharePostFlowProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (sharing: PostSharingLevel, sharingMedia: PostSharingLevel) => void;
};

export function SharePostFlow({ open, onClose, onComplete }: SharePostFlowProps) {
  const [step, setStep] = useState<'sharing' | 'media'>('sharing');
  const [sharing, setSharing] = useState<PostSharingLevel>();

  const handleClose = () => {
    setStep('sharing');
    setSharing(undefined);
    onClose();
  };

  const handleSharingSelect = (value: PostSharingLevel) => {
    if (value === 'private') {
      setStep('sharing');
      setSharing(undefined);
      onComplete(value, 'private');
      return;
    }
    setSharing(value);
    setStep('media');
  };

  const handleMediaSelect = (value: PostSharingLevel) => {
    const sharingValue = sharing ?? 'public';
    setStep('sharing');
    setSharing(undefined);
    onComplete(sharingValue, value);
  };

  if (!open) return null;

  const options = step === 'sharing' ? SHARING_OPTIONS : MEDIA_OPTIONS;
  const question =
    step === 'sharing'
      ? 'Can we share your post outside this app?'
      : 'Can we include images and videos?';

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: false,
        onDeactivate: handleClose,
        clickOutsideDeactivates: false,
        escapeDeactivates: stopPropagation,
      }}
    >
      <div className={css.Overlay} role="dialog" aria-label="Share post">
        <div className={css.Header}>
          {step === 'media' ? (
            <button
              type="button"
              aria-label="Back"
              className={css.HeaderButton}
              onClick={() => setStep('sharing')}
            >
              {BACK_ICON}
            </button>
          ) : (
            <div />
          )}
          <div className={css.HeaderSpacer} />
          <button
            type="button"
            aria-label="Cancel sharing"
            className={css.HeaderButton}
            onClick={handleClose}
          >
            {CLOSE_ICON}
          </button>
        </div>
        <div className={css.Body}>
          <div className={css.Question}>{question}</div>
          <div className={css.Options}>
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                className={css.Option}
                onClick={() =>
                  step === 'sharing'
                    ? handleSharingSelect(option.value)
                    : handleMediaSelect(option.value)
                }
              >
                <div className={css.OptionTitle}>{option.label}</div>
                <div className={css.OptionSubtitle}>{option.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
