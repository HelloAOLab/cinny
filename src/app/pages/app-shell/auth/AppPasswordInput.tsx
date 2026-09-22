import React, { InputHTMLAttributes, Ref, forwardRef } from 'react';
import { UseStateProvider } from '../../../components/UseStateProvider';
import * as css from './AppAuthForm.css';

const EYE_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 4.22-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19" />
    <path d="m1 1 22 22" />
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
  </svg>
);

type AppPasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export const AppPasswordInput = forwardRef(
  (props: AppPasswordInputProps, ref: Ref<HTMLInputElement>) => (
    <UseStateProvider initial={false}>
      {(visible, setVisible) => (
        <div className={css.InputRow}>
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={css.InputWithButton}
            {...props}
          />
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            className={css.InputIconButton}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? EYE_OFF_ICON : EYE_ICON}
          </button>
        </div>
      )}
    </UseStateProvider>
  )
);
