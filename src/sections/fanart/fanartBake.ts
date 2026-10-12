import { bakeBucket, spareWidth } from "../shared/bakeBucket";

export { spareWidth };

/** The fanart intro baked closest to the current width (its list grows into the spare width). */
export const fanartBake = (spare = spareWidth()) => bakeBucket("fanart", spare);
