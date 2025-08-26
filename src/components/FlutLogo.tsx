
import React from 'react';

interface FlutLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  className?: string;
}

export const FlutLogo: React.FC<FlutLogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="https://i.imgur.com/Xp8RRKG.png"
        alt="FLUT"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};
