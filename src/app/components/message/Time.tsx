import React, { ComponentProps, useEffect, useState } from 'react';
import { Text, as } from 'folds';
import { relativeTime, timeDayMonYear, timeHourMinute } from '../../utils/time';

export type TimeProps = {
  compact?: boolean;
  ts: number;
  hour24Clock: boolean;
  dateFormatString: string;
};

const REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * Renders a relative timestamp (e.g. "2 minutes ago", "3 days ago"), refreshing periodically.
 * The absolute date/time is available as a hover tooltip.
 */
export const Time = as<'span', TimeProps & ComponentProps<typeof Text>>(
  ({ compact, hour24Clock, dateFormatString, ts, ...props }, ref) => {
    const [, setTick] = useState(0);

    useEffect(() => {
      const intervalId = setInterval(() => setTick((tick) => tick + 1), REFRESH_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }, []);

    const time = relativeTime(ts, Date.now(), compact ? 'narrow' : 'long');
    const absoluteTime = `${timeDayMonYear(ts, dateFormatString)} ${timeHourMinute(
      ts,
      hour24Clock
    )}`;

    return (
      <Text
        as="time"
        style={{ flexShrink: 0 }}
        size="T200"
        priority="300"
        title={absoluteTime}
        {...props}
        ref={ref}
      >
        {time}
      </Text>
    );
  }
);
