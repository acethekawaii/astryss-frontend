"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { Vector3, type Mesh, type PlaneGeometry, type ShaderMaterial } from "three";

import { getReleaseSkyState, updateReleaseSky, type StarPhase } from "../../lib/release-sky-store";
import {
  SKY_DRIFT_SPEED,
  TAN_HALF_FOV,
  clamp01,
  driftedU,
  easeInCubic,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutQuart,
  lerp,
  skyToWorld,
  worldUnitsPerPixel,
  type SkyPoint,
} from "../../lib/sky-math";
import { createGlowMaterial } from "./sky-shaders";

const STAR_COLOR = "#facc00";
/** The hovering star sits this far in front of the camera, pinned under the countdown ring. */
const HOVER_DEPTH = 6;
const HOVER_SIZE_PX = 96;
const SETTLED_SIZE_PX = 26;
const SETTLED_INTENSITY = 1;
const SETTLE_DEPTH = 42;
const BOB_PX = 3;

/** Starts as the card is almost folded, so the star takes over from it. */
const FORM_DELAY_SECONDS = 0.3;
const FORM_SECONDS = 0.55;
const RISE_SECONDS = 2.6;
const RETURN_SECONDS = 0.45;

type Flight = {
  phase: StarPhase;
  startedAt: number;
  isComplete: boolean;
  hoverPosition: Vector3;
  hasHoverPosition: boolean;
  from: SkyPoint;
  fromSizePx: number;
  target: SkyPoint;
  sizePx: number;
};

type Look = { isVisible: boolean; sizePx: number; intensity: number };

const scratchDirection = new Vector3();
const scratchTuple: [number, number, number] = [0, 0, 0];

function createFlight(): Flight {
  return {
    phase: "hidden",
    startedAt: 0,
    isComplete: true,
    hoverPosition: new Vector3(),
    hasHoverPosition: false,
    from: { u: 0, v: 0, depth: HOVER_DEPTH },
    fromSizePx: HOVER_SIZE_PX,
    target: { u: 0, v: 0, depth: SETTLE_DEPTH },
    sizePx: 0,
  };
}

/** The world point under a viewport pixel, `depth` units in front of the camera. */
function viewportToWorld(x: number, y: number, depth: number, state: RootState, out: Vector3): Vector3 {
  const { camera, size } = state;
  scratchDirection.set((x / size.width) * 2 - 1, -((y / size.height) * 2 - 1), 0.5).unproject(camera);
  scratchDirection.sub(camera.position).normalize();
  return out.copy(camera.position).addScaledVector(scratchDirection, depth / -scratchDirection.z);
}

function worldToSky(position: Vector3, aspect: number): SkyPoint {
  const depth = -position.z;
  return { u: position.x / (depth * TAN_HALF_FOV * aspect), v: position.y / (depth * TAN_HALF_FOV), depth };
}

/** A sky point that will be at viewport pixel (x, y) now, and drift with the stars from then on. */
function viewportToSky(x: number, y: number, depth: number, state: RootState, time: number): SkyPoint {
  const aspect = state.size.width / state.size.height;
  const point = worldToSky(viewportToWorld(x, y, depth, state, new Vector3()), aspect);
  return { ...point, u: point.u - (time * SKY_DRIFT_SPEED * 10) / depth };
}

function readSettlePoint(state: RootState, time: number): SkyPoint {
  const settleAt = getReleaseSkyState().starSettleAt ?? { x: state.size.width / 2, y: state.size.height * 0.15 };
  return viewportToSky(settleAt.x, settleAt.y, SETTLE_DEPTH, state, time);
}

function anchorCenter(anchor: HTMLElement): { x: number; y: number } {
  const rect = anchor.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

type Props = { isStill: boolean };

/**
 * The star the card turns into. It hovers under the countdown ring, pulses while sending, then rises
 * and joins the sky as a settled star, or shrinks back into the card on Undo or a failed send.
 */
export default function ReleaseStar({ isStill }: Props) {
  const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  const flightRef = useRef<Flight | null>(null);
  const seenInstantSettlesRef = useRef(getReleaseSkyState().instantSettleCount);
  const material = useMemo(() => createGlowMaterial(STAR_COLOR), []);
  const [settledStars, setSettledStars] = useState<SkyPoint[]>([]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const flight = (flightRef.current ??= createFlight());
    const { starPhase, starAnchor, instantSettleCount } = getReleaseSkyState();
    const time = state.clock.elapsedTime;
    const skyTime = isStill ? 0 : time;

    // A release that skipped the flight still leaves its star in the sky.
    if (instantSettleCount !== seenInstantSettlesRef.current) {
      seenInstantSettlesRef.current = instantSettleCount;
      const point = readSettlePoint(state, skyTime);
      setSettledStars((stars) => [...stars, point]);
    }

    if (starPhase !== flight.phase) {
      const aspect = state.size.width / state.size.height;
      if (starPhase === "rising") {
        flight.from = worldToSky(mesh.position, aspect);
        flight.target = readSettlePoint(state, time);
      }
      flight.fromSizePx = flight.sizePx;
      flight.phase = starPhase;
      flight.startedAt = time;
      flight.isComplete = starPhase === "hidden";
      if (starPhase === "holding") {
        flight.hasHoverPosition = false;
        flight.sizePx = 0;
      }
    }

    const isHovering = flight.phase === "holding" || flight.phase === "sending";
    if (isHovering && starAnchor?.isConnected) {
      const { x, y } = anchorCenter(starAnchor);
      viewportToWorld(x, y, HOVER_DEPTH, state, flight.hoverPosition);
      flight.hasHoverPosition = true;
    }

    const look = describeFlight(flight, time, state, mesh.position);
    mesh.visible = look.isVisible;
    if (!look.isVisible) return;

    flight.sizePx = look.sizePx;
    mesh.scale.setScalar(look.sizePx * worldUnitsPerPixel(-mesh.position.z, state.size.height));
    mesh.material.uniforms.uIntensity.value = look.intensity;
    mesh.material.uniforms.uRotation.value = time * 0.3;

    if (flight.isComplete) {
      // The flight is over: hand the star to the settled set, and the sky back to idle.
      if (flight.phase === "rising") setSettledStars((stars) => [...stars, flight.target]);
      mesh.visible = false;
      updateReleaseSky({ starPhase: "hidden" });
    }
  });

  return (
    <>
      <mesh ref={meshRef} material={material} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {settledStars.map((point, index) => (
        <SettledStar key={index} point={point} isStill={isStill} />
      ))}
    </>
  );
}

