import { getIso2 } from '../lib/flagMap';

interface Props {
  /** ESPN 3-letter abbreviation (e.g. "ESP") */
  espnAbbr: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DIMS: Record<string, [number, number]> = {
  sm: [20, 15],
  md: [28, 21],
  lg: [40, 30],
};

export default function Flag({ espnAbbr, size = 'md', className = '' }: Props) {
  const iso2 = getIso2(espnAbbr);
  const [w, h] = DIMS[size];

  if (!iso2) {
    // No flag available — show the abbreviation as a fallback
    return (
      <span
        className={`inline-flex items-center justify-center bg-slate-700 text-slate-300
                    text-[10px] font-bold rounded-sm ${className}`}
        style={{ width: w, height: h, minWidth: w }}
      >
        {espnAbbr.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${iso2}.png`}
      width={w}
      height={h}
      alt={espnAbbr}
      loading="lazy"
      decoding="async"
      className={`inline-block rounded-sm shrink-0 ${className}`}
      onError={e => {
        // Replace broken image with text fallback
        const el = e.currentTarget;
        el.style.display = 'none';
        const span = document.createElement('span');
        span.textContent = espnAbbr.slice(0, 2);
        span.className = 'inline-flex items-center justify-center bg-slate-700 text-slate-300 text-[10px] font-bold rounded-sm';
        span.style.width = `${w}px`;
        span.style.height = `${h}px`;
        el.parentNode?.insertBefore(span, el);
      }}
    />
  );
}
