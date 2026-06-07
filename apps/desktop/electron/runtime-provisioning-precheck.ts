import { existsSync } from "node:fs";
import { join } from "node:path";

export type DedicatedChromiumRuntimeCheckOptions = {
  platform?: string;
  localAppData?: string;
  exists?: (path: string) => boolean;
};

/** Returns a blockedReason string if the dedicated Chromium runtime is missing, undefined if present. */
export function checkDedicatedChromiumRuntime(options?: DedicatedChromiumRuntimeCheckOptions): string | undefined {
  const platform = options?.platform ?? process.platform;
  const localAppData = options?.localAppData ?? process.env.LOCALAPPDATA;
  const exists = options?.exists ?? existsSync;

  if (platform !== "win32") return undefined;
  if (!localAppData) return undefined;

  const chromeExePath = join(localAppData, "ServiceNowAutomation", "Runtime", "Chromium", "chrome.exe");
  if (!exists(chromeExePath)) {
    return "dedicated-browser-runtime-missing";
  }
  return undefined;
}
