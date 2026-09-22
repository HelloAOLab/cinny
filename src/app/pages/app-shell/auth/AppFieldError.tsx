import React from 'react';
import * as css from './AppFieldError.css';

const WARNING_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

type AppFieldErrorProps = {
  message: string;
};

export function AppFieldError({ message }: AppFieldErrorProps) {
  return (
    <span className={css.FieldError}>
      {WARNING_ICON}
      {message}
    </span>
  );
}
