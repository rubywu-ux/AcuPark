import { clsx } from "clsx";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
        isActive
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
          : "bg-white text-text border-gray-200 hover:border-primary/50 hover:text-primary"
      )}
    >
      {label}
    </button>
  );
}
