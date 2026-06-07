import { describe, expect, it, vi } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

import { provisionChromiumRuntime, type ProvisionChromiumRuntimeOptions } from "./chromium-provisioner";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "sna-cft-test-"));
}

function makeOptions(overrides: Partial<ProvisionChromiumRuntimeOptions> & { localAppData: string }): ProvisionChromiumRuntimeOptions {
  return {
    localAppData: overrides.localAppData,
    fetchJson: overrides.fetchJson ?? (async () => ({
      channels: {
        Stable: {
          version: "134.0.6998.35",
          downloads: {
            chrome: [
              { platform: "win64", url: "https://example.com/chrome-win64.zip" },
            ],
          },
        },
      },
    })),
    downloadFile: overrides.downloadFile ?? (async () => {}), // no-op download
    extractZip: overrides.extractZip ?? (async (_zipPath: string, destDir: string) => {
      // Simulate ZIP extraction that creates chrome-win64/ with chrome.exe
      mkdirSync(join(destDir, "chrome-win64"), { recursive: true });
      writeFileSync(join(destDir, "chrome-win64", "chrome.exe"), "mock chrome binary");
    }),
    onProgress: overrides.onProgress,
  };
}

describe("provisionChromiumRuntime", () => {
  it("returns success when download and extract work (chrome-win64 subfolder)", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({ localAppData: tempDir });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    // Verify chrome.exe ended up in the runtime path
    const runtimeDir = join(tempDir, "ServiceNowAutomation", "Runtime", "Chromium");
    const { existsSync } = await import("node:fs");
    expect(existsSync(join(runtimeDir, "chrome.exe"))).toBe(true);
  });

  it("returns success when ZIP extracts directly (no chrome-win64 subfolder)", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({
      localAppData: tempDir,
      extractZip: async (_zipPath: string, destDir: string) => {
        mkdirSync(destDir, { recursive: true });
        writeFileSync(join(destDir, "chrome.exe"), "mock chrome binary");
      },
    });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns failure when metadata fetch returns no Stable channel", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({
      localAppData: tempDir,
      fetchJson: async () => ({ channels: {} }),
    });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(false);
    expect(result.error).toContain("No Stable channel");
  });

  it("returns failure when no win64 download URL in metadata", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({
      localAppData: tempDir,
      fetchJson: async () => ({
        channels: {
          Stable: {
            version: "134.0.6998.35",
            downloads: {
              chrome: [
                { platform: "win32", url: "https://example.com/chrome-win32.zip" },
              ],
            },
          },
        },
      }),
    });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(false);
    expect(result.error).toContain("No win64");
  });

  it("returns failure when download throws", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({
      localAppData: tempDir,
      downloadFile: async () => { throw new Error("Network error"); },
    });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  it("returns failure when extracted ZIP has no chrome.exe", async () => {
    const tempDir = makeTempDir();
    const opts = makeOptions({
      localAppData: tempDir,
      extractZip: async (_zipPath: string, destDir: string) => {
        mkdirSync(join(destDir, "chrome-win64"), { recursive: true });
        // Extract a different file, not chrome.exe
        writeFileSync(join(destDir, "chrome-win64", "readme.txt"), "no chrome here");
      },
    });

    const result = await provisionChromiumRuntime(opts);

    expect(result.success).toBe(false);
    expect(result.error).toContain("chrome.exe not found at target path");
  });

  it("returns failure when LOCALAPPDATA is not set", async () => {
    const result = await provisionChromiumRuntime({
      localAppData: undefined,
      fetchJson: async () => ({}),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("LOCALAPPDATA");
  });

  it("calls onProgress with expected stages", async () => {
    const tempDir = makeTempDir();
    const stages: string[] = [];
    const opts = makeOptions({
      localAppData: tempDir,
      onProgress: (update) => { stages.push(update.stage); },
    });

    await provisionChromiumRuntime(opts);

    expect(stages).toEqual(["fetching-metadata", "downloading", "extracting", "done"]);
  });

  it("calls onProgress with error stage on failure", async () => {
    const tempDir = makeTempDir();
    const stages: string[] = [];
    const opts = makeOptions({
      localAppData: tempDir,
      downloadFile: async () => { throw new Error("Network error"); },
      onProgress: (update) => { stages.push(update.stage); },
    });

    await provisionChromiumRuntime(opts);

    expect(stages).toContain("error");
  });
});
