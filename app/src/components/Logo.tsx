import { clsx } from "clsx";

/** The A·P·C triangle mark from the Figma launch screens. */
export default function Logo({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={clsx("select-none", className)}
      role="img"
      aria-label="AcuPark"
    >
      <path d="M60 10 L112 100 Q114 106 107 106 L13 106 Q6 106 8 100 Z" fill="#E7DAF7" />
      <text x="36" y="66" textAnchor="middle" fontSize="44" fontWeight="600" fill="#B596DD" fontFamily="inherit">
        A
      </text>
      <text x="80" y="66" textAnchor="middle" fontSize="44" fontWeight="600" fill="#B596DD" fontFamily="inherit">
        P
      </text>
      <text x="60" y="102" textAnchor="middle" fontSize="54" fontWeight="800" fill="#502E83" fontFamily="inherit">
        C
      </text>
    </svg>
  );
}
