"use client";

export function AvaAskMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`avaAskMark ${className}`.trim()} data-testid="ava-ask-mark">
      <span className="avaAskMark-a">a</span>
      <span className="avaAskMark-v">V</span>
      <span className="avaAskMark-a">a</span>
    </span>
  );
}
