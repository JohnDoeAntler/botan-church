import { Flex, Rule, Sparkle, Text, VerticalText } from "../../components";
import { u } from "../../lib/units";
import { COPY } from "./aboutContent";
import { CENTRE, WAIST } from "./aboutLayout";

const smallCaps = { size: 8.5, tracking: 0.3 } as const;

/** The small captions in the corners and margins, each a stack anchored to its corner. */
export function AboutMargins() {
  return (
    <>
      {/* top: the brand's star and tagline, the star over the centre line */}
      <Flex x={216} y={31} ax="start" ay="start" z={6} align="center" gap={12}>
        <div data-anim="sparkle">
          <Sparkle size={22} waist={WAIST} color="var(--c-ink)" />
        </div>
        <div data-anim="text">
          <Text {...smallCaps} leading={14} lines={COPY.tagline} />
        </div>
      </Flex>
      <Flex x={CENTRE - 14} y={30} w={28} z={6} dir="column" align="center" gap={6}>
        <div data-anim="sparkle">
          <Sparkle size={28} waist={WAIST} color="var(--c-ink)" />
        </div>
        <div data-anim="rule">
          <Rule length={26} thickness={1} vertical />
        </div>
      </Flex>

      {/* left: top and bottom captions */}
      <Flex x={58} y={103} ax="start" ay="start" z={6} dir="column" gap={15}>
        <div data-anim="text">
          <Text {...smallCaps} leading={17.5} lines={COPY.smiles} />
        </div>
        <div data-anim="rule">
          <Rule length={16} thickness={1.2} />
        </div>
      </Flex>
      <Flex x={58} y={799} ax="start" ay="end" z={6} dir="column" gap={21}>
        <div data-anim="rule">
          <Rule length={16} thickness={1.2} />
        </div>
        <div data-anim="text">
          <Text {...smallCaps} leading={17.5} lines={COPY.est} />
        </div>
        <div data-anim="rule" style={{ marginTop: u(-7) }}>
          <Rule length={16} thickness={1.2} />
        </div>
      </Flex>

      {/* right: the vertical line, and the fan-site caption low down */}
      <Flex x={1548} y={172} ax="end" ay="start" z={6} dir="column" gap={20}>
        <div data-anim="vtext">
          <VerticalText lines={COPY.vertical} size={18} leading={34} weight={500} />
        </div>
        <div data-anim="rule" style={{ marginLeft: u(7) }}>
          <Rule length={16} thickness={1.2} />
        </div>
      </Flex>
      <Flex x={1518} y={645} w={14} ax="end" ay="start" z={6} dir="column" align="center" gap={15}>
        <div data-anim="rule">
          <Rule length={60} thickness={1} vertical />
        </div>
        <div data-anim="sparkle">
          <Sparkle size={14} waist={WAIST} color="var(--c-ink)" />
        </div>
      </Flex>
      <Flex x={1524} y={758} ax="end" ay="end" z={6} dir="column" gap={17}>
        <div data-anim="text">
          <Text {...smallCaps} leading={19} tracking={0.32} lines={COPY.fanSite} />
        </div>
        <div data-anim="rule" style={{ marginLeft: u(6) }}>
          <Rule length={16} thickness={1.2} />
        </div>
      </Flex>
    </>
  );
}
