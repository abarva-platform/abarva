'use client';

import React from 'react';

interface MaestroFigureProps {
  phase: number;
  animate: boolean;
}

export function MaestroFigure({ phase, animate }: MaestroFigureProps) {
  return (
    <>
      <style>{`
        @keyframes pub-maestro-walk {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .pub-maestro-figure--walking {
          animation: pub-maestro-walk 0.6s ease-in-out infinite alternate;
        }
      `}</style>
      <svg
        className={`pub-maestro-figure${animate ? ' pub-maestro-figure--walking' : ''}`}
        width="80"
        height="140"
        viewBox="0 0 80 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="maestro-title maestro-desc"
        role="img"
        data-phase={phase}
      >
        <title id="maestro-title">Maestro figure</title>
        <desc id="maestro-desc">
          A robed conductor figure representing the Maestro AI program orchestrator, currently in
          phase {phase}
        </desc>

        {/* Head */}
        <circle cx="40" cy="18" r="10" fill="#000000" />

        {/* Neck */}
        <rect x="37" y="27" width="6" height="8" fill="#000000" />

        {/* Robe body — trapezoid wider at bottom */}
        <path d="M28 35 L52 35 L60 110 L20 110 Z" fill="#000000" />

        {/* Left arm */}
        <path
          d="M28 45 L10 62"
          stroke="#000000"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Right arm — raised slightly as if conducting */}
        <path
          d="M52 45 L70 55"
          stroke="#000000"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Left hand baton hint */}
        <circle cx="10" cy="62" r="3" fill="#000000" />

        {/* Right hand */}
        <circle cx="70" cy="55" r="3" fill="#000000" />

        {/* Feet — two small rectangles peeking out */}
        <rect x="24" y="110" width="14" height="10" rx="3" fill="#000000" />
        <rect x="42" y="110" width="14" height="10" rx="3" fill="#000000" />
      </svg>
    </>
  );
}
