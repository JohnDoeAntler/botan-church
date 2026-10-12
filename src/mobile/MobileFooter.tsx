import { Barcode, Flex, Rule, Sparkle, Stack, Text } from "../components";
import { WAIST } from "./mobileKit";
import styles from "./mobile.module.css";

/**
 * The footer row of the paged mobile pages (Gospel, Volumes): colophon, "five volumes — read them and you'll see" between two rules,
 * the page's boxed label, a star. Anchored to the bottom of the screen.
 */
export function MobileFooter({ label, labelWidth, y = 1520 }: { label: string[]; labelWidth: number; y?: number }) {
  return (
    <Flex x={100} y={y} ay="end" z={6} align="center" gap={30}>
      <Stack gap={6}>
        <div data-anim="barcode">
          <Barcode width={150} height={50} />
        </div>
        <div data-anim="text">
          <Text variant="mono" size={13} leading={20} tracking={0.18} lines={["BOTAN.CHURCH", "EST.2024"]} />
        </div>
      </Stack>
      <div data-anim="rule">
        <Rule length={86} thickness={1.2} vertical />
      </div>
      <div data-anim="text">
        <Text variant="mincho" size={18} leading={30} weight={500} lines={["全五巻。", "読めばわかる。"]} lang="ja" />
      </div>
      <div data-anim="rule">
        <Rule length={86} thickness={1.2} vertical />
      </div>
      <div data-anim="shape" className={styles.tag} style={{ width: `calc(${labelWidth} * var(--u))`, height: "calc(52 * var(--u))" }}>
        <Text size={9.5} leading={15} tracking={0.2} lines={label} />
      </div>
      <div data-anim="sparkle">
        <Sparkle size={42} waist={WAIST} color="var(--c-ink)" />
      </div>
    </Flex>
  );
}
