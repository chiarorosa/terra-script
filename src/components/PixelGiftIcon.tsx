import React from 'react';

interface PixelGiftIconProps {
  className?: string;
  size?: number;
}

export const PixelGiftIcon: React.FC<PixelGiftIconProps> = ({ className = 'w-4 h-4', size = 16 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Ribbon Bow top */}
      <rect x="5" y="1" width="2" height="2" fill="#fef08a" />
      <rect x="9" y="1" width="2" height="2" fill="#fef08a" />
      <rect x="4" y="2" width="3" height="2" fill="#facc15" />
      <rect x="9" y="2" width="3" height="2" fill="#facc15" />
      <rect x="7" y="2" width="2" height="2" fill="#ffffff" />

      {/* Box Lid */}
      <rect x="2" y="4" width="12" height="3" fill="#ef4444" />
      <rect x="2" y="4" width="12" height="1" fill="#f87171" /> {/* Highlight */}
      <rect x="7" y="4" width="2" height="3" fill="#facc15" /> {/* Lid Ribbon */}
      <rect x="2" y="6" width="12" height="1" fill="#b91c1c" /> {/* Lid Shadow */}

      {/* Box Body */}
      <rect x="3" y="7" width="10" height="8" fill="#dc2626" />
      <rect x="3" y="7" width="1" height="8" fill="#ef4444" /> {/* Side Highlight */}
      <rect x="12" y="7" width="1" height="8" fill="#991b1b" /> {/* Side Shadow */}
      <rect x="3" y="14" width="10" height="1" fill="#7f1d1d" fillOpacity="0.8" /> {/* Bottom Shadow */}

      {/* Body Vertical Ribbon */}
      <rect x="7" y="7" width="2" height="8" fill="#facc15" />
      <rect x="7" y="7" width="1" height="8" fill="#fef08a" /> {/* Ribbon Highlight */}

      {/* Body Horizontal Ribbon */}
      <rect x="3" y="10" width="10" height="2" fill="#facc15" />
      <rect x="3" y="10" width="10" height="1" fill="#fef08a" opacity="0.8" />

      {/* Sparkle Pixel detail top-right */}
      <rect x="13" y="1" width="1" height="1" fill="#fef08a" opacity="0.9" />
      <rect x="14" y="2" width="1" height="1" fill="#ffffff" />
    </svg>
  );
};
