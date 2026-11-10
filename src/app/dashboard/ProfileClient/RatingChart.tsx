import { useId } from "react";

interface RatingChartProps {
  points: { rating: number; at: string }[];
  color: string;
}

const WIDTH = 300;
const HEIGHT = 84;
const PAD = 8;

/** A small line chart of recent rating, drawn as SVG (no chart library). */
export default function RatingChart({ points, color }: RatingChartProps) {
  const gradientId = useId();

  if (points.length < 2) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted">
        Play ranked matches to see your rating trend.
      </p>
    );
  }

  const ratings = points.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const span = Math.max(1, max - min);
  const x = (i: number) => PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
  const y = (rating: number) => HEIGHT - PAD - ((rating - min) / span) * (HEIGHT - PAD * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${HEIGHT} L${x(0).toFixed(1)},${HEIGHT} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const change = last && first ? last.rating - first.rating : 0;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Rating over your last ${points.length} ranked matches, ${change >= 0 ? "up" : "down"} ${Math.abs(Math.round(change))}`}
        className="h-24 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {last && <circle cx={x(points.length - 1)} cy={y(last.rating)} r="3.5" fill={color} />}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted">
        <span>Last {points.length} ranked matches</span>
        <span className={change >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-rose-500"}>
          {change >= 0 ? "+" : ""}
          {Math.round(change)}
        </span>
      </figcaption>
    </figure>
  );
}