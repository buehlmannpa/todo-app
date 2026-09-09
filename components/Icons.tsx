import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconToday = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const IconInbox = (p: Props) => (
  <Base {...p}>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M5.5 5h13l2.5 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
  </Base>
);

export const IconProjects = (p: Props) => (
  <Base {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3l2 2.5h8A2.5 2.5 0 0 1 21 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Base>
);

export const IconArchive = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1.4" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
  </Base>
);

export const IconPlus = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconStar = ({ filled, ...p }: Props & { filled?: boolean }) => (
  <Base {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
  </Base>
);

export const IconCheck = (p: Props) => (
  <Base {...p} strokeWidth="2.6">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const IconCalendar = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Base>
);

export const IconClock = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </Base>
);

export const IconRepeat = (p: Props) => (
  <Base {...p}>
    <path d="M4 10a5 5 0 0 1 5-5h9M4 10l3-3M4 10l3 3" />
    <path d="M20 14a5 5 0 0 1-5 5H6M20 14l-3 3M20 14l-3-3" />
  </Base>
);

export const IconLink = (p: Props) => (
  <Base {...p}>
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2" />
    <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2" />
  </Base>
);

export const IconFlag = (p: Props) => (
  <Base {...p}>
    <path d="M5 21V4M5 4h11l-2 3.5L16 11H5" />
  </Base>
);

export const IconBell = (p: Props) => (
  <Base {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </Base>
);

export const IconClose = (p: Props) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconTrash = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </Base>
);

export const IconChevronRight = (p: Props) => (
  <Base {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
);

export const IconChevronLeft = (p: Props) => (
  <Base {...p}>
    <path d="m15 5-7 7 7 7" />
  </Base>
);

export const IconChevronUp = (p: Props) => (
  <Base {...p}>
    <path d="m5 15 7-7 7 7" />
  </Base>
);

export const IconChevronDown = (p: Props) => (
  <Base {...p}>
    <path d="m5 9 7 7 7-7" />
  </Base>
);

export const IconList = (p: Props) => (
  <Base {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </Base>
);

export const IconTimeline = (p: Props) => (
  <Base {...p}>
    <path d="M6 3v18M6 7h12M6 13h9M6 19h6" />
    <circle cx="6" cy="7" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6" cy="13" r="1.6" fill="currentColor" stroke="none" />
  </Base>
);

export const IconSearch = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

export const IconSettings = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Base>
);

export const IconFolder = (p: Props) => (
  <Base {...p} strokeWidth="2">
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h3l2 2.5h7A2.5 2.5 0 0 1 20 11v5.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Base>
);

export const IconLogout = (p: Props) => (
  <Base {...p}>
    <path d="M15 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2M10 8l-4 4 4 4M6 12h11" />
  </Base>
);

export const IconEdit = (p: Props) => (
  <Base {...p}>
    <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16z" />
  </Base>
);
