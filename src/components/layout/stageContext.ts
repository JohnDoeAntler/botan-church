import { createContext, useContext } from "react";

/** CSS px per design px for the nearest Stage (1 outside a Stage). */
export const StageUnitContext = createContext(1);

export const useStageUnit = () => useContext(StageUnitContext);
