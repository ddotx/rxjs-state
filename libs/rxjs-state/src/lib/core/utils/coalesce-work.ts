import {getGlobalThis} from "./get-global-this";

export interface CoalescingContext {
  executionContextId: number | undefined;
}

export interface CoalesceConfig {
  context?: CoalescingContext;
  executionContextRef?: (cb: () => void) => number;
  leading?: boolean;
  trailing?: boolean;
}

export function getCoalesceWorkConfig(
  cfg: CoalesceConfig = {
    context: getGlobalThis(),
    // executionContextRef: getGlobalThis().requestAnimationFrame.bind(getGlobalThis()),
    leading: false,
    trailing: true
  }
): CoalesceConfig {
  return {
    context: getGlobalThis(),
    // executionContextRef: getGlobalThis().requestAnimationFrame.bind(getGlobalThis()),
    ...cfg,
  };
}
