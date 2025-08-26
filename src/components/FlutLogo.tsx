
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
        src="/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png"
        alt="FLUT"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};
