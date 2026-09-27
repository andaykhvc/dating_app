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

export function InfoIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 11v5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ArrowDownIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 5v14m0 0-6-6m6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
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

/** Google's "G" mark is fixed-color per brand guidelines — not currentColor. */
export function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1c.95-2.84 3.6-4.94 6.73-4.94Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AppleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.65 0-1.63-.73-2.68-.71-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.17 1.03 8.19.68.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.68.64 1.11-.02 1.81-1 2.48-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.14-.82-2.17-3.26Z" />
      <path d="M15.05 6.4c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.57-.85 2.49.9.07 1.83-.46 2.39-1.15Z" />
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
