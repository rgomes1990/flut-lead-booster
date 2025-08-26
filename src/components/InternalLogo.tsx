
import React from 'react';

interface InternalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  className?: string;
}

export const InternalLogo: React.FC<InternalLogoProps> = ({ 
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
        src="/lovable-uploads/7e3e4947-1420-463e-9783-4a6efb0c47ca.png"
        alt="FLUT Internal"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};
