"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { getReleaseSkyState, subscribeToReleaseSky, updateReleaseSky } from "../../lib/release-sky-store";
import { damp } from "../../lib/sky-math";
import type { SkyQuality } from "../../lib/sky-quality";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
/** How far the camera leans toward the pointer, in world units. Near stars shift most. */
const PARALLAX = { x: 0.45, y: 0.28 };
/** The slow wander used instead on touch screens. */
const AUTO_DRIFT = { x: 0.32, y: 0.2, speedX: 0.07, speedY: 0.05 };
const CAMERA_EASE_RATE = 1.8;
const MAX_FRAME_SECONDS = 0.1;
/** While the writer is typing, the sky draws every other frame to leave the main thread free. */
const TYPING_WINDOW_MS = 1200;

type Props = {
  quality: SkyQuality;
  isStill: boolean;
};

/**
 * Drives the sky: decides when to draw a frame, eases the camera for parallax, and reports when the
 * first frame is on screen.
 */
export default function SkyRig({ quality, isStill }: Props) {
  const invalidate = useThree((state) => state.invalidate);
  const pointerRef = useRef({ x: 0, y: 0, isFine: false });
  const hasReportedReadyRef = useRef(false);

  useEffect(() => {
    const pointer = pointerRef.current;
    pointer.isFine = window.matchMedia(FINE_POINTER_QUERY).matches;
    if (!pointer.isFine) return;

    const followPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", followPointer, { passive: true });
    return () => window.removeEventListener("pointermove", followPointer);
  }, []);

  useEffect(() => {
    // Still sky: draw once, then only when something in it changes. The canvas redraws itself on resize.
    if (isStill) {
      invalidate();
      return subscribeToReleaseSky(() => invalidate());
    }

    let frameId = 0;
    let tick = 0;
    let lastInputAt = Number.NEGATIVE_INFINITY;

    const noteInput = () => {
      lastInputAt = performance.now();
    };
    const drawFrame = () => {
      frameId = window.requestAnimationFrame(drawFrame);
      tick += 1;
      const isStarMoving = getReleaseSkyState().starPhase !== "hidden";
      const isTyping = performance.now() - lastInputAt < TYPING_WINDOW_MS;
      if (!isStarMoving && (quality.isLite || isTyping) && tick % 2 === 1) return;
      invalidate();
    };
    const start = () => {
      if (frameId === 0 && document.visibilityState === "visible") frameId = window.requestAnimationFrame(drawFrame);
    };
    const stop = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };
    // A hidden tab draws nothing at all.
    const followVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    document.addEventListener("visibilitychange", followVisibility);
    document.addEventListener("input", noteInput, true);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", followVisibility);
      document.removeEventListener("input", noteInput, true);
    };
  }, [invalidate, isStill, quality.isLite]);

  useEffect(() => () => updateReleaseSky({ isSceneReady: false }), []);

  useFrame((state, delta) => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      updateReleaseSky({ isSceneReady: true });
    }

    const { camera, clock } = state;
    if (isStill) {
      camera.position.set(0, 0, 0);
      return;
    }

    const pointer = pointerRef.current;
    const time = clock.elapsedTime;
    const targetX = pointer.isFine ? pointer.x * PARALLAX.x : Math.sin(time * AUTO_DRIFT.speedX) * AUTO_DRIFT.x;
    const targetY = pointer.isFine ? -pointer.y * PARALLAX.y : Math.cos(time * AUTO_DRIFT.speedY) * AUTO_DRIFT.y;
    const step = Math.min(delta, MAX_FRAME_SECONDS);
    camera.position.x = damp(camera.position.x, targetX, CAMERA_EASE_RATE, step);
    camera.position.y = damp(camera.position.y, targetY, CAMERA_EASE_RATE, step);
  }, -2);

  return null;
}
