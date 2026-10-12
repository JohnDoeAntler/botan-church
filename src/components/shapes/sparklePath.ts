/**
 * Path of a four-point concave star (✦) in a 100×100 box. `waist` = how far the curved sides stay from the
 * centre: 0 = needle thin, 14 = classic, 30 = chubby. Shared by <Sparkle> and anything that morphs a star.
 */
export function sparklePath(waist: number) {
  const a = 50 - waist;
  const b = 50 + waist;
  return `M50 0C${b} ${a} ${b} ${a} 100 50C${b} ${b} ${b} ${b} 50 100C${a} ${b} ${a} ${b} 0 50C${a} ${a} ${a} ${a} 50 0Z`;
}
