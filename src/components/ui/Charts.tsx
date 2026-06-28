'use client';

import { useId } from 'react';

/* ──────────────────────────────────────────────────────────
   Bộ chart nhẹ, không phụ thuộc thư viện (SVG thuần).
   - Dark-aware: dùng semantic tokens + currentColor.
   - Accessible: role="img" + aria-label tóm tắt; có empty state.
   Đủ cho analytics dashboard; nếu cần biểu đồ phức tạp hơn
   (time-series, tooltip nâng cao) có thể thay bằng Recharts sau.
   ────────────────────────────────────────────────────────── */

export interface ChartDatum {
  label: string;
  value: number;
  /** Màu tuỳ chọn (mặc định theo brand) */
  color?: string;
}

function EmptyChart({ message = 'Chưa có dữ liệu' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

/**
 * Biểu đồ cột ngang — phù hợp so sánh giữa các mục (vd. học viên / khóa học).
 * Cột ngang giúp nhãn dài dễ đọc & responsive tốt trên mobile.
 */
export function BarChart({
  data,
  valueFormatter = (v) => v.toLocaleString('vi-VN'),
  emptyMessage,
}: {
  data: ChartDatum[];
  valueFormatter?: (v: number) => string;
  emptyMessage?: string;
}) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return <EmptyChart message={emptyMessage} />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const summary = data.map((d) => `${d.label}: ${valueFormatter(d.value)}`).join(', ');

  return (
    <div role="img" aria-label={summary} className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground truncate pr-2">{d.label}</span>
            <span className="text-muted-foreground tabular-nums flex-shrink-0">
              {valueFormatter(d.value)}
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color ?? '#facc15',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Biểu đồ donut — phù hợp tỉ lệ/phân bổ (≤5 nhóm).
 * Có legend kèm giá trị; không dựa hoàn toàn vào màu (có nhãn + số).
 */
export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  emptyMessage,
}: {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  emptyMessage?: string;
}) {
  const gradId = useId();
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!total) return <EmptyChart message={emptyMessage} />;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const palette = ['#facc15', '#10b981', '#0066ff', '#ec4899', '#f59e0b'];

  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const seg = {
      ...d,
      color: d.color ?? palette[i % palette.length],
      dash: fraction * circumference,
      gap: circumference - fraction * circumference,
      rotation: (offset / total) * 360,
    };
    offset += d.value;
    return seg;
  });

  const summary = data.map((d) => `${d.label}: ${d.value}`).join(', ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={summary}
        className="flex-shrink-0"
      >
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={thickness}
          />
          {segments.map((s) => (
            <circle
              key={`${gradId}-${s.label}`}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={0}
              transform={`rotate(${s.rotation - 90})`}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          ))}
          {centerLabel && (
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-black"
              style={{ fontSize: size * 0.16 }}
            >
              {centerLabel}
            </text>
          )}
        </g>
      </svg>

      {/* Legend */}
      <ul className="space-y-2 w-full">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="text-foreground flex-1">{s.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {s.value} ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
