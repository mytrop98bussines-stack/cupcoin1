import React from 'react';

interface LogoProps {
  size?: number; // Permite controlar el tamaño (ej. 32, 48, 64)
}

export const Logo: React.FC<LogoProps> = ({ size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bloque Principal Izquierdo */}
      <path 
        d="M15 15H42L85 85H58L15 15Z" 
        fill="#000000" 
        stroke="#cbd5e1" 
        strokeWidth="5" 
        strokeLinejoin="miter" 
      />
      {/* Bloque Superior Derecho */}
      <path 
        d="M85 15H58L45.5 35L57.5 45L85 15Z" 
        fill="#000000" 
        stroke="#cbd5e1" 
        strokeWidth="5" 
        strokeLinejoin="miter" 
      />
      {/* Bloque Inferior Izquierdo */}
      <path 
        d="M15 85H42L54.5 65L42.5 55L15 85Z" 
        fill="#000000" 
        stroke="#cbd5e1" 
        strokeWidth="5" 
        strokeLinejoin="miter" 
      />
    </svg>
  );
};
        
