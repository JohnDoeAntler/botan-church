import { TINTS, tintFilterId } from "./tints";

/**
 * Filters that repaint anything as a flat silhouette of one colour (alpha kept, colour replaced).
 * Used by the sweep reveal to turn element clones into solid teal / ink copies.
 */
export function TintFilters({ colors = TINTS }: { colors?: Record<string, string> }) {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {Object.entries(colors).map(([name, color]) => (
          <filter key={name} id={tintFilterId(name)} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feFlood style={{ floodColor: color }} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
