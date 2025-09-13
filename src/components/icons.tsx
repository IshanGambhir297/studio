import React from 'react';

export const Icons = {
  Logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 2a10 10 0 0 0-3.5 19.5" />
      <path d="M12 2a10 10 0 0 1 3.5 19.5" />
      <path d="M12 8a4 4 0 0 1 4 4" />
      <path d="M12 8a4 4 0 0 0-4 4" />
      <path d="M12 22v-6" />
      <path d="M12 16a4 4 0 0 1-4-4" />
      <path d="M12 16a4 4 0 0 0 4-4" />
      <path d="M7 12h10" />
    </svg>
  ),
};
