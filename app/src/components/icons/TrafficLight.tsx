import React from 'react';

export const TrafficLight = ({ size = 24, className = "", ...props }: { size?: number | string, className?: string } & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      {...props}
    >
      {/* Post */}
      <path d="M12 22v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Housing */}
      <rect x="7" y="2" width="10" height="16" rx="3" fill="currentColor" />
      
      {/* Lights - Using the secondary yellow color #FFC700 for branding */}
      <circle cx="12" cy="6" r="1.5" fill="#FFC700" />
      <circle cx="12" cy="10" r="1.5" fill="#FFC700" />
      <circle cx="12" cy="14" r="1.5" fill="#FFC700" />
    </svg>
  );
};
