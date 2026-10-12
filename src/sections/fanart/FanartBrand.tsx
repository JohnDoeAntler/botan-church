import { Barcode, BrandTitle, Flex, Rule, Sparkle, Text } from "../../components";
import { u } from "../../lib/units";
import titleSvg from "../hero/art/botan-church.svg?raw";
import { COPY } from "./fanartContent";

/**
 * The brand column on the left: tagline, the BOTAN CHURCH title (smaller than on the front page, page star in its
 * "O"), the archive's copy, and the colophon at the bottom.
 */
export function FanartBrand() {
  return (
    <>
      <Flex x={237} y={28} ax="start" ay="start" z={6} align="center" gap={15}>
        <div data-anim="text">
          <Text size={8.4} leading={14} lines={COPY.tagline} />
        </div>
        <div data-anim="sparkle">
          <Sparkle size={28} waist={3} color="var(--c-ink)" />
        </div>
      </Flex>

      <BrandTitle svg={titleSvg} label="BOTAN CHURCH" x={34} y={168} ax="start" scale={0.46} starScale={0.5} />

      <Flex x={42} y={334} ax="start" z={6} dir="column">
        <div data-anim="text">
          <Text size={15} tracking={0.5}>
            {COPY.archive}
          </Text>
        </div>
        <div data-anim="text" style={{ margin: `${u(38)} 0 0 ${u(2)}` }}>
          <Text variant="mincho" size={22} leading={36} lines={COPY.lead} lang="ja" />
        </div>
        <div data-anim="rule" style={{ margin: `${u(20)} 0 0 ${u(3)}` }}>
          <Rule length={18} thickness={1.4} />
        </div>
        <div data-anim="text" style={{ margin: `${u(21)} 0 0 ${u(3)}` }}>
          <Text size={9} leading={18} tracking={0.26} lines={COPY.span} />
        </div>
        <div data-anim="text" style={{ margin: `${u(23)} 0 0 ${u(3)}` }}>
          <Text variant="gothic" size={12.5} leading={23} lines={COPY.thanks} lang="ja" />
        </div>
      </Flex>

      <Flex x={45} y={810} ax="start" ay="end" z={6} dir="column" gap={16}>
        <div data-anim="barcode">
          <Barcode width={90} height={24} bars={44} />
        </div>
        <div data-anim="text">
          <Text size={8.2} leading={14} tracking={0.26} lines={COPY.colophon} />
        </div>
      </Flex>
    </>
  );
}
