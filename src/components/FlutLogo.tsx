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
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const variantClasses = {
    default: 'text-primary',
    white: 'text-white',
    dark: 'text-gray-900'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon part with gradient background */}
      <div className="relative">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg">
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 md:w-7 md:h-7 text-white fill-current"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-br from-accent to-accent-dark rounded-lg blur opacity-25"></div>
      </div>
      
      {/* Text part */}
      <span className={`font-bold ${sizeClasses[size]} ${variantClasses[variant]} tracking-tight`}>
        flut
      </span>
    </div>
  );
};