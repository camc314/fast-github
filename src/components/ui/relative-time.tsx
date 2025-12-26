import { memo } from "react";
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/date";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

/**
 * Displays a relative time (e.g., "5m ago") with a tooltip showing the absolute time.
 * Hover to see the exact date and time.
 */
export const RelativeTime = memo(function RelativeTime({ date, className }: RelativeTimeProps) {
  const relativeTime = formatRelativeTime(date);
  const absoluteTime = formatAbsoluteTime(date);

  return (
    <time
      dateTime={date}
      title={absoluteTime}
      className={className}
    >
      {relativeTime}
    </time>
  );
});
