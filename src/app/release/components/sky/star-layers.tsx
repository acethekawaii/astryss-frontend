"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, type Points, type ShaderMaterial } from "three";

import { MOOD_ATMOSPHERES } from "../../constants/mood-atmospheres";
import { getReleaseSkyState } from "../../lib/release-sky-store";
import { SKY_OVERSCAN, createRandom, damp, lerp } from "../../lib/sky-math";
import type { SkyQuality, StarLayerName } from "../../lib/sky-quality";
import { createStarFieldMaterial } from "./sky-shaders";

type Range = [number, number];

type LayerSpec = {
  name: StarLayerName;
  seed: number;
  depth: Range;
  /** Pixel size at depth 10; the shader scales it by actual depth. */
  size: Range;
  brightness: Range;
  twinkle: number;
};

/** Three distances: a fine far field, a mid field, and a few large near stars that drift fastest. */
const LAYERS: LayerSpec[] = [
  { name: "far", seed: 11, depth: [45, 110], size: [5, 8], brightness: [0.45, 0.9], twinkle: 0.15 },
  { name: "mid", seed: 23, depth: [16, 45], size: [3, 4.6], brightness: [0.6, 1], twinkle: 0.3 },
  { name: "near", seed: 37, depth: [7, 16], size: [2.2, 3.4], brightness: [0.8, 1], twinkle: 0.45 },
];

// Mostly warm white, with some blue-white and pale gold. Repeats weight the pick.
const STAR_COLORS = ["#fff4dc", "#fff4dc", "#fff4dc", "#d8e4ff", "#ffe6ad"].map((hex) => new Color(hex));
const BRIGHT_STAR_CHANCE = 0.05;
const BRIGHT_STAR_SIZE = 2.2;
/** Slightly taller than the screen, for vertical parallax. */
const VERTICAL_SPREAD = 1.08;
/** How far the stars lean toward the mood's colour, and how quickly they get there. */
const MOOD_TINT_MIX = 0.35;
const MOOD_TINT_RATE = 1.6;
const MAX_FRAME_SECONDS = 0.1;

function pick(random: () => number, [min, max]: Range): number {
  return lerp(min, max, random());
}

function buildLayerGeometry(spec: LayerSpec, count: number): BufferGeometry {
  const random = createRandom(spec.seed);
  const positions = new Float32Array(count * 3);
  const looks = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const isBright = random() < BRIGHT_STAR_CHANCE;
    positions.set([(random() * 2 - 1) * SKY_OVERSCAN, (random() * 2 - 1) * VERTICAL_SPREAD, pick(random, spec.depth)], index * 3);
    looks.set(
      [
        pick(random, spec.size) * (isBright ? BRIGHT_STAR_SIZE : 1),
        isBright ? 1 : pick(random, spec.brightness),
        random() * Math.PI * 2,
        0.6 + random() * 1.8,
      ],
      index * 4,
    );
    STAR_COLORS[Math.floor(random() * STAR_COLORS.length)].toArray(colors, index * 3);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aLook", new BufferAttribute(looks, 4));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
  return geometry;
}

type Tint = { color: Color; target: Color; mix: number };

type Props = {
  quality: SkyQuality;
  isStill: boolean;
};

export default function StarLayers({ quality, isStill }: Props) {
  const tintRef = useRef<Tint>({ color: new Color("#ffffff"), target: new Color("#ffffff"), mix: 0 });

  // Eases the stars toward the picked mood's colour; one shared tint for every layer.
  useFrame((_, delta) => {
    const tint = tintRef.current;
    const { emotion } = getReleaseSkyState();
    const step = isStill ? 1 : 1 - Math.exp(-MOOD_TINT_RATE * Math.min(delta, MAX_FRAME_SECONDS));

    if (emotion) tint.target.set(MOOD_ATMOSPHERES[emotion].starTint);
    tint.color.lerp(tint.target, step);
    tint.mix = isStill ? (emotion ? MOOD_TINT_MIX : 0) : damp(tint.mix, emotion ? MOOD_TINT_MIX : 0, MOOD_TINT_RATE, delta);
  }, -1);

  return (
    <>
      {LAYERS.map((spec) => (
        <StarLayer key={spec.name} spec={spec} count={quality.starCounts[spec.name]} isStill={isStill} tintRef={tintRef} />
      ))}
    </>
  );
}

type StarLayerProps = {
  spec: LayerSpec;
  count: number;
  isStill: boolean;
  tintRef: RefObject<Tint>;
};

function StarLayer({ spec, count, isStill, tintRef }: StarLayerProps) {
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
  const geometry = useMemo(() => buildLayerGeometry(spec, count), [spec, count]);
  const material = useMemo(() => createStarFieldMaterial(spec.twinkle), [spec.twinkle]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const { uniforms } = points.material;
    const tint = tintRef.current;
    uniforms.uTime.value = isStill ? 0 : state.clock.elapsedTime;
    uniforms.uTwinkle.value = isStill ? 0 : spec.twinkle;
    uniforms.uAspect.value = state.size.width / Math.max(state.size.height, 1);
    uniforms.uPixelRatio.value = state.viewport.dpr;
    uniforms.uTint.value.copy(tint.color);
    uniforms.uTintMix.value = tint.mix;
  });

  // Positions are placed in the shader, so the bounding sphere means nothing: never cull.
  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
