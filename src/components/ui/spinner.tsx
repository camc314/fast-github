import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return <Loader2 size={size} className={`animate-spin text-gray-500 ${className}`} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size={32} />
    </div>
  );
}