/** Works out the star's look for this frame and writes its position into `position`. */
function describeFlight(flight: Flight, time: number, state: RootState, position: Vector3): Look {
  const elapsed = time - flight.startedAt;
  const hidden: Look = { isVisible: false, sizePx: 0, intensity: 0 };
  const bobPx = Math.sin(time * 1.6) * BOB_PX;

  switch (flight.phase) {
    case "holding": {
      const formElapsed = elapsed - FORM_DELAY_SECONDS;
      if (formElapsed < 0 || !flight.hasHoverPosition) return hidden;

      const form = clamp01(formElapsed / FORM_SECONDS);
      position.copy(flight.hoverPosition);
      position.y += bobPx * worldUnitsPerPixel(HOVER_DEPTH, state.size.height);
      return {
        isVisible: true,
        sizePx: HOVER_SIZE_PX * easeOutBack(form) * (1 + 0.04 * Math.sin(time * 2.4)),
        // A flash as the card's light gathers into the star, settling to a steady glow.
        intensity: 1 + 1.8 * (1 - form) ** 2,
      };
    }
    case "sending": {
      position.copy(flight.hoverPosition);
      position.y += bobPx * worldUnitsPerPixel(HOVER_DEPTH, state.size.height);
      return {
        isVisible: true,
        sizePx: HOVER_SIZE_PX * (1 + 0.06 * Math.sin(time * 5)),
        intensity: 1.25 + 0.35 * Math.sin(time * 6),
      };
    }
    case "rising": {
      const progress = clamp01(elapsed / RISE_SECONDS);
      const travel = easeOutQuart(progress);
      const target = flight.target;
      // Interpolated in sky coordinates so it climbs straight to its spot on screen while it
      // recedes, instead of swinging wide as the depth changes.
      const point: SkyPoint = {
        u: lerp(flight.from.u, driftedU(target, time), travel),
        v: lerp(flight.from.v, target.v, travel),
        depth: lerp(flight.from.depth, target.depth, easeInOutSine(progress)),
      };
      skyToWorld(point, 0, state.size.width / state.size.height, scratchTuple);
      position.set(...scratchTuple);
      flight.isComplete = progress >= 1;
      return {
        isVisible: true,
        sizePx: lerp(flight.fromSizePx, SETTLED_SIZE_PX, easeInOutCubic(progress)),
        intensity: lerp(1.5, SETTLED_INTENSITY, easeInOutCubic(progress)),
      };
    }
    case "returning": {
      if (!flight.hasHoverPosition) return hidden;

      const progress = clamp01(elapsed / RETURN_SECONDS);
      position.copy(flight.hoverPosition);
      flight.isComplete = progress >= 1;
      return {
        isVisible: true,
        sizePx: flight.fromSizePx * (1 - easeInCubic(progress)),
        intensity: 1 + progress,
      };
    }
    default:
      return hidden;
  }
}

type SettledStarProps = { point: SkyPoint; isStill: boolean };

/** A released star at rest: drifts with the far stars and breathes a little. */
function SettledStar({ point, isStill }: SettledStarProps) {
  const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
  const material = useMemo(() => createGlowMaterial(STAR_COLOR), []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = isStill ? 0 : state.clock.elapsedTime;
    skyToWorld(point, time, state.size.width / state.size.height, scratchTuple);
    mesh.position.set(...scratchTuple);
    const breath = isStill ? 1 : 1 + 0.12 * Math.sin(time * 1.3 + point.u * 10);
    mesh.scale.setScalar(SETTLED_SIZE_PX * breath * worldUnitsPerPixel(point.depth, state.size.height));
    mesh.material.uniforms.uIntensity.value = SETTLED_INTENSITY;
    mesh.material.uniforms.uRotation.value = time * 0.1;
  });

  return (
    <mesh ref={meshRef} material={material} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
