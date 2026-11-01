/** SVG path for a four-point sparkle centred on 0,0 — the star used across the release composer. */
export function sparklePath(radius: number): string {
  const waist = Math.round(radius * 22) / 100;

  return [
    `M0 ${-radius}`,
    `Q${waist} ${-waist} ${radius} 0`,
    `Q${waist} ${waist} 0 ${radius}`,
    `Q${-waist} ${waist} ${-radius} 0`,
    `Q${-waist} ${-waist} 0 ${-radius}`,
    "Z",
  ].join(" ");
}
