import { memo, useState } from "react";

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export const Avatar = memo(function Avatar({ src, alt, size = 20, className = "" }: AvatarProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`rounded-full bg-bg-tertiary flex items-center justify-center text-fg-secondary text-xs font-medium ${className}`}
        style={{ width: size, height: size }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ minWidth: size, minHeight: size }}
      className={`rounded-full aspect-square object-cover shrink-0 ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
});
