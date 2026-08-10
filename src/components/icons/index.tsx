/**
 * Hand-drawn icon set. An icon library would be a dependency and a visual
 * fingerprint; these are a few dozen lines of SVG and stay on-brand.
 */

type IconProps = { className?: string; filled?: boolean };

const base = "size-6";

export function DiscoverIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
        fill={filled ? "currentColor" : "none"}
        opacity={filled ? 0.15 : 1}
      />
      <path
        d="M15.2 8.8 13.4 13.4 8.8 15.2l1.8-4.6 4.6-1.8Z"
        fill="currentColor"
      />
      {!filled && (
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      )}
    </svg>
  );
}

export function MatchesIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 12 13H9l-3.4 2.6a.4.4 0 0 1-.6-.3V13a2.5 2.5 0 0 1-1-2v-4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M10 15.5A2.5 2.5 0 0 0 12.5 18H15l3.4 2.6a.4.4 0 0 0 .6-.3V18a2.5 2.5 0 0 0 1-2v-3.5A2.5 2.5 0 0 0 17.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function PlayIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 8.7l5.4-.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function MessagesIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v7.4a2.8 2.8 0 0 1-2.8 2.8H9.6l-4 3.1a.5.5 0 0 1-.8-.4V17A2.8 2.8 0 0 1 4 14.2V6.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
      <circle cx="8.6" cy="10.5" r="1.05" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1.05" fill="currentColor" />
      <circle cx="15.4" cy="10.5" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function ProfileIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle
        cx="12"
        cy="8.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M4.8 20a7.2 7.2 0 0 1 14.4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function LikeIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PassIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FlameIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3s4.5 3.6 4.5 7.6c0 1.2-.4 2.1-1 2.8.2-1.9-.8-3.4-2-4.3.3 2.4-1.2 3.4-2.2 4.5-.8.9-1.3 1.7-1.3 2.8 0 .5.1 1 .3 1.4-1.2-.7-2.3-2.2-2.3-4.2C8 10.5 12 8.7 12 3Z"
        fill="currentColor"
      />
      <path
        d="M12 21c3 0 5.2-2 5.2-4.6 0-1-.3-1.9-.8-2.7-.6 3-3 3.7-3 6 0 .5.1.9.3 1.3-1.3-.2-2.2-1.3-2.2-2.6 0-.6.2-1.1.5-1.6-1.4.9-2.4 2.1-2.4 3.6 0 .2 0 .4.1.6H12Z"
        fill="currentColor"
        opacity=".55"
      />
    </svg>
  );
}

export function BackIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoreIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SendIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 12 20 4l-3.4 8L20 20 4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function PencilIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReplyIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 7 4 12l5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12h9a6 6 0 0 1 6 6v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckSmallIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoubleCheckIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 28 24" fill="none" className={className} aria-hidden>
      <path
        d="M2 13l4 4L15 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5 13.5 17 23 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The brand mark: two speech bubbles mid-exchange. Matches public/icons/icon.svg. */
export function LogoMark({ className = "size-9" }: IconProps) {
  return (
    <svg viewBox="0 0 48 49" fill="none" className={className} aria-hidden>
      <rect width="28" height="20" rx="7" fill="currentColor" />
      <path d="M7 20h7l-7 6.5V20Z" fill="currentColor" />
      <rect x="20" y="22" width="28" height="20" rx="7" fill="currentColor" opacity=".45" />
      <path d="M41 42h-7l7 6.5V42Z" fill="currentColor" opacity=".45" />
    </svg>
  );
}
