import React, { ReactNode } from 'react';
import * as css from './AppEmptyState.css';

type AppEmptyStateProps = {
  title: string;
  subtitle?: ReactNode;
  action?: { label: string; onClick: () => void };
};

export function AppEmptyState({ title, subtitle, action }: AppEmptyStateProps) {
  return (
    <div className={css.EmptyState}>
      <span className={css.EmptyStateTitle}>{title}</span>
      {subtitle && <span className={css.EmptyStateSubtitle}>{subtitle}</span>}
      {action && (
        <button type="button" className={css.EmptyStateAction} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
