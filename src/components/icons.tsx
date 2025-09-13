import React from 'react';

export const Icons = {
  Logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a5 5 0 0 0-5 5c0 1.8.8 3.4 2 4.3" />
      <path d="M12 2a5 5 0 0 1 5 5c0 1.8-.8 3.4-2 4.3" />
      <path d="M12 22a5 5 0 0 1-5-5c0-1.8.8-3.4 2-4.3" />
      <path d="M12 22a5 5 0 0 0 5-5c0-1.8-.8-3.4-2-4.3" />
      <path d="M12 17a5 5 0 0 0-5-5" />
      <path d="M12 17a5 5 0 0 1 5-5" />
      <path d="M7 12a5 5 0 0 0 5 5" />
      <path d="M17 12a5 5 0 0 1-5 5" />
    </svg>
  ),
};
