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
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      )}
    >
      {label}
    </button>
  );
}
