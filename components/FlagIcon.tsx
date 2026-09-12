import React from 'react';

interface FlagIconProps {
  code: 'km' | 'en' | 'zh' | string;
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ code, className = "w-5 h-3.5" }) => {
  const normCode = code ? code.toLowerCase() : 'km';

  if (normCode === 'km' || normCode === 'kh') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`inline-block rounded-xs overflow-hidden shadow-xs border border-black/10 shrink-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Flag of Cambodia"
      >
        <rect width="30" height="20" fill="#032EA6" />
        <rect y="5" width="30" height="10" fill="#E00025" />
        {/* Angkor Wat detail */}
        <g fill="#FFFFFF">
          <rect x="5" y="13.5" width="20" height="1.5" />
          <rect x="7" y="12" width="16" height="1.5" />
          <rect x="8.5" y="10.5" width="13" height="1.5" />
          {/* Main Towers */}
          <path d="M13.5 6.5h3v4h-3zM9.5 8h2v2.5h-2zM18.5 8h2v2.5h-2z" />
          <path d="M15 4.5l-1.5 2h3zM10.5 6.5l-1 1.5h2zM19.5 6.5l-1 1.5h2z" />
        </g>
      </svg>
    );
  }

  if (normCode === 'en' || normCode === 'us') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`inline-block rounded-xs overflow-hidden shadow-xs border border-black/10 shrink-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Flag of United States"
      >
        <rect width="30" height="20" fill="#B22234" />
        <path d="M0 2.85h30M0 5.7h30M0 8.55h30M0 11.4h30M0 14.25h30M0 17.1h30" stroke="#FFFFFF" strokeWidth="1.43" />
        <rect width="12" height="11.4" fill="#3C3B6E" />
        <g fill="#FFFFFF">
          <circle cx="2" cy="1.8" r="0.5" />
          <circle cx="6" cy="1.8" r="0.5" />
          <circle cx="10" cy="1.8" r="0.5" />
          <circle cx="4" cy="3.6" r="0.5" />
          <circle cx="8" cy="3.6" r="0.5" />
          <circle cx="2" cy="5.4" r="0.5" />
          <circle cx="6" cy="5.4" r="0.5" />
          <circle cx="10" cy="5.4" r="0.5" />
          <circle cx="4" cy="7.2" r="0.5" />
          <circle cx="8" cy="7.2" r="0.5" />
          <circle cx="2" cy="9.0" r="0.5" />
          <circle cx="6" cy="9.0" r="0.5" />
          <circle cx="10" cy="9.0" r="0.5" />
        </g>
      </svg>
    );
  }

  if (normCode === 'zh' || normCode === 'cn') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`inline-block rounded-xs overflow-hidden shadow-xs border border-black/10 shrink-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Flag of China"
      >
        <rect width="30" height="20" fill="#EE1C25" />
        {/* Main Star */}
        <polygon points="5,2.5 5.9,5.2 8.8,5.2 6.4,6.9 7.3,9.6 5,7.9 2.7,9.6 3.6,6.9 1.2,5.2 4.1,5.2" fill="#FFDE00" />
        {/* 4 Smaller Stars */}
        <polygon points="10,2 10.3,2.8 11.1,2.8 10.4,3.3 10.7,4.1 10,3.6 9.3,4.1 9.6,3.3 8.9,2.8 9.7,2.8" fill="#FFDE00" />
        <polygon points="12,3.8 12.3,4.6 13.1,4.6 12.4,5.1 12.7,5.9 12,5.4 11.3,5.9 11.6,5.1 10.9,4.6 11.7,4.6" fill="#FFDE00" />
        <polygon points="12,6.8 12.3,7.6 13.1,7.6 12.4,8.1 12.7,8.9 12,8.4 11.3,8.9 11.6,8.1 10.9,7.6 11.7,7.6" fill="#FFDE00" />
        <polygon points="10,8.8 10.3,9.6 11.1,9.6 10.4,10.1 10.7,10.9 10,10.4 9.3,10.9 9.6,10.1 8.9,9.6 9.7,9.6" fill="#FFDE00" />
      </svg>
    );
  }

  return (
    <span className="text-xs font-bold uppercase tracking-wider">{code}</span>
  );
};
