import React from "react";

export const BackgroundBeams = ({ className }) => {
  return (
    <div
      className={`absolute top-0 left-0 w-full h-full overflow-hidden flex flex-col items-center justify-center antialiased ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      <div className="absolute inset-0 bg-transparent z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 blur-[100px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mix-blend-screen animate-blob filter" />
      </div>
      {/* SVG Grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 40L40 0H20L0 20M40 40V20L20 40"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
};

export default BackgroundBeams;
