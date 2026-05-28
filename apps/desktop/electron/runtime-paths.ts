import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type DesktopRuntimePaths = {
  projectRoot: string;
  resourceRoot: string;
};

export type ResolveDesktopRuntimePathsOptions = {
  cwd?: string;
  mainDir: string;
  isPackaged: boolean;
  resourcesPath?: string;
  exists?: (path: string) => boolean;
};

export function resolveDesktopRuntimePaths(options: ResolveDesktopRuntimePathsOptions): DesktopRuntimePaths {
  if (options.isPackaged) {
    const resourceRoot = options.resourcesPath ?? options.cwd ?? options.mainDir;
    return {
      projectRoot: resourceRoot,
      resourceRoot
    };
  }

  const projectRoot = findNearestWorkspaceRoot({
    cwd: options.cwd ?? process.cwd(),
    mainDir: options.mainDir,
    exists: options.exists ?? existsSync
  });

  return {
    projectRoot,
    resourceRoot: projectRoot
  };
}

export function resolveDesktopResourcePath(relativePath: string, paths: DesktopRuntimePaths): string {
  return join(paths.resourceRoot, relativePath);
}

function findNearestWorkspaceRoot(input: { cwd: string; mainDir: string; exists: (path: string) => boolean }): string {
  const candidates = [input.cwd, join(input.mainDir, "../../../.."), join(input.mainDir, "../../..")];
  for (const candidate of candidates) {
    let current = candidate;
    for (let depth = 0; depth < 6; depth += 1) {
      if (input.exists(join(current, "pnpm-workspace.yaml"))) {
        return current;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  return input.cwd;
}
