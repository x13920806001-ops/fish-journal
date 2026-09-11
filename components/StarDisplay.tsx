'use client';

import React from 'react';

type Props = {
  value: number;
  size?: number;
  showNumber?: boolean;   // 是否显示数字
};

export default function StarDisplay({ value, size = 16, showNumber = false }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(value - (i - 1), 0), 1);
        return <Star key={i} fill={fill} size={size} />;
      })}
      {showNumber && (
        <span className="text-xs text-black/40 ml-1 tabular-nums">{value.toFixed(1)}</span>
      )}
    </span>
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