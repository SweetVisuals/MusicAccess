import React from 'react';

interface MainContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContentArea({ children, className }: MainContentAreaProps) {
  return (
    <div className={`@container/main flex-grow h-full ${className}`}>
      {children}
    </div>
  );
}
