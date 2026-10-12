import { Barcode, BrandTitle, EnterButton, Flex, Rule, Stack, Text, VerticalText } from "../../components";
import { link } from "../../lib/base";
import { u } from "../../lib/units";
import titleSvg from "./art/botan-church.svg?raw";
import { COPY } from "./heroContent";

const tick = <Rule length={14} thickness={1.4} />;

/** The left column: tagline over the vertical line (top), the thank-you note (middle), the colophon (bottom). */
function LeftColumn() {
  return (
    <>
      <Flex x={58} y={70} ax="start" ay="start" z={6} dir="column" gap={13}>
        <div data-anim="text">
          <Text size={8.6} leading={17} lines={COPY.tagline} />
        </div>
        <div data-anim="rule">{tick}</div>
        <div data-anim="vtext" style={{ margin: `${u(10)} 0 0 ${u(-6)}` }}>
          <VerticalText lines={COPY.vertical} size={35} leading={58} tracking={0.08} />
        </div>
      </Flex>
      <Flex x={58} y={624} ax="start" z={6} dir="column" gap={19}>
        <div data-anim="rule">{tick}</div>
        <div data-anim="text">
          <Text variant="gothic" size={13.5} leading={24.5} lines={COPY.thanks} lang="ja" />
        </div>
      </Flex>
      <Flex x={58} y={766} ax="start" ay="end" z={6} dir="column" gap={19}>
        <div data-anim="rule">{tick}</div>
        <div data-anim="text">
          <Text size={8.6} leading={17} lines={COPY.smiles} />
        </div>
        <Stack dir="row" gap={27} style={{ marginTop: u(3) }}>
          <div data-anim="barcode">
            <Barcode width={52} height={46} />
          </div>
          <div data-anim="text">
            <Text size={8.2} leading={17.5} tracking={0.24} lines={COPY.colophon} />
          </div>
        </Stack>
      </Flex>
    </>
  );
}

/** The right column: "01" over its topics, and "本屋の娘、倉敷牡丹。" with its rule. */
function RightColumn() {
  return (
    <>
      <Flex x={1552} y={100} ax="end" ay="start" z={6} dir="column" gap={16}>
        <div data-anim="number">
          <Text variant="display" size={64} leading={64}>
            {COPY.number}
          </Text>
        </div>
        <div data-anim="rule" style={{ marginLeft: u(6) }}>
          <Rule length={48} thickness={1.2} />
        </div>
        <div data-anim="text" style={{ marginLeft: u(6) }}>
          <Text size={8.4} leading={17} tracking={0.2} lines={COPY.topics} />
        </div>
      </Flex>
      <Flex x={1461} y={368} z={6} align="end">
        <div data-anim="text">
          <Text variant="mincho" size={20} leading={31} weight={600} tracking={0.1} lines={COPY.here} lang="ja" />
        </div>
        <div data-anim="rule" style={{ marginBottom: u(6) }}>
          <Rule length={46} thickness={1.2} />
        </div>
      </Flex>
    </>
  );
}

/** The title (page star in its "O"), the subtitle and teal rule under it, then ENTER with its note. */
function TitleBlock() {
  return (
    <>
      <BrandTitle svg={titleSvg} label="BOTAN CHURCH" x={820} y={300} />
      <Flex x={873} y={592} z={6} dir="column">
        <div data-anim="text" style={{ marginLeft: u(1) }}>
          <Text size={17.5} tracking={0.44}>
            {COPY.subtitle}
          </Text>
        </div>
        <div data-anim="rule" data-sweep-base="teal" style={{ marginTop: u(16) }}>
          <Rule length={485} thickness={3.2} color="var(--c-teal)" />
        </div>
        <Stack dir="row" align="center" gap={30} style={{ margin: `${u(24)} 0 0 ${u(1)}` }}>
          <div data-anim="enter">
            <EnterButton href={link("/gospel")} width={242} height={66} />
          </div>
          <div data-anim="rule">
            <Rule length={38} thickness={1.6} vertical />
          </div>
          <div data-anim="text">
            <Text variant="gothic" size={13.5} leading={24} tracking={0.2} weight={400} lines={COPY.enterNote} lang="ja" />
          </div>
        </Stack>
      </Flex>
    </>
  );
}

/** All of the front page's copy, plus the sign-off in the bottom-right corner. */
export function HeroCopy() {
  return (
    <>
      <LeftColumn />
      <RightColumn />
      <TitleBlock />
      <Flex x={1502} y={887} ax="end" ay="end" z={6} align="center" gap={16} data-anim="text">
        {/* centred on the capitals, not the text box (which has room below the baseline) */}
        <div style={{ marginBottom: u(2) }}>{tick}</div>
        <Text size={8.2} tracking={0.24}>
          {COPY.site}
        </Text>
      </Flex>
    </>
  );
}
