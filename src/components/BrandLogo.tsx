import React, { useId, useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  spinOnClick?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  animated = true,
  spinOnClick = true,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const [spinCount, setSpinCount] = useState(0);

  const dims =
    size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';

  return (
    <div
      onClick={() => {
        if (animated && spinOnClick) {
          setSpinCount((c) => c + 1);
        }
      }}
      className={`relative shrink-0 select-none transition-transform duration-200 ${
        animated ? 'hover:scale-105 active:scale-90' : ''
      } ${dims} ${className}`}
    >
      {/* 4-Petal Emerald Ribbon Fan Layer */}
      <div
        style={{ transform: `rotate(${spinCount * 360}deg)` }}
        className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(34,197,94,0.28)]"
        >
          <defs>
            <linearGradient id={`${uid}-dark-tl`} x1="25" y1="15" x2="95" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0C1710" />
              <stop offset="55%" stopColor="#265432" />
              <stop offset="100%" stopColor="#5BB963" />
            </linearGradient>
            <linearGradient id={`${uid}-bright-tl`} x1="16" y1="62" x2="96" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86E37D" />
              <stop offset="55%" stopColor="#3B8947" />
              <stop offset="100%" stopColor="#0C1710" />
            </linearGradient>

            <linearGradient id={`${uid}-dark-tr`} x1="175" y1="25" x2="105" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5BB963" />
              <stop offset="55%" stopColor="#245230" />
              <stop offset="100%" stopColor="#0B150E" />
            </linearGradient>
            <linearGradient id={`${uid}-bright-tr`} x1="138" y1="16" x2="118" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86E37D" />
              <stop offset="55%" stopColor="#3B8947" />
              <stop offset="100%" stopColor="#0B150E" />
            </linearGradient>

            <linearGradient id={`${uid}-dark-br`} x1="175" y1="185" x2="105" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#08100B" />
              <stop offset="55%" stopColor="#224E2D" />
              <stop offset="100%" stopColor="#5BB963" />
            </linearGradient>
            <linearGradient id={`${uid}-bright-br`} x1="184" y1="138" x2="104" y2="118" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86E37D" />
              <stop offset="55%" stopColor="#3B8947" />
              <stop offset="100%" stopColor="#09120C" />
            </linearGradient>

            <linearGradient id={`${uid}-dark-bl`} x1="25" y1="175" x2="95" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#080F0B" />
              <stop offset="60%" stopColor="#255331" />
              <stop offset="100%" stopColor="#5BB963" />
            </linearGradient>
            <linearGradient id={`${uid}-bright-bl`} x1="62" y1="184" x2="82" y2="104" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86E37D" />
              <stop offset="55%" stopColor="#3B8947" />
              <stop offset="100%" stopColor="#0B150E" />
            </linearGradient>
          </defs>

          {/* Top-Left 3D Folded Ribbon Petal */}
          <g>
            <path
              d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z"
              fill={`url(#${uid}-dark-tl)`}
            />
            <path
              d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z"
              fill={`url(#${uid}-bright-tl)`}
            />
          </g>

          {/* Top-Right 3D Folded Ribbon Petal */}
          <g transform="rotate(90 100 100)">
            <path
              d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z"
              fill={`url(#${uid}-dark-tr)`}
            />
            <path
              d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z"
              fill={`url(#${uid}-bright-tr)`}
            />
          </g>

          {/* Bottom-Right 3D Folded Ribbon Petal */}
          <g transform="rotate(180 100 100)">
            <path
              d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z"
              fill={`url(#${uid}-dark-br)`}
            />
            <path
              d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z"
              fill={`url(#${uid}-bright-br)`}
            />
          </g>

          {/* Bottom-Left 3D Folded Ribbon Petal */}
          <g transform="rotate(270 100 100)">
            <path
              d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z"
              fill={`url(#${uid}-dark-bl)`}
            />
            <path
              d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z"
              fill={`url(#${uid}-bright-bl)`}
            />
          </g>
        </svg>
      </div>

      {/* Upright Central Circular Taka Emblem */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`${uid}-center-grad`} x1="65" y1="100" x2="135" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#77D972" />
              <stop offset="48%" stopColor="#2F6E3D" />
              <stop offset="100%" stopColor="#0A110D" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="34"
            fill={`url(#${uid}-center-grad)`}
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          <text
            x="100"
            y="115"
            textAnchor="middle"
            fontSize="44"
            fontWeight="800"
            fill="#FFFFFF"
            style={{ fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif" }}
          >
            ৳
          </text>
        </svg>
      </div>
    </div>
  );
};
