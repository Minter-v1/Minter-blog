type Props = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ChevronDown = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Check = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.5}>
    <path d="M5 12.5 10 17 19 7.5" />
  </svg>
);

export const Close = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.5}>
    <path d="M7 7l10 10M17 7 7 17" />
  </svg>
);

export const Plus = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ImageIcon = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.75}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.75" />
    <path d="m21 16-4.5-4.5L7 20" />
  </svg>
);

export const ArrowUpRight = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const ChevronRight = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.25}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const Search = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const Menu = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const More = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

export const Pause = ({ className }: Props) => (
  <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden>
    <rect x="2.5" y="1.5" width="2.5" height="9" rx="1" />
    <rect x="7" y="1.5" width="2.5" height="9" rx="1" />
  </svg>
);
export const Play = ({ className }: Props) => (
  <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden>
    <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
  </svg>
);
