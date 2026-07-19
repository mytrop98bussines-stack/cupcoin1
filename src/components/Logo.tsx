import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
  return (
    <svg
      width={size * 3.5}
      height={size}
      viewBox="0 0 350 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="175"
        y="50"
        fontFamily="'Poppins', 'Inter', system-ui, -apple-system, sans-serif"
        fontSize="80"
        fontWeight="900"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-4"
      >
        cupcoin
      </text>
    </svg>
  );
};
