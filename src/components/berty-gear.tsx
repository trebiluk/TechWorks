import type { BertyLook } from "@/lib/berty-look";

/** Shop overlays on the 200×260 metal body. Not PNGs. */
export function BertyGear({ look }: { look: BertyLook }) {
  if (look.kit === "plain" && look.hat === "none" && look.hand === "none") return null;
  return (
    <svg className="berty-gear" viewBox="0 0 200 260" aria-hidden>
      {look.kit === "cape" ? (
        <path d="M48 92 C28 130 24 190 40 230 L70 210 C60 170 62 120 78 96 Z M152 92 C172 130 176 190 160 230 L130 210 C140 170 138 120 122 96 Z" fill="#7c3aed" stroke="#1a1a1a" strokeWidth="2.2" />
      ) : null}
      {look.kit === "apron" ? (
        <g>
          <path d="M70 118 L130 118 L138 188 L62 188 Z" fill="#fbbf24" stroke="#1a1a1a" strokeWidth="2.2" />
          <rect x="92" y="128" width="16" height="22" rx="2" fill="#1a1a1a" opacity="0.2" />
        </g>
      ) : null}
      {look.kit === "vest" ? (
        <g>
          <path d="M62 100 L138 100 L148 176 L52 176 Z" fill="#f97316" stroke="#1a1a1a" strokeWidth="2.4" />
          <rect x="88" y="118" width="24" height="14" rx="2" fill="#fde68a" stroke="#1a1a1a" strokeWidth="1.6" />
          <text x="100" y="129" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1a1a1a">CLEAN</text>
        </g>
      ) : null}
      {look.kit === "sash" ? (
        <path d="M58 96 L150 168" stroke="#FDAE3F" strokeWidth="14" strokeLinecap="round" />
      ) : null}
      {look.kit === "jersey" ? (
        <g>
          <rect x="58" y="96" width="84" height="78" rx="8" fill="#235937" stroke="#1a1a1a" strokeWidth="2.2" />
          <text x="100" y="142" textAnchor="middle" fontSize="22" fontWeight="800" fill="#FDAE3F">TW</text>
        </g>
      ) : null}
      {look.kit === "goggles" ? (
        <g>
          <rect x="70" y="40" width="60" height="24" rx="8" fill="#111827" stroke="#1a1a1a" strokeWidth="2" />
          <circle cx="88" cy="52" r="9" fill="#7dd3fc" stroke="#e5e7eb" strokeWidth="2" />
          <circle cx="112" cy="52" r="9" fill="#7dd3fc" stroke="#e5e7eb" strokeWidth="2" />
          <rect x="96" y="48" width="8" height="8" fill="#1f2937" />
        </g>
      ) : null}
      {look.hat === "cap" ? (
        <g>
          <ellipse cx="100" cy="28" rx="42" ry="12" fill="#1d4ed8" stroke="#1a1a1a" strokeWidth="2" />
          <path d="M62 28 Q100 6 138 28" fill="#1d4ed8" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="128" y="24" width="28" height="8" rx="3" fill="#1e3a8a" stroke="#1a1a1a" strokeWidth="1.6" />
        </g>
      ) : null}
      {look.hat === "hard" ? (
        <g>
          <path d="M58 30 Q100 2 142 30 L148 38 L52 38 Z" fill="#facc15" stroke="#1a1a1a" strokeWidth="2.2" />
          <rect x="54" y="36" width="92" height="8" rx="3" fill="#eab308" stroke="#1a1a1a" strokeWidth="1.6" />
        </g>
      ) : null}
      {look.hat === "crown" ? (
        <g>
          <path d="M64 32 L76 12 L88 28 L100 8 L112 28 L124 12 L136 32 Z" fill="#FDAE3F" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="64" y="30" width="72" height="8" fill="#f59e0b" stroke="#1a1a1a" strokeWidth="1.6" />
        </g>
      ) : null}
      {look.hat === "beanie" ? (
        <g>
          <path d="M62 32 Q100 0 138 32 L138 40 L62 40 Z" fill="#be123c" stroke="#1a1a1a" strokeWidth="2" />
          <circle cx="100" cy="6" r="6" fill="#fda4af" stroke="#1a1a1a" strokeWidth="1.5" />
        </g>
      ) : null}
      {look.hat === "visor" ? (
        <g>
          <rect x="68" y="34" width="64" height="10" rx="3" fill="#111827" stroke="#1a1a1a" strokeWidth="1.8" />
          <rect x="124" y="36" width="22" height="7" rx="2" fill="#374151" stroke="#1a1a1a" strokeWidth="1.4" />
        </g>
      ) : null}
      {look.hand === "wrench" ? (
        <g transform="translate(158 148) rotate(-25)">
          <rect x="0" y="0" width="10" height="42" rx="2" fill="#9ca3af" stroke="#1a1a1a" strokeWidth="1.8" />
          <path d="M-6 0 H16 L12 12 H-2 Z" fill="#d1d5db" stroke="#1a1a1a" strokeWidth="1.6" />
        </g>
      ) : null}
      {look.hand === "broom" ? (
        <g transform="translate(160 120)">
          <rect x="4" y="0" width="6" height="70" rx="2" fill="#92400e" stroke="#1a1a1a" strokeWidth="1.6" />
          <path d="M-4 68 H18 L14 92 H0 Z" fill="#f59e0b" stroke="#1a1a1a" strokeWidth="1.6" />
        </g>
      ) : null}
      {look.hand === "clip" ? (
        <g transform="translate(158 150)">
          <rect x="0" y="8" width="28" height="36" rx="2" fill="#fef3c7" stroke="#1a1a1a" strokeWidth="1.6" />
          <rect x="6" y="0" width="16" height="12" rx="2" fill="#6b7280" stroke="#1a1a1a" strokeWidth="1.4" />
        </g>
      ) : null}
      {look.hand === "flag" ? (
        <g transform="translate(158 110)">
          <rect x="0" y="0" width="5" height="70" fill="#4b5563" stroke="#1a1a1a" strokeWidth="1.4" />
          <path d="M5 4 H36 L28 18 H5 Z" fill="#235937" stroke="#1a1a1a" strokeWidth="1.5" />
          <path d="M5 18 H36 L28 32 H5 Z" fill="#FDAE3F" stroke="#1a1a1a" strokeWidth="1.5" />
        </g>
      ) : null}
    </svg>
  );
}
