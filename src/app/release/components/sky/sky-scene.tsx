"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

import { SKY_FOV_DEGREES } from "../../lib/sky-math";
import { readSkyQuality } from "../../lib/sky-quality";
import ReleaseStar from "./release-star";
import SkyRig from "./sky-rig";
import StarLayers from "./star-layers";

/** The WebGL night sky. Loaded lazily and only in the browser; see `ReleaseSky`. */
export default function SkyScene() {
  const [quality] = useState(readSkyQuality);
  const isStill = usePrefersReducedMotion() === true;

  return (
    <Canvas
      // SkyRig decides when frames are drawn.
      frameloop="demand"
      dpr={[1, quality.maxPixelRatio]}
      flat
      gl={{ antialias: false, alpha: true, depth: false, stencil: false, powerPreference: "low-power" }}
      camera={{ fov: SKY_FOV_DEGREES, near: 0.1, far: 200, position: [0, 0, 0], rotation: [0, 0, 0] }}
      // The canvas is fixed to the viewport, so scrolling never changes its size.
      resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
      style={{ position: "absolute", inset: 0 }}
    >
      <SkyRig quality={quality} isStill={isStill} />
      <StarLayers quality={quality} isStill={isStill} />
      <ReleaseStar isStill={isStill} />
    </Canvas>
  );
}
