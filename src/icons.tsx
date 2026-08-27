import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const shared = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <path d="m18 14 4 4-4 4" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 18h2.5a7 7 0 0 0 5.7-3" />
      <path d="M2 6h2.5a7 7 0 0 1 6.1 3.6l2.8 4.8A7 7 0 0 0 19.5 18H22" />
      <path d="M22 6h-2.5a7 7 0 0 0-5.7 3" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...shared} {...props}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h1.8c2.9 0 5.2-2.3 5.2-5.2C22 5.7 17.5 2 12 2Z" />
    </svg>
  );
}
