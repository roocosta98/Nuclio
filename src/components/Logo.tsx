'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ 
  className = '', 
  variant = 'color', 
  size = 'md' 
}: LogoProps) {
  const textColor = {
    color: 'text-slate-100',
    light: 'text-white',
    dark: 'text-slate-900'
  }[variant];

  const fontSizeClass = {
    sm: 'text-xl sm:text-2xl font-bold tracking-tight',
    md: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tight'
  }[size];

  return (
    <div className={`flex items-center select-none ${className}`}>
      <span 
        className={`leading-none ${textColor} ${fontSizeClass} transition-colors duration-300`}
        style={{ fontFamily: '"Outfit", "Inter", "Georgia", serif' }}
      >
        <span className="flex items-center">
          {/* Custom vector representation of Nuclio text to resemble the humanist serif/flared typography */}
          <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">N</span>
          <span className="lowercase bg-gradient-to-r from-slate-200 to-indigo-300 bg-clip-text text-transparent">uclio</span>
        </span>
      </span>
    </div>
  );
}
