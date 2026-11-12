"use client";

import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";

import { EMOTIONS } from "@/shared/constants/emotions";
import { cn } from "@/lib/utils";

import { MOOD_ATMOSPHERES } from "../../constants/mood-atmospheres";
import { getReleaseSkyState, getServerReleaseSkyState, subscribeToReleaseSky } from "../../lib/release-sky-store";

const SkyScene = dynamic(() => import("./sky-scene"), { ssr: false });

const MOOD_FADE_SECONDS = 1.4;
/** The scene waits until the writer has paused this long, so loading it never interrupts typing. */
const TYPING_QUIET_MS = 1200;
const IDLE_TIMEOUT_MS = 2500;

const readEmotion = () => getReleaseSkyState().emotion;
const readEmotionOnServer = () => getServerReleaseSkyState().emotion;
const readIsSceneReady = () => getReleaseSkyState().isSceneReady;
const readIsSceneReadyOnServer = () => false;

/**
 * The night sky behind the page. The gradient and mood washes are plain CSS and show immediately;
 * the WebGL stars load afterwards and fade in once their first frame is drawn. If WebGL fails, the
 * CSS sky simply stays.
 */
export default function ReleaseSky() {
  const emotion = useSyncExternalStore(subscribeToReleaseSky, readEmotion, readEmotionOnServer);
  const isSceneReady = useSyncExternalStore(subscribeToReleaseSky, readIsSceneReady, readIsSceneReadyOnServer);
  const shouldLoadScene = useDeferredSceneLoad();

  return (
    <div aria-hidden className="release-sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {EMOTIONS.map((mood) => (
        <motion.div
          key={mood}
          className="absolute inset-0"
          style={{ background: MOOD_ATMOSPHERES[mood].skyBackground }}
          initial={false}
          animate={{ opacity: emotion === mood ? 1 : 0 }}
          transition={{ duration: MOOD_FADE_SECONDS, ease: "easeInOut" }}
        />
      ))}

      {shouldLoadScene && (
        <SceneErrorBoundary>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-[1600ms] ease-out",
              isSceneReady ? "opacity-100" : "opacity-0",
            )}
          >
            <SkyScene />
          </div>
        </SceneErrorBoundary>
      )}
    </div>
  );
}

/**
 * True once the page has loaded, the browser is idle, and the writer hasn't typed for a moment.
 * Fetching and starting three.js is the heaviest thing on this page; it must never cost a keystroke.
 */
function useDeferredSceneLoad(): boolean {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    let lastInputAt = Number.NEGATIVE_INFINITY;
    let timeoutId = 0;
    let idleId = 0;

    const noteInput = () => {
      lastInputAt = performance.now();
    };
    const loadWhenQuiet = () => {
      const quietFor = performance.now() - lastInputAt;
      if (quietFor < TYPING_QUIET_MS) {
        timeoutId = window.setTimeout(waitForIdle, TYPING_QUIET_MS - quietFor);
        return;
      }
      setShouldLoad(true);
    };
    const waitForIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(loadWhenQuiet, { timeout: IDLE_TIMEOUT_MS });
      } else {
        timeoutId = window.setTimeout(loadWhenQuiet, 0);
      }
    };

    document.addEventListener("input", noteInput, true);
    document.addEventListener("keydown", noteInput, true);
    if (document.readyState === "complete") waitForIdle();
    else window.addEventListener("load", waitForIdle, { once: true });

    return () => {
      document.removeEventListener("input", noteInput, true);
      document.removeEventListener("keydown", noteInput, true);
      window.removeEventListener("load", waitForIdle);
      window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    };
  }, []);

  return shouldLoad;
}

/** Without WebGL (or if the scene crashes) the page keeps its CSS sky. */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { hasFailed: boolean }> {
  state = { hasFailed: false };

  static getDerivedStateFromError() {
    return { hasFailed: true };
  }

  render() {
    return this.state.hasFailed ? null : this.props.children;
  }
}
