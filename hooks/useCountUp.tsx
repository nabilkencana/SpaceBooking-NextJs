"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

export interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  ease?: string;
}

/**
 * Custom hook for smooth GSAP-powered number roll-up animations.
 * Formats numbers according to Indonesian locale (id-ID).
 * Respects prefers-reduced-motion.
 */
export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): string {
  const {
    duration = 0.85,
    decimals = 0,
    prefix = "",
    suffix = "",
    ease = "power3.out",
  } = options;

  const [displayValue, setDisplayValue] = useState<string>(() => {
    const formatted = target.toLocaleString("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix}${formatted}${suffix}`;
  });

  const valueRef = useRef<{ val: number }>({ val: 0 });

  useEffect(() => {
    // Check user preference for reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const formatted = target.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      setDisplayValue(`${prefix}${formatted}${suffix}`);
      return;
    }

    const obj = valueRef.current;
    const tween = gsap.to(obj, {
      val: target,
      duration,
      ease,
      onUpdate: () => {
        const num = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val);
        const formatted = Number(num).toLocaleString("id-ID", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        setDisplayValue(`${prefix}${formatted}${suffix}`);
      },
    });

    return () => {
      tween.kill();
    };
  }, [target, duration, decimals, prefix, suffix, ease]);

  return displayValue;
}

interface CountUpProps extends UseCountUpOptions {
  target: number;
  className?: string;
}

/**
 * Component wrapper for useCountUp for inline declarative usage.
 */
export function CountUp({ target, className, ...options }: CountUpProps) {
  const value = useCountUp(target, options);
  return <span className={className}>{value}</span>;
}
