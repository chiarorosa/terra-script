import React from 'react';

interface GameLogoProps {
  className?: string;
  size?: number;
}

export const GameLogo: React.FC<GameLogoProps> = ({ className = 'w-8 h-8', size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform hover:scale-105`}
      style={style}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="logoTileTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="logoSproutGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#3fb950" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>

        <linearGradient id="logoCircuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#3fb950" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Isometric 3D Base Tile - Left Face */}
      <path
        d="M 10 38 L 32 50 L 32 56 L 10 44 Z"
        fill="#0b1320"
        stroke="#1e293b"
        strokeWidth="0.8"
      />

      {/* Isometric 3D Base Tile - Right Face */}
      <path
        d="M 32 50 L 54 38 L 54 44 L 32 56 Z"
        fill="#070d18"
        stroke="#1e293b"
        strokeWidth="0.8"
      />

      {/* Isometric 3D Base Tile - Top Surface */}
      <path
        d="M 32 26 L 54 38 L 32 50 L 10 38 Z"
        fill="url(#logoTileTop)"
        stroke="#334155"
        strokeWidth="1.2"
      />

      {/* Top Tile Circuit Lines (TerraScript Grid) */}
      <path
        d="M 21 33.5 L 32 39.5 L 43 33.5"
        stroke="url(#logoCircuitGrad)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 32 26 L 32 39.5"
        stroke="url(#logoCircuitGrad)"
        strokeWidth="1"
        strokeDasharray="1.5 1.5"
        opacity="0.6"
      />

      {/* Circuit Nodes */}
      <circle cx="21" cy="33.5" r="1.5" fill="#00f0ff" filter="url(#logoGlow)" />
      <circle cx="43" cy="33.5" r="1.5" fill="#3fb950" filter="url(#logoGlow)" />
      <circle cx="32" cy="39.5" r="2" fill="#00f0ff" filter="url(#logoGlow)" />

      {/* Glowing Energy Core / Root Base */}
      <ellipse cx="32" cy="39" rx="4" ry="2" fill="#00f0ff" opacity="0.3" filter="url(#logoGlow)" />

      {/* Sprout Stem */}
      <path
        d="M 32 39 C 32 28, 30 20, 32 10"
        stroke="url(#logoSproutGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#logoGlow)"
      />

      {/* Sprout Leaf - Left */}
      <path
        d="M 31 22 C 22 20, 16 26, 24 29 C 28 28, 31 24, 31 22 Z"
        fill="url(#logoSproutGrad)"
        opacity="0.95"
      />

      {/* Sprout Leaf - Right (Higher & Glowing) */}
      <path
        d="M 33 16 C 42 12, 48 18, 40 22 C 36 22, 33 18, 33 16 Z"
        fill="url(#logoSproutGrad)"
        filter="url(#logoGlow)"
      />

      {/* Top Digital Energy Spark / Node */}
      <circle cx="32" cy="10" r="2.2" fill="#00f0ff" filter="url(#logoGlow)" />
      <circle cx="32" cy="10" r="1" fill="#ffffff" />
    </svg>
  );
};
