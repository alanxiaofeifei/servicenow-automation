import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
} from "node:fs";
import { basename, join } from "node:path";
import { shell } from "electron";

/**
 * Handler for sda:worktree-git-diff.
 * Runs `git diff --stat HEAD` in projectRoot and sanitizes home directory
 * from the output. No user-supplied arguments are passed to execFileSync.
 */
export function handleWorktreeGitDiff(
  projectRoot: string,
  homeDir?: string
): { ok: boolean; result?: string; error?: string } {
  try {
    const output = execFileSync("git", ["diff", "--stat", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf-8",
      maxBuffer: 1024 * 100, // 100 KB
    });

    let sanitized = output;
    if (homeDir && sanitized.includes(homeDir)) {
      sanitized = sanitized.replace(new RegExp(homeDir.replace(/[/\\]/g, "\\$&"), "g"), "~");
    }

    return { ok: true, result: sanitized };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Handler for sda:worktree-open-dist-release.
 * Opens the dist/release directory in the host file manager.
 * Path is constructed from projectRoot — no user-supplied path.
 */
export async function handleWorktreeOpenDistRelease(
  projectRoot: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const distReleasePath = join(projectRoot, "dist", "release");
    const error = await shell.openPath(distReleasePath);
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Handler for sda:worktree-open-file.
 * Opens a file relative to projectRoot using the OS default handler.
 * The relativePath is not user-supplied — it is hardcoded in the renderer.
 */
export async function handleWorktreeOpenFile(
  projectRoot: string,
  relativePath: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const fullPath = join(projectRoot, relativePath);
    const error = await shell.openPath(fullPath);
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Handler for sda:worktree-open-workspace-root.
 * Opens the project root (workspace) directory in the host file manager.
 * Path is constructed from projectRoot — no user-supplied path.
 */
export async function handleWorktreeOpenWorkspaceRoot(
  projectRoot: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const error = await shell.openPath(projectRoot);
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Handler for sda:worktree-status.
 * Runs `git status --porcelain` in projectRoot to determine if the
 * worktree has uncommitted changes. No user-supplied arguments.
 */
export function handleWorktreeStatus(
  projectRoot: string
): { ok: boolean; dirty: boolean; result?: string } {
  try {
    const output = execFileSync("git", ["status", "--porcelain"], {
      cwd: projectRoot,
      encoding: "utf-8",
      maxBuffer: 1024 * 100, // 100 KB
    });

    return { ok: true, dirty: output.trim().length > 0, result: output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, dirty: false, result: message };
  }
}

/**
 * Read CURRENT.txt from dist/release/ and parse the referenced filename.
 * Returns the filename (basename ending in .zip) or null if not found.
 * Rejects path traversal or non-.zip suffixes.
 */
function readCurrentTxt(distReleaseDir: string): string | null {
  const currentTxtPath = join(distReleaseDir, "CURRENT.txt");
  if (!existsSync(currentTxtPath)) return null;

  try {
    const content = String(readFileSync(currentTxtPath, "utf-8")).trim();
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("CURRENT=")) {
        const filename = trimmed.slice("CURRENT=".length).trim();
        // Reject path traversal or separators in filename
        if (
          filename.includes("/") ||
          filename.includes("\\") ||
          filename.includes("..") ||
          !filename.endsWith(".zip")
        ) {
          return null;
        }
        return filename;
      }
    }
  } catch {
    // Silent — read failures are handled as "no CURRENT.txt"
  }
  return null;
}

/**
 * Try to read and parse a release-metadata.json sidecar at the given path.
 * Returns parsed data on success, null on any failure (missing, malformed JSON,
 * missing required fields).
 */
function readReleaseMetadataSidecar(
  sidecarPath: string
): {
  filename: string;
  sha256: string;
  size: number;
  mtime: number;
  path: string;
  phase: string;
  source: string;
} | null {
  if (!existsSync(sidecarPath)) return null;

  try {
    const content = readFileSync(sidecarPath, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.filename || !parsed.sha256 || typeof parsed.size !== "number") return null;
    if (typeof parsed.mtime !== "number") return null;

    return {
      filename: parsed.filename,
      sha256: parsed.sha256,
      size: parsed.size,
      mtime: parsed.mtime,
      path: parsed.linuxPath ?? parsed.path ?? "",
      phase: parsed.phase ?? extractPhasePrefix(parsed.filename).toUpperCase(),
      source: parsed.source ?? "packaged-metadata",
    };
  } catch {
    // Malformed JSON — treat as not found
    return null;
  }
}

/**
 * Handler for sda:worktree-package-metadata.
 * Reads dist/release/CURRENT.txt first as the source of truth (dev repo mode).
 * Falls back to a bundled release-metadata.json sidecar (packaged mode).
 * Then falls back to the newest *.zip by mtime (dev repo fallback).
 * Returns a `source` field indicating how metadata was resolved.
 */
export function handleWorktreePackageMetadata(
  projectRoot: string
): {
  ok: boolean;
  path?: string;
  sha256?: string;
  mtime?: number;
  filename?: string;
  size?: number;
  phase?: string;
  archivalAliases?: string[];
  source?: string;
  error?: string;
} {
  try {
    const distReleaseDir = join(projectRoot, "dist", "release");

    if (!existsSync(distReleaseDir)) {
      // Phase 2 (no dist/release/): Try release-metadata.json sidecar at project root
      // This covers packaged Electron apps where the sidecar is bundled via extraResources.
      const sidecarPath = join(projectRoot, "release-metadata.json");
      const sidecar = readReleaseMetadataSidecar(sidecarPath);
      if (sidecar) {
        return {
          ok: true,
          path: sidecar.path,
          sha256: sidecar.sha256,
          mtime: sidecar.mtime,
          filename: sidecar.filename,
          size: sidecar.size,
          phase: sidecar.phase,
          source: sidecar.source,
        };
      }
      return { ok: false, error: "dist/release/ directory does not exist", source: "unavailable" };
    }

    // Phase 1: Try CURRENT.txt as source of truth
    const currentFilename = readCurrentTxt(distReleaseDir);
    if (currentFilename) {
      const currentFullPath = join(distReleaseDir, currentFilename);
      if (existsSync(currentFullPath)) {
        const stats = statSync(currentFullPath);
        const fileBuffer = readFileSync(currentFullPath);
        const sha256 = createHash("sha256").update(fileBuffer).digest("hex");

        // Scan all ZIPs for archival aliases (everything except the current)
        let entries: string[] = [];
        try {
          entries = readdirSync(distReleaseDir);
        } catch {
          entries = [];
        }
        const archivalAliases = entries
          .filter((name) => name.endsWith(".zip") && name !== currentFilename)
          .map((f) => extractPhasePrefix(f).toUpperCase())
          .filter((phase, idx, self) => self.indexOf(phase) === idx)
          .sort();

        return {
          ok: true,
          path: currentFullPath,
          sha256,
          mtime: Math.floor(stats.mtimeMs / 1000),
          filename: currentFilename,
          size: stats.size,
          phase: extractPhasePrefix(currentFilename).toUpperCase(),
          source: "current-txt",
          archivalAliases: archivalAliases.length > 0 ? archivalAliases : undefined,
        };
      }
      // CURRENT.txt points to a missing ZIP — return error
      return {
        ok: false,
        error: `CURRENT.txt references ${currentFilename} but file not found in dist/release/`,
        source: "unavailable",
      };
    }

    // Phase 2: Try release-metadata.json sidecar in dist/release/
    // (in dev repo mode the sidecar may exist alongside CURRENT.txt)
    const distSidecarPath = join(distReleaseDir, "release-metadata.json");
    const distSidecar = readReleaseMetadataSidecar(distSidecarPath);
    if (distSidecar) {
      return {
        ok: true,
        path: distSidecar.path,
        sha256: distSidecar.sha256,
        mtime: distSidecar.mtime,
        filename: distSidecar.filename,
        size: distSidecar.size,
        phase: distSidecar.phase,
        source: distSidecar.source,
      };
    }

    // Phase 3: Fallback — scan dist/release/ for newest *.zip by mtime
    const entries = readdirSync(distReleaseDir);

    const zipFiles = entries
      .filter((name) => name.endsWith(".zip"))
      .map((name) => {
        const fullPath = join(distReleaseDir, name);
        const stats = statSync(fullPath);
        return { name, fullPath, mtimeMs: stats.mtimeMs, size: stats.size };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (zipFiles.length === 0) {
      return { ok: false, error: "no package found", source: "unavailable" };
    }

    const newest = zipFiles[0];
    const fileBuffer = readFileSync(newest.fullPath);
    const sha256 = createHash("sha256").update(fileBuffer).digest("hex");

    const archivalAliases = zipFiles.slice(1)
      .map((f) => extractPhasePrefix(f.name).toUpperCase())
      .filter((phase, idx, self) => self.indexOf(phase) === idx)
      .sort();

    return {
      ok: true,
      path: newest.fullPath,
      sha256,
      mtime: Math.floor(newest.mtimeMs / 1000),
      filename: newest.name,
      size: newest.size,
      phase: extractPhasePrefix(newest.name).toUpperCase(),
      source: "newest-zip-fallback",
      archivalAliases: archivalAliases.length > 0 ? archivalAliases : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message, source: "unavailable" };
  }
}

/**
 * Result type for handleHygieneScan
 */
export interface HygieneScanResult {
  gitignoreVerified: boolean;
  gitignoreDetails: string;
  staleArtifactCount: number;
  staleArtifactSizeMb: number;
  staleArtifactDetails: string;
  videoAnalysisExists: boolean;
  videoAnalysisDetails: string;
  archiveDetails: string;
}

/**
 * Handler for sda:hygiene-scan.
 * Reads local repo state: .gitignore coverage, stale dist/release/ artifacts,
 * and .local/video-analysis/ existence. No user-supplied arguments.
 */
export function handleHygieneScan(
  projectRoot: string
): { ok: boolean; result?: HygieneScanResult; error?: string } {
  try {
    // 1. .gitignore verification
    const gitignorePath = join(projectRoot, ".gitignore");
    let gitignoreVerified = false;
    let gitignoreDetails = "";

    if (existsSync(gitignorePath)) {
      const gitignoreContent = readFileSync(gitignorePath, "utf-8");
      const hasCodegraph = gitignoreContent.includes("codegraph/");
      const hasWorktrees = gitignoreContent.includes("worktrees/");
      gitignoreVerified = hasCodegraph && hasWorktrees;
      gitignoreDetails = gitignoreVerified
        ? "codegraph/ and worktrees/ gitignore coverage confirmed. Remediation is complete."
        : "codegraph/: " + (hasCodegraph ? "present" : "missing") + ", worktrees/: " + (hasWorktrees ? "present" : "missing");
    } else {
      gitignoreDetails = ".gitignore file not found.";
    }

    // 2. Stale dist/release/ artifacts (everything except newest zip is stale)
    const distReleaseDir = join(projectRoot, "dist", "release");
    let staleArtifactCount = 0;
    let staleArtifactSizeMb = 0;
    let staleArtifactDetails = "";
    let archiveDetails = "";

    if (existsSync(distReleaseDir)) {
      const allFiles = readdirSync(distReleaseDir);
      const zipFiles = allFiles
        .filter((name) => name.endsWith(".zip"))
        .map((name) => {
          const fullPath = join(distReleaseDir, name);
          try {
            const st = statSync(fullPath);
            return { name, fullPath, mtimeMs: st.mtimeMs, size: st.size };
          } catch {
            return null;
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

      const canonicalZipName = "v0.1.0-rc.1.zip";
      const canonicalZipFile = zipFiles.find((f) => f.name === canonicalZipName);

      // Stale = everything except the newest zip AND the canonical release zip
      const stale = zipFiles.slice(1).filter((f) => f.name !== canonicalZipName);
      staleArtifactCount = stale.length;
      staleArtifactSizeMb = Math.round(stale.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024));

      if (stale.length === 0) {
        staleArtifactDetails = "No stale dist/release/ artifacts detected.";
      } else {
        const staleNames = stale.map((f) => f.name).join(", ");
        staleArtifactDetails = "Stale " + staleNames + " remain. " + staleArtifactCount + " files, " + staleArtifactSizeMb + " MB";
      }

      // 2a. Archive directory awareness
      const archiveDir = join(projectRoot, "dist", ".release-archive");
      const archiveExists = existsSync(archiveDir);
      archiveDetails = archiveExists
        ? "Archive directory exists at dist/.release-archive/ with " + (readdirSync(archiveDir).length) + " archived sets."
        : "No archive directory yet.";
    } else {
      staleArtifactDetails = "dist/release/ directory does not exist.";
    }

    // 3. .local/video-analysis/
    const videoAnalysisPath = join(projectRoot, ".local", "video-analysis");
    const videoAnalysisExists = existsSync(videoAnalysisPath);
    const videoAnalysisDetails = videoAnalysisExists
      ? "Directory exists but is local-only / gitignored."
      : "Directory does not exist; the backlog item is closed as N/A.";

    return {
      ok: true,
      result: {
        gitignoreVerified,
        gitignoreDetails,
        staleArtifactCount,
        staleArtifactSizeMb,
        staleArtifactDetails,
        videoAnalysisExists,
        videoAnalysisDetails,
        archiveDetails,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Result type for handleCleanupPreview
 */
export interface CleanupPreviewResult {
  staleFiles: Array<{ name: string; size: number; phase: string }>;
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMb: number;
}

/**
 * Result type for handleCleanupExecute
 */
export interface CleanupExecuteResult {
  archived: number;
  failed: number;
  archiveDir: string;
  details: string;
}

/**
 * Canonical release zip — always excluded from archiving
 */
const CANONICAL_ZIP_NAME = "v0.1.0-rc.1.zip";

/**
 * Extract phase prefix from a zip filename like
 * "servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip" -> "ak"
 *
 * Matches -rc.1- followed by a short alphanumeric phase tag and an 8-digit date.
 * Falls back to scanning for a 2-char phase tag adjacent to the date in the
 * expected naming convention. Last resort: "generic" instead of "unknown" so
 * companion files route to a predictable directory rather than a misspelling.
 */
function extractPhasePrefix(filename: string): string {
  // Primary: -rc.1-<phase>-YYYYMMDD
  const match = filename.match(/-rc\.1-([a-z0-9]+)-\d{8}/);
  if (match && match[1]) return match[1];
  // Fallback: embedded phase between -rc.1- and -local (no date)
  const match2 = filename.match(/-rc\.1-([a-z0-9]{2,4})-local/);
  if (match2 && match2[1]) return match2[1];
  // Last resort: recognizable phase fragment anywhere in the base name
  const match3 = filename.match(/-rc\.1-([a-z0-9]+)/);
  if (match3 && match3[1]) return match3[1];
  return "generic";
}

/**
 * Handler for sda:cleanup-preview.
 * Returns a dry-run listing of files that would be archived.
 * No files are modified.
 */
export function handleCleanupPreview(
  projectRoot: string
): { ok: boolean; result?: CleanupPreviewResult; error?: string } {
  try {
    const distReleaseDir = join(projectRoot, "dist", "release");

    if (!existsSync(distReleaseDir)) {
      return { ok: false, error: "dist/release/ directory does not exist." };
    }

    const allFiles = readdirSync(distReleaseDir);

    const zipFiles = allFiles
      .filter((name) => name.endsWith(".zip"))
      .map((name) => {
        const fullPath = join(distReleaseDir, name);
        try {
          const st = statSync(fullPath);
          return { name, fullPath, mtimeMs: st.mtimeMs, size: st.size };
        } catch {
          return null;
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    // Keep: newest zip + canonical zip. Archive: everything else.
    const staleZips = zipFiles
      .slice(1)
      .filter((f) => f.name !== CANONICAL_ZIP_NAME);

    const staleFiles: Array<{ name: string; size: number; phase: string }> = [];

    for (const staleZip of staleZips) {
      const phase = extractPhasePrefix(staleZip.name);
      staleFiles.push({
        name: staleZip.name,
        size: staleZip.size,
        phase,
      });

      const baseName = staleZip.name.replace(/\.zip$/, "");
      const companions = allFiles.filter(
        (f) =>
          f !== staleZip.name &&
          (f.startsWith(baseName) ||
            (baseName.startsWith("servicenow-automation-windows-v") &&
              f.startsWith("servicenow-automation-windows-v") &&
              f.includes(`-${phase}-`)))
      );

      for (const comp of companions) {
        const compPath = join(distReleaseDir, comp);
        try {
          const compStat = statSync(compPath);
          if (compStat.isFile()) {
            // Extract phase from companion's own filename, fall back to zip's phase
            const compPhase = extractPhasePrefix(comp);
            staleFiles.push({ name: comp, size: compStat.size, phase: compPhase !== "unknown" ? compPhase : phase });
          }
        } catch {
          // skip
        }
      }
    }

    const totalSizeBytes = staleFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSizeMb = Math.round(totalSizeBytes / (1024 * 1024));

    return {
      ok: true,
      result: { staleFiles, totalFiles: staleFiles.length, totalSizeBytes, totalSizeMb },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Handler for sda:cleanup-execute.
 * Moves stale files from dist/release/ to dist/.release-archive/BJ-<phase>/.
 * Uses BJ-<phase> naming to avoid clashing with older aq6-era archive
 * directories. Only renames — no copy, no delete.
 * Renderer must confirm first.
 */
export function handleCleanupExecute(
  projectRoot: string
): { ok: boolean; result?: CleanupExecuteResult; error?: string } {
  try {
    const distReleaseDir = join(projectRoot, "dist", "release");

    if (!existsSync(distReleaseDir)) {
      return { ok: false, error: "dist/release/ directory does not exist." };
    }

    const preview = handleCleanupPreview(projectRoot);
    if (!preview.ok || !preview.result) {
      return { ok: false, error: preview.error ?? "Failed to compute cleanup list." };
    }

    const { staleFiles } = preview.result;
    if (staleFiles.length === 0) {
      return { ok: false, error: "No stale artifacts to archive." };
    }

    const archiveBase = join(projectRoot, "dist", ".release-archive");
    if (!existsSync(archiveBase)) {
      mkdirSync(archiveBase, { recursive: true });
    }

    let archived = 0;
    let failed = 0;

    for (const file of staleFiles) {
      const phaseDir = join(archiveBase, `BJ-${file.phase}`);
      if (!existsSync(phaseDir)) {
        mkdirSync(phaseDir, { recursive: true });
      }

      try {
        renameSync(join(distReleaseDir, file.name), join(phaseDir, file.name));
        archived++;
      } catch {
        failed++;
      }
    }

    return {
      ok: failed === 0,
      result: {
        archived,
        failed,
        archiveDir: archiveBase,
        details:
          `Archived ${archived} file(s) to dist/.release-archive/. ` +
          (failed > 0 ? `${failed} file(s) failed.` : "All files archived successfully."),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
