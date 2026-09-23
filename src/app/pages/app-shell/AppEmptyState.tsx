import React, { ReactNode } from 'react';
import * as css from './AppEmptyState.css';

type AppEmptyStateProps = {
  title: string;
  subtitle?: ReactNode;
};

export function AppEmptyState({ title, subtitle }: AppEmptyStateProps) {
  return (
    <div className={css.EmptyState}>
      <span className={css.EmptyStateTitle}>{title}</span>
      {subtitle && <span className={css.EmptyStateSubtitle}>{subtitle}</span>}
    </div>
  );
}
