import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { rm } from "node:fs/promises";
import { get } from "node:https";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProvisionProgress = {
  stage: "fetching-metadata" | "downloading" | "extracting" | "done" | "error";
  percent?: number;
  message?: string;
};

export type ProvisionResult = {
  success: boolean;
  error?: string;
};

export type ProvisionChromiumRuntimeOptions = {
  /** Windows %LOCALAPPDATA% path (injectable for testing) */
  localAppData?: string;
  /** Custom fetch function for the metadata JSON (injectable for testing) */
  fetchJson?: (url: string) => Promise<unknown>;
  /** Custom download function (injectable for testing) */
  downloadFile?: (url: string, destPath: string, onProgress?: (percent: number) => void) => Promise<void>;
  /** Custom ZIP extraction function (injectable for testing) */
  extractZip?: (zipPath: string, destDir: string) => Promise<void>;
  /** Progress callback */
  onProgress?: (update: ProvisionProgress) => void;
};

// ---------------------------------------------------------------------------
// Internal helpers (injectable via options)
// ---------------------------------------------------------------------------

async function defaultFetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Metadata fetch failed with status ${response.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
        } catch {
          reject(new Error("Failed to parse Chrome for Testing metadata JSON"));
        }
      });
    }).on("error", reject);
  });
}

function defaultDownloadFile(
  url: string,
  destPath: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }
      const totalSize = Number(response.headers["content-length"] ?? 0);
      let downloadedSize = 0;
      const fileStream = createWriteStream(destPath);
      response.pipe(fileStream);
      response.on("data", (chunk: Buffer) => {
        downloadedSize += chunk.length;
        if (totalSize > 0 && onProgress) {
          onProgress(Math.round((downloadedSize / totalSize) * 100));
        }
      });
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", (err) => {
        fileStream.close();
        reject(err);
      });
    }).on("error", reject);
  });
}

/**
 * Extract ZIP archive using PowerShell's built-in Expand-Archive (Windows only).
 */
async function defaultExtractZip(zipPath: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true });
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
    ],
    { timeout: 120_000 },
  );
}

/**
 * Move all files from `src` dir to `dest` dir using Node.js built-in fs.
 * Works on all platforms (Windows, Linux, WSL) because both src and dest
 * are on the same filesystem (under %LOCALAPPDATA% on Windows, or /tmp on WSL).
 * Overwrites existing files at dest.
 */
function moveDirectoryContents(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    renameSync(srcPath, destPath);
  }
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Fetches the Chrome for Testing metadata JSON and extracts the download URL
 * for win64.
 */
async function resolveChromeForTestingDownloadUrl(
  fetchJson: (url: string) => Promise<unknown>,
): Promise<string> {
  const metadataUrl =
    "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json";
  const data = (await fetchJson(metadataUrl)) as {
    channels?: {
      Stable?: {
        downloads?: {
          chrome?: Array<{ platform: string; url: string }>;
        };
      };
    };
  };

  const stable = data?.channels?.Stable;
  if (!stable) throw new Error("No Stable channel found in Chrome for Testing metadata");

  const chromeDownloads = stable.downloads?.chrome;
  if (!chromeDownloads) throw new Error("No chrome downloads in Chrome for Testing metadata");

  const win64 = chromeDownloads.find((d) => d.platform === "win64");
  if (!win64?.url) throw new Error("No win64 Chrome for Testing download URL found");

  return win64.url;
}

/**
 * Provisions the dedicated Chromium runtime by downloading and extracting
 * Chrome for Testing from the official Google metadata endpoint.
 *
 * Caller provides a `onProgress` callback for UI updates.
 * Returns `{ success: true }` on completion or `{ success: false, error }`
 * on failure.
 */
export async function provisionChromiumRuntime(
  options: ProvisionChromiumRuntimeOptions = {},
): Promise<ProvisionResult> {
  const {
    localAppData = process.env.LOCALAPPDATA,
    fetchJson = defaultFetchJson,
    downloadFile: download = defaultDownloadFile,
    extractZip: extract = defaultExtractZip,
    onProgress,
  } = options;

  try {
    if (!localAppData) {
      return { success: false, error: "LOCALAPPDATA not set" };
    }

    onProgress?.({ stage: "fetching-metadata", percent: 0, message: "Fetching Chrome for Testing version info..." });

    const downloadUrl = await resolveChromeForTestingDownloadUrl(fetchJson);
    const runtimeDir = join(localAppData, "ServiceNowAutomation", "Runtime", "Chromium");
    const tempDir = join(localAppData, "ServiceNowAutomation", "Runtime", ".chrome-provision-tmp");
    const zipPath = join(tempDir, "chrome-for-testing.zip");

    // Prepare temp directory
    mkdirSync(tempDir, { recursive: true });

    onProgress?.({ stage: "downloading", percent: 0, message: "Downloading Chrome for Testing (approx 150 MB)..." });

    await download(downloadUrl, zipPath, (percent) => {
      onProgress?.({ stage: "downloading", percent, message: `Downloading... ${percent}%` });
    });

    onProgress?.({ stage: "extracting", percent: 0, message: "Extracting Chrome for Testing..." });

    await extract(zipPath, tempDir);

    // The ZIP extracts into a subdirectory chrome-win64/ — move contents
    // to the runtime directory.
    const extractedDir = join(tempDir, "chrome-win64");
    if (existsSync(extractedDir)) {
      moveDirectoryContents(extractedDir, runtimeDir);
    } else if (existsSync(join(tempDir, "chrome.exe"))) {
      // No subdirectory — extracted directly into tempDir
      moveDirectoryContents(tempDir, runtimeDir);
    } else {
      await rm(tempDir, { recursive: true, force: true });
      return { success: false, error: "Extracted Chrome for Testing does not contain chrome.exe" };
    }

    // Clean up temp
    await rm(tempDir, { recursive: true, force: true });

    // Verify runtime exists
    if (!existsSync(join(runtimeDir, "chrome.exe"))) {
      return { success: false, error: "Provisioning completed but chrome.exe not found at target path" };
    }

    onProgress?.({ stage: "done", percent: 100, message: "Chrome for Testing ready" });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provisioning error";
    onProgress?.({ stage: "error", message });
    return { success: false, error: message };
  }
}
