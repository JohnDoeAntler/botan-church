import { useId, type ElementType, type HTMLAttributes, type Ref } from "react";
import { useStageUnit } from "../layout/stageContext";
import { decayBleed, decayFilter, type DecayPreset, type DecayValue } from "./decayPresets";
import { DecayFilterDef } from "./DecayFilters";

export type DecayProps = HTMLAttributes<HTMLElement> & {
  /** A preset name, "none", or a one-off preset object (rendered as its own private filter). */
  level?: DecayValue | DecayPreset;
  /** Extra room around thin content so the wobble isn't clipped, design px. */
  bleed?: number;
  as?: ElementType;
  ref?: Ref<HTMLElement>;
};

/**
 * Wrap anything to give it a worn-print / pencil texture:
 *   <Decay level="pencil"><Logo /></Decay>
 *   <Decay level={{ ...DECAY_PRESETS.pencil, rough: 3 }}>…</Decay>
 */
export function Decay({ level = "soft", bleed, as: Tag = "div", style, children, ref, ...rest }: DecayProps) {
  const unit = useStageUnit();
  const id = `bc-decay-${useId().replace(/[^\w-]/g, "")}`;
  const custom = typeof level === "object";
  const filter = custom ? `url(#${id})` : decayFilter(level);
  const bleedStyle = bleed && filter ? decayBleed(bleed) : undefined;

  return (
    <Tag ref={ref} style={{ filter, ...bleedStyle, ...style }} {...rest}>
      {custom && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <DecayFilterDef id={id} preset={level} scale={unit} />
        </svg>
      )}
      {children}
    </Tag>
  );
}
