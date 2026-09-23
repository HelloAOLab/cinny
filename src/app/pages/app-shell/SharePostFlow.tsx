import React, { useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { PostSharingLevel } from '../../features/create-post/postSharing';
import { POST_TYPE_OPTIONS, PostType } from '../../features/create-post/postType';
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
  onComplete: (
    postType: PostType,
    sharing: PostSharingLevel,
    sharingMedia: PostSharingLevel
  ) => void;
};

type Step = 'type' | 'sharing' | 'media';

const QUESTIONS: Record<Step, string> = {
  type: 'What would you like to share?',
  sharing: 'Can we share your post outside this app?',
  media: 'Can we include images and videos?',
};

export function SharePostFlow({ open, onClose, onComplete }: SharePostFlowProps) {
  const [step, setStep] = useState<Step>('type');
  const [postType, setPostType] = useState<PostType>();
  const [sharing, setSharing] = useState<PostSharingLevel>();

  const reset = () => {
    setStep('type');
    setPostType(undefined);
    setSharing(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const complete = (sharingValue: PostSharingLevel, mediaValue: PostSharingLevel) => {
    const postTypeValue = postType ?? 'prayer';
    reset();
    onComplete(postTypeValue, sharingValue, mediaValue);
  };

  const handleTypeSelect = (value: PostType) => {
    setPostType(value);
    setStep('sharing');
  };

  const handleSharingSelect = (value: PostSharingLevel) => {
    if (value === 'private') {
      complete(value, 'private');
      return;
    }
    setSharing(value);
    setStep('media');
  };

  const handleMediaSelect = (value: PostSharingLevel) => {
    complete(sharing ?? 'public', value);
  };

  const handleBack = () => setStep(step === 'media' ? 'sharing' : 'type');

  if (!open) return null;

  let options: { key: string; label: string; subtitle: string; onSelect: () => void }[];
  if (step === 'type') {
    options = POST_TYPE_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      subtitle: option.subtitle,
      onSelect: () => handleTypeSelect(option.value),
    }));
  } else {
    const levelOptions = step === 'sharing' ? SHARING_OPTIONS : MEDIA_OPTIONS;
    const handleSelect = step === 'sharing' ? handleSharingSelect : handleMediaSelect;
    options = levelOptions.map((option) => ({
      key: option.label,
      label: option.label,
      subtitle: option.subtitle,
      onSelect: () => handleSelect(option.value),
    }));
  }

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
          {step !== 'type' ? (
            <button
              type="button"
              aria-label="Back"
              className={css.HeaderButton}
              onClick={handleBack}
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
          <div className={css.Question}>{QUESTIONS[step]}</div>
          <div className={css.Options}>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                className={css.Option}
                onClick={option.onSelect}
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
