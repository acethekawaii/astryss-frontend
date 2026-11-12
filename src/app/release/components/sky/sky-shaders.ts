import { AdditiveBlending, Color, ShaderMaterial } from "three";

import { SKY_DRIFT_SPEED, SKY_OVERSCAN, TAN_HALF_FOV } from "../../lib/sky-math";

// Colours are given as sRGB hex; three.js keeps them linear, and `colorspace_fragment` converts the
// output back, so the brand yellow on screen is the brand yellow.

const glslFloat = (value: number) => value.toFixed(6);

/**
 * Background stars. `position` holds sky coordinates (u, v, depth); the shader drifts them sideways
 * (nearer stars faster), places them for the current aspect ratio, and twinkles them.
 */
const STAR_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform float uPixelRatio;
  uniform float uTwinkle;
  uniform vec3 uTint;
  uniform float uTintMix;

  // x: size in pixels at depth 10, y: brightness, z: twinkle phase, w: twinkle speed
  attribute vec4 aLook;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  const float OVERSCAN = ${glslFloat(SKY_OVERSCAN)};
  const float DRIFT = ${glslFloat(SKY_DRIFT_SPEED * 10)};
  const float TAN_HALF_FOV = ${glslFloat(TAN_HALF_FOV)};

  void main() {
    float depth = position.z;
    float u = mod(position.x + uTime * DRIFT / depth + OVERSCAN, 2.0 * OVERSCAN) - OVERSCAN;
    vec3 world = vec3(u * depth * TAN_HALF_FOV * uAspect, position.y * depth * TAN_HALF_FOV, -depth);
    vec4 viewPosition = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float size = aLook.x * 10.0 / -viewPosition.z * uPixelRatio;
    gl_PointSize = max(size, 1.0);

    // Sub-pixel stars are drawn one pixel wide but dimmer, which keeps the far field fine-grained.
    float coverage = clamp(size, 0.0, 1.0);
    float twinkle = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * aLook.w + aLook.z));
    float edgeFade = 1.0 - smoothstep(1.12, OVERSCAN, abs(u));
    vAlpha = aLook.y * coverage * twinkle * edgeFade;
    vColor = mix(aColor, uTint, uTintMix);
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - 0.5) * 2.0;
    float falloff = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
    float alpha = vAlpha * falloff * falloff;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;

export function createStarFieldMaterial(twinkle: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uPixelRatio: { value: 1 },
      uTwinkle: { value: twinkle },
      uTint: { value: new Color("#ffffff") },
      uTintMix: { value: 0 },
    },
    vertexShader: STAR_VERTEX_SHADER,
    fragmentShader: STAR_FRAGMENT_SHADER,
    blending: AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

/** A camera-facing quad. */
const GLOW_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The released star: a white-hot core in the brand yellow, a soft halo, and the four long points of
 * the site's sparkle, with faint diagonal glints between them.
 */
const GLOW_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uRotation;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float c = cos(uRotation);
    float s = sin(uRotation);
    vec2 q = mat2(c, -s, s, c) * p;

    float core = exp(-radius * radius * 90.0);
    float halo = exp(-radius * 5.0) * 0.5;
    float reach = 1.0 - smoothstep(0.0, 1.0, radius);
    float points = (exp(-abs(q.x) * 34.0) + exp(-abs(q.y) * 34.0)) * reach * reach * 0.85;
    vec2 d = vec2(q.x + q.y, q.x - q.y) * 0.7071;
    float glints = (exp(-abs(d.x) * 60.0) + exp(-abs(d.y) * 60.0)) * (1.0 - smoothstep(0.0, 0.5, radius)) * 0.3;

    float light = (core * 1.4 + halo + points + glints) * uIntensity;
    float edge = 1.0 - smoothstep(0.9, 1.0, radius);
    vec3 color = mix(uColor, vec3(1.0), clamp(core * 1.5, 0.0, 1.0));
    gl_FragColor = vec4(color, clamp(light * edge, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

export function createGlowMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: 1 },
      uRotation: { value: 0 },
    },
    vertexShader: GLOW_VERTEX_SHADER,
    fragmentShader: GLOW_FRAGMENT_SHADER,
    blending: AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}
