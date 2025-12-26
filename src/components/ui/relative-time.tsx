import { memo } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/date";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

/**
 * Displays a relative time (e.g., "5m ago") with a styled tooltip showing the absolute time.
 * Hover to see the exact date and time.
 */
export const RelativeTime = memo(function RelativeTime({ date, className }: RelativeTimeProps) {
  const relativeTime = formatRelativeTime(date);
  const absoluteTime = formatAbsoluteTime(date);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<time dateTime={date} className={`cursor-default ${className ?? ""}`} />}
      >
        {relativeTime}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg">
            {absoluteTime}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
