import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { cx } from "../../lib/units";
import { StageUnitContext } from "./stageContext";
import styles from "./Stage.module.css";

export type StageProps = HTMLAttributes<HTMLDivElement> & {
  /** Design canvas size in px. Children are positioned in this coordinate space. */
  width: number;
  height: number;
  /**
   * fill: canvas covers the whole viewport; the design scales to fit and any spare room is exposed
   *       as --ox / --oy so Place can anchor content to the real edges (no letterboxing).
   * width: canvas spans full width at the design aspect ratio (for stacked sections).
   */
  fit?: "fill" | "width";
  ref?: Ref<HTMLDivElement>;
};

export function Stage({
  width,
  height,
  fit = "fill",
  className,
  style,
  children,
  ref,
  ...rest
}: StageProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState(1);

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      setUnit(fit === "fill" ? Math.min(w / width, h / height) : w / width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit, width, height]);

  const setRefs = (node: HTMLDivElement | null) => {
    canvasRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const vars =
    fit === "fill"
      ? {
          "--u": `min(calc(100cqw / ${width}), calc(100cqh / ${height}))`,
          "--ox": `calc(100cqw - ${width} * var(--u))`,
          "--oy": `calc(100cqh - ${height} * var(--u))`,
        }
      : { "--u": `calc(100cqw / ${width})`, aspectRatio: `${width} / ${height}` };

  return (
    <div className={cx(styles.viewport, styles[fit])}>
      <div ref={setRefs} className={cx(styles.canvas, className)} style={{ ...vars, ...style } as CSSProperties} {...rest}>
        <StageUnitContext.Provider value={unit}>{children}</StageUnitContext.Provider>
      </div>
    </div>
  );
}
