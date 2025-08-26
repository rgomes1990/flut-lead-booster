
import React from 'react';

interface InternalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const InternalLogo: React.FC<InternalLogoProps> = ({ 
  size = 'md', 
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
        src="/lovable-uploads/2ac0deba-4464-41b9-9daa-44513f34ee0e.png"
        alt="FLUT Internal"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};
