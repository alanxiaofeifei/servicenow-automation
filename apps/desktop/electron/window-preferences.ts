import { resolveElectronPreloadPath, type PathExists } from "./preload-path";

export interface MainWindowWebPreferences {
  preload: string;
  contextIsolation: true;
  nodeIntegration: false;
  sandbox: false;
}

export function createMainWindowWebPreferences(
  mainDir: string,
  pathExists?: PathExists
): MainWindowWebPreferences {
  return {
    preload: resolveElectronPreloadPath(mainDir, pathExists),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  };
}
