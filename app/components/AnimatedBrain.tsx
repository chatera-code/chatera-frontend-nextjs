'use client';

import React from 'react';

const AnimatedBrain = ({ className, isAnimating }: { className?: string; isAnimating: boolean; }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .pulse-1 { animation: pulse 2s ease-in-out infinite; animation-delay: 0s; }
          .pulse-2 { animation: pulse 2s ease-in-out infinite; animation-delay: 0.25s; }
          .pulse-3 { animation: pulse 2s ease-in-out infinite; animation-delay: 0.5s; }
          .pulse-4 { animation: pulse 2s ease-in-out infinite; animation-delay: 0.75s; }
        `}
      </style>
      <path
        d="M9 12C9 14.2091 10.7909 16 13 16H14C16.2091 16 18 14.2091 18 12C18 9.79086 16.2091 8 14 8H13C10.7909 8 9 9.79086 9 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        className={isAnimating ? 'pulse-1' : ''}
      />
      <path
        d="M15 12C15 14.2091 13.2091 16 11 16H10C7.79086 16 6 14.2091 6 12C6 9.79086 7.79086 8 10 8H11C13.2091 8 15 9.79086 15 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        className={isAnimating ? 'pulse-2' : ''}
      />
      <path
        d="M12 9V6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6V9"
        stroke="currentColor"
        strokeWidth="1.5"
        className={isAnimating ? 'pulse-3' : ''}
      />
       <path
        d="M12 15V18C12 19.6569 13.3431 21 15 21C16.6569 21 18 19.6569 18 18V15"
        stroke="currentColor"
        strokeWidth="1.5"
        className={isAnimating ? 'pulse-4' : ''}
      />
    </svg>
  );
};

export default AnimatedBrain;
