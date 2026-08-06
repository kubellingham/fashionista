/** Stroke iconography from the design — replaces the emoji of v1. */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Stroke({
  d,
  d2,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.8,
}: IconProps & { d: string; d2?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

/* Dock icons — paths taken verbatim from the design prototype. */
export const SunIcon = (p: IconProps) => (
  <Stroke
    {...p}
    d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5"
    d2="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 1 0 0-7.4"
  />
);
export const HangerIcon = (p: IconProps) => (
  <Stroke
    {...p}
    d="M9.9 5.3a2.1 2.1 0 1 1 2.7 2c-.4.1-.6.4-.6.8v1m0 0L4.8 14.5a1.3 1.3 0 0 0 .7 2.4h13a1.3 1.3 0 0 0 .7-2.4L12 9.1z"
  />
);
export const LayersIcon = (p: IconProps) => (
  <Stroke {...p} d="M12 3.6l7.8 4.2L12 12 4.2 7.8z" d2="M4.2 13.2l7.8 4.2 7.8-4.2" />
);
export const DropIcon = (p: IconProps) => (
  <Stroke {...p} d="M12 3.9c3.1 3.6 5.1 6.3 5.1 8.9a5.1 5.1 0 1 1-10.2 0c0-2.6 2-5.3 5.1-8.9z" />
);
export const BarsIcon = (p: IconProps) => (
  <Stroke {...p} d="M5.5 19.5v-6M12 19.5v-11M18.5 19.5v-8.5" />
);

/* UI icons */
export const PlusIcon = (p: IconProps) => <Stroke strokeWidth={2.2} {...p} d="M12 5v14M5 12h14" />;
export const XIcon = (p: IconProps) => <Stroke strokeWidth={2.4} {...p} d="M6 6l12 12M18 6L6 18" />;
export const CheckIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.6} {...p} d="M5 12.5l4.5 4.5L19 7.5" />
);
export const ChevronIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p} d="M9 5l7 7-7 7" />
);
export const SearchIcon = (p: IconProps) => (
  <svg
    width={p.size ?? 15}
    height={p.size ?? 15}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color ?? '#b2a893'}
    strokeWidth={2}
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8L20 20" />
  </svg>
);
export const PencilIcon = (p: IconProps) => (
  <Stroke {...p} d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" />
);
export const CameraIcon = (p: IconProps) => (
  <svg
    width={p.size ?? 22}
    height={p.size ?? 22}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color ?? '#b2a893'}
    strokeWidth={1.7}
    strokeLinejoin="round"
  >
    <path d="M4.5 8.5a2 2 0 0 1 2-2h2l1.2-1.8h4.6l1.2 1.8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Stroke {...p} d="M4 5.5h16v15H4z M4 10.5h16M8.5 3.5v4M15.5 3.5v4" />
);
export const SparkleIcon = (p: IconProps) => (
  <Stroke
    strokeWidth={1.6}
    {...p}
    d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"
  />
);
export const DotsIcon = ({ color = '#8b8271' }: IconProps) => (
  <svg width="16" height="4" viewBox="0 0 16 4">
    <circle cx="2" cy="2" r="1.6" fill={color} />
    <circle cx="8" cy="2" r="1.6" fill={color} />
    <circle cx="14" cy="2" r="1.6" fill={color} />
  </svg>
);
