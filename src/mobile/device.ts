/**
 * Which UI this tab runs, decided once at load (a session keeps it; no switching on resize): phones and narrow
 * windows get the mobile UI. `?ui=mobile` / `?ui=desktop` forces one (for testing).
 */
const forced = new URLSearchParams(window.location.search).get("ui");
export const IS_MOBILE = forced ? forced === "mobile" : window.matchMedia("(max-width: 820px)").matches;
