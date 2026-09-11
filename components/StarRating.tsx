'use client';

import React from 'react';

type Props = {
  value: number;
  onChange: (v: number) => void;
  size?: number;
};

export default function StarRating({ value, onChange, size = 24 }: Props) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(display - (i - 1), 0), 1);
        return (
          <div
            key={i}
            className="relative select-none"
            style={{ width: size, height: size, cursor: 'pointer' }}
          >
            <Star fill={fill} size={size} />
            <div
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHover(i - 0.5)}
              onClick={() => onChange(i - 0.5)}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHover(i)}
              onClick={() => onChange(i)}
            />
          </div>
        );
      })}
      <span className="text-sm text-black/40 ml-2 w-8 tabular-nums">
        {display ? display.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function Star({ fill, size }: { fill: number; size: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="block">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#f5b301" />
          <stop offset={`${fill * 100}%`} stopColor="#e5e5e5" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={`url(#${id})`}
        stroke="#d4d4d4"
        strokeWidth="0.5"
      />
    </svg>
  );
}