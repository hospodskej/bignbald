export type Pt = [number, number];

/** Closed Catmull-Rom spline through the points -> smooth SVG path (organic shapes from rough outlines). */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

export const toPts = (flat: number[], mirrorWidth?: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push([mirrorWidth ? mirrorWidth - flat[i] : flat[i], flat[i + 1]]);
  return out;
};

const rad = (deg: number) => (deg * Math.PI) / 180;
/** Direction for an angle where 0° points down, 90° forward (+x), 180° up. */
export const dir = (deg: number): Pt => [Math.sin(rad(deg)), Math.cos(rad(deg))];
export const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const rotate = (p: Pt, deg: number): Pt => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};

/** A limb: capsule that tapers from radius r1 at a to r2 at b. */
export function limb(a: Pt, b: Pt, r1: number, r2: number): string {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const f = (v: number) => v.toFixed(1);
  const p1 = [a[0] + nx * r1, a[1] + ny * r1], p2 = [b[0] + nx * r2, b[1] + ny * r2];
  const p3 = [b[0] - nx * r2, b[1] - ny * r2], p4 = [a[0] - nx * r1, a[1] - ny * r1];
  return `M${f(p1[0])},${f(p1[1])} L${f(p2[0])},${f(p2[1])} A${r2},${r2} 0 0 1 ${f(p3[0])},${f(p3[1])} L${f(p4[0])},${f(p4[1])} A${r1},${r1} 0 0 1 ${f(p1[0])},${f(p1[1])}Z`;
}
