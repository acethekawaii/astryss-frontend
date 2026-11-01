"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnimate } from "motion/react";

import { ORBIT_RADIUS, type LaunchPlan } from "../lib/release-launch";
import { sparklePath } from "../lib/sparkle-path";

const STAR_SIZE = 28;
const STAR_PATH = sparklePath(14);

type Props = {
  plan: LaunchPlan;
  onComplete: () => void;
};

/**
 * The release moment: a copy of the message shrinks and rises into a small star, which circles
 * once and fades. Drawn above the page (not inside the card) so nothing clips the flight.
 */
export default function ReleaseLaunch({ plan, onComplete }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    let isCurrent = true;
    const flight = animate([
      [
        "[data-launch-message]",
        { x: [0, plan.driftX], y: [0, -plan.rise], scale: [1, 0.04] },
        { duration: 0.85, ease: [0.5, 0, 0.15, 1], at: 0 },
      ],
      ["[data-launch-message]", { opacity: [1, 0] }, { duration: 0.3, ease: "easeIn", at: 0.55 }],
      [
        "[data-launch-star]",
        { opacity: [0, 1], scale: [0.2, 1.2, 1], rotate: [-90, 0] },
        { duration: 0.45, ease: "easeOut", at: 0.62 },
      ],
      ["[data-launch-orbit]", { rotate: [0, 360] }, { duration: 1.3, ease: [0.45, 0, 0.55, 1], at: 0.95 }],
      ["[data-launch-star]", { opacity: [1, 0], scale: [1, 0.3] }, { duration: 0.45, ease: "easeIn", at: 2 }],
    ]);

    flight.then(() => {
      if (isCurrent) onComplete();
    });

    return () => {
      isCurrent = false;
      flight.stop();
    };
  }, [animate, onComplete, plan]);

  return createPortal(
    <div ref={scope} aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        data-launch-message
        className="absolute overflow-hidden"
        style={{ left: plan.box.left, top: plan.box.top, width: plan.box.width, height: plan.box.height }}
      >
        <p
          className="whitespace-pre-wrap break-words px-6 py-5 font-base text-base leading-relaxed text-foreground"
          style={{ marginTop: -plan.scrollTop }}
        >
          {plan.message}
        </p>
      </div>

      <div data-launch-orbit className="absolute size-0" style={{ left: plan.orbitCenter.x, top: plan.orbitCenter.y }}>
        <div
          data-launch-star
          className="absolute opacity-0"
          style={{ left: -STAR_SIZE / 2, top: ORBIT_RADIUS - STAR_SIZE / 2, width: STAR_SIZE, height: STAR_SIZE }}
        >
          <svg viewBox="-16 -16 32 32" className="size-full overflow-visible">
            <path d={STAR_PATH} className="fill-main stroke-foreground" strokeWidth={2.5} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>,
    document.body,
  );
}
