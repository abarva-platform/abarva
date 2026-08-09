"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MeasuredChartSize {
  width: number;
  height: number;
}

export function MeasuredChartFrame({
  children,
  minHeight = 180,
}: {
  children: (size: MeasuredChartSize) => ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<MeasuredChartSize | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame: number | null = null;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const next =
        rect.width > 1 && rect.height > 1
          ? {
              width: Math.floor(rect.width),
              height: Math.floor(rect.height),
            }
          : null;

      setSize((current) =>
        current?.width === next?.width && current?.height === next?.height
          ? current
          : next,
      );
    };

    const schedule = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    schedule();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(node);
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        height: "100%",
        minHeight,
        minWidth: 1,
        width: "100%",
      }}
    >
      {size ? children(size) : null}
    </div>
  );
}
