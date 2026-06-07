import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock node:child_process before module imports
vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

// Mock node:fs before module imports
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  renameSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock node:crypto before module imports
vi.mock("node:crypto", () => ({
  createHash: vi.fn(),
}));

// Mock electron shell before module imports
vi.mock("electron", () => ({
  shell: {
    openPath: vi.fn(),
  },
}));

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { shell } from "electron";
import {
  handleCleanupExecute,
  handleCleanupPreview,
  handleHygieneScan,
  handleWorktreeGitDiff,
  handleWorktreeOpenDistRelease,
  handleWorktreePackageMetadata,
  handleWorktreeStatus,
} from "./worktree-ipc";

const PROJECT_ROOT = "/home/user/projects/test-repo";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// handleWorktreeGitDiff
// ---------------------------------------------------------------------------

describe("handleWorktreeGitDiff", () => {
  it("returns diff output when git diff succeeds", () => {
    vi.mocked(execFileSync).mockReturnValueOnce(
      " src/index.ts | 5 +++++\n 1 file changed, 5 insertions(+)\n"
    );

    const result = handleWorktreeGitDiff(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.result).toContain("5 insertions");
    expect(execFileSync).toHaveBeenCalledWith("git", ["diff", "--stat", "HEAD"], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      maxBuffer: 1024 * 100,
    });
  });

  it("sanitizes home directory from diff output", () => {
    const homeDir = "/home/user";
    vi.mocked(execFileSync).mockReturnValueOnce(
      " /home/user/projects/test-repo/src/index.ts | 2 ++\n 1 file changed, 2 insertions(+)\n"
    );

    const result = handleWorktreeGitDiff(PROJECT_ROOT, homeDir);

    expect(result.ok).toBe(true);
    expect(result.result).toContain("~");
    expect(result.result).not.toContain("/home/user");
  });

  it("returns error when git diff fails", () => {
    vi.mocked(execFileSync).mockImplementationOnce(() => {
      throw new Error("fatal: not a git repository");
    });

    const result = handleWorktreeGitDiff(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("fatal: not a git repository");
    expect(result.result).toBeUndefined();
  });

  it("does NOT sanitize when homeDir is undefined", () => {
    vi.mocked(execFileSync).mockReturnValueOnce(
      " /home/user/other/path/file.ts | 1 +\n"
    );

    const result = handleWorktreeGitDiff(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result).toContain("/home/user/other/path/file.ts");
  });

  it("handles empty diff (clean worktree)", () => {
    vi.mocked(execFileSync).mockReturnValueOnce("");

    const result = handleWorktreeGitDiff(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result).toBe("");
  });
});

// ---------------------------------------------------------------------------
// handleWorktreeOpenDistRelease
// ---------------------------------------------------------------------------

describe("handleWorktreeOpenDistRelease", () => {
  it("opens dist/release path via shell and returns ok", async () => {
    vi.mocked(shell.openPath).mockResolvedValueOnce("");

    const result = await handleWorktreeOpenDistRelease(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(shell.openPath).toHaveBeenCalledWith(
      expect.stringContaining("dist/release")
    );
  });

  it("returns error when shell.openPath returns an error string", async () => {
    vi.mocked(shell.openPath).mockResolvedValueOnce("ENOENT: path not found");

    const result = await handleWorktreeOpenDistRelease(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("ENOENT: path not found");
  });

  it("returns error when shell.openPath throws", async () => {
    vi.mocked(shell.openPath).mockRejectedValueOnce(new Error("access denied"));

    const result = await handleWorktreeOpenDistRelease(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("access denied");
  });
});

// ---------------------------------------------------------------------------
// handleWorktreeOpenFile
// ---------------------------------------------------------------------------

describe("handleWorktreeOpenFile", () => {
  it("opens a relative path via shell and returns ok", async () => {
    vi.mocked(shell.openPath).mockResolvedValueOnce("");

    const { handleWorktreeOpenFile } = await import("./worktree-ipc");
    const result = await handleWorktreeOpenFile(PROJECT_ROOT, "docs/test/windows-clean-machine-validation-2026-06-07.md");

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(shell.openPath).toHaveBeenCalledWith(
      expect.stringContaining("docs/test/windows-clean-machine-validation-2026-06-07.md")
    );
  });

  it("returns error when shell.openPath returns an error string", async () => {
    vi.mocked(shell.openPath).mockResolvedValueOnce("ENOENT: path not found");

    const { handleWorktreeOpenFile } = await import("./worktree-ipc");
    const result = await handleWorktreeOpenFile(PROJECT_ROOT, "nonexistent/file.md");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("ENOENT: path not found");
  });

  it("returns error when shell.openPath throws", async () => {
    vi.mocked(shell.openPath).mockRejectedValueOnce(new Error("access denied"));

    const { handleWorktreeOpenFile } = await import("./worktree-ipc");
    const result = await handleWorktreeOpenFile(PROJECT_ROOT, "docs/test/some.md");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("access denied");
  });
});

// ---------------------------------------------------------------------------
// handleWorktreeStatus
// ---------------------------------------------------------------------------

describe("handleWorktreeStatus", () => {
  it("returns dirty=true when there are uncommitted changes", () => {
    vi.mocked(execFileSync).mockReturnValueOnce(
      " M src/index.ts\n?? new-file.ts\n"
    );

    const result = handleWorktreeStatus(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.dirty).toBe(true);
    expect(result.result).toContain("M src/index.ts");
    expect(execFileSync).toHaveBeenCalledWith("git", ["status", "--porcelain"], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      maxBuffer: 1024 * 100,
    });
  });

  it("returns dirty=false when worktree is clean", () => {
    vi.mocked(execFileSync).mockReturnValueOnce("");

    const result = handleWorktreeStatus(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.dirty).toBe(false);
    expect(result.result).toBe("");
  });

  it("returns dirty=false and error on exec failure", () => {
    vi.mocked(execFileSync).mockImplementationOnce(() => {
      throw new Error("fatal: not a git repository");
    });

    const result = handleWorktreeStatus(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.dirty).toBe(false);
    expect(result.result).toContain("not a git repository");
  });

  it("detects staged-only changes as dirty", () => {
    vi.mocked(execFileSync).mockReturnValueOnce(
      "M  src/committed.ts\n"
    );

    const result = handleWorktreeStatus(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.dirty).toBe(true);
  });

  it("detects untracked files as dirty", () => {
    vi.mocked(execFileSync).mockReturnValueOnce(
      "?? untracked.txt\n"
    );

    const result = handleWorktreeStatus(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handleWorktreePackageMetadata
// ---------------------------------------------------------------------------

describe("handleWorktreePackageMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockDistReleaseDir(exists: boolean = true) {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return exists;
      return false;
    });
  }

  it("returns metadata for the newest .zip in dist/release/ (fallback when no CURRENT.txt)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-stale.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-newest.zip",
    ] as unknown as ReturnType<typeof readdirSync>);

    vi.mocked(statSync).mockImplementation((path) => {
      const name = String(path).includes("newest") ? "newest" : "stale";
      return {
        mtimeMs: name === "newest" ? 2000 : 1000,
        size: name === "newest" ? 500 : 300,
        isFile: () => true,
        isDirectory: () => false,
      } as ReturnType<typeof statSync>;
    });

    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("fake-zip-content"));
    const mockDigest = vi.fn().mockReturnValueOnce("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    const mockUpdate = vi.fn().mockReturnValue({ digest: mockDigest });
    const mockHash = { update: mockUpdate, digest: mockDigest };
    vi.mocked(createHash).mockReturnValueOnce(mockHash as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.filename).toBe("servicenow-automation-windows-v0.1.0-rc.1-newest.zip");
    expect(result.sha256).toBe("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    expect(result.size).toBe(500);
    expect(result.mtime).toBe(2);
    expect(result.path).toContain("dist/release");
    expect(result.error).toBeUndefined();
    expect(result.source).toBe("newest-zip-fallback");
  });

  it("returns error when no .zip files exist (no CURRENT.txt either)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("no package found");
    expect(result.path).toBeUndefined();
    expect(result.source).toBe("unavailable");
  });

  it("returns error when dist/release/ directory does not exist", () => {
    mockDistReleaseDir(false);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("dist/release/ directory does not exist");
    expect(result.source).toBe("unavailable");
  });

  it("returns error when readdirSync throws", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockImplementationOnce(() => {
      throw new Error("ENOENT: dist/release not found");
    });

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("ENOENT");
    expect(result.source).toBe("unavailable");
  });

  it("returns the newest file when multiple .zip files exist (no CURRENT.txt)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([
      "old-package.zip",
      "newer-package.zip",
      "newest-package.zip",
    ] as unknown as ReturnType<typeof readdirSync>);

    vi.mocked(statSync).mockImplementation((path) => {
      const name = String(path);
      let mtimeMs = 1000;
      if (name.includes("newest")) mtimeMs = 3000;
      else if (name.includes("newer")) mtimeMs = 2000;
      return {
        mtimeMs,
        size: 400,
        isFile: () => true,
        isDirectory: () => false,
      } as ReturnType<typeof statSync>;
    });

    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("newest-content"));
    const mockDigest2 = vi.fn().mockReturnValueOnce("sha256-newest");
    const mockUpdate2 = vi.fn().mockReturnValue({ digest: mockDigest2 });
    const mockHash2 = { update: mockUpdate2, digest: mockDigest2 };
    vi.mocked(createHash).mockReturnValueOnce(mockHash2 as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.filename).toBe("newest-package.zip");
    expect(result.sha256).toBe("sha256-newest");
    expect(result.source).toBe("newest-zip-fallback");
  });

  it("returns archival aliases for older .zip files except the newest (no CURRENT.txt)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-aq6-20260606-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-ak-20260605-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);

    vi.mocked(statSync).mockImplementation((path) => {
      const name = String(path);
      let mtimeMs = 1000;
      if (name.includes("ay6")) mtimeMs = 3000;
      else if (name.includes("aq6")) mtimeMs = 2000;
      return { mtimeMs, size: 400, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });

    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("ay6-content"));
    const mockDigest = vi.fn().mockReturnValueOnce("sha256-ay6");
    const mockUpdate = vi.fn().mockReturnValue({ digest: mockDigest });
    const mockHash = { update: mockUpdate, digest: mockDigest };
    vi.mocked(createHash).mockReturnValueOnce(mockHash as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.archivalAliases).toBeDefined();
    expect(result.archivalAliases).toEqual(["AK", "AQ6"]);
  });

  it("returns undefined archivalAliases when only one .zip exists (no CURRENT.txt)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-only-20260607-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);

    vi.mocked(statSync).mockReturnValueOnce({ mtimeMs: 1000, size: 300, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>);

    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("content"));
    const mockDigest = vi.fn().mockReturnValueOnce("sha256-only");
    const mockUpdate = vi.fn().mockReturnValue({ digest: mockDigest });
    const mockHash = { update: mockUpdate, digest: mockDigest };
    vi.mocked(createHash).mockReturnValueOnce(mockHash as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.archivalAliases).toBeUndefined();
  });

  it("deduplicates archival aliases when multiple zips share the same phase (no CURRENT.txt)", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-aq6-20260606-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-aq6-20260605-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);

    vi.mocked(statSync).mockImplementation((path) => {
      const name = String(path);
      if (name.includes("ay6")) return { mtimeMs: 3000, size: 400, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      if (name.includes("20260605")) return { mtimeMs: 1000, size: 300, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 2000, size: 300, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });

    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("ay6-content"));
    const mockDigest = vi.fn().mockReturnValueOnce("sha256-ay6");
    const mockUpdate = vi.fn().mockReturnValue({ digest: mockDigest });
    const mockHash = { update: mockUpdate, digest: mockDigest };
    vi.mocked(createHash).mockReturnValueOnce(mockHash as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.archivalAliases).toBeDefined();
    expect(result.archivalAliases).toEqual(["AQ6"]);
  });

  // CURRENT.txt source-of-truth tests

  it("uses the ZIP referenced by CURRENT.txt instead of newest by mtime", () => {
    mockDistReleaseDir(true);
    // existsSync: CURRENT.txt exists
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("CURRENT=current-marker.zip\n"));
    vi.mocked(readdirSync).mockReturnValueOnce([
      "current-marker.zip",
      "older-phase.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockReturnValueOnce({ mtimeMs: 500, size: 600, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>);
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("marker-content"));
    const mockDigest = vi.fn().mockReturnValueOnce("marker-sha256");
    const mockUpdate = vi.fn().mockReturnValue({ digest: mockDigest });
    const mockHash = { update: mockUpdate, digest: mockDigest };
    vi.mocked(createHash).mockReturnValueOnce(mockHash as unknown as ReturnType<typeof createHash>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.filename).toBe("current-marker.zip");
    expect(result.sha256).toBe("marker-sha256");
    expect(result.source).toBe("current-txt");
    expect(result.error).toBeUndefined();
  });

  it("returns error when CURRENT.txt references a missing ZIP", () => {
    mockDistReleaseDir(true);
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("CURRENT.txt")) return true;
      if (String(path).includes("current-broken.zip")) return false;
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("CURRENT=current-broken.zip\n"));

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("current-broken.zip");
    expect(result.source).toBe("unavailable");
  });

  it("returns error when CURRENT.txt is missing and no .zip files exist", () => {
    mockDistReleaseDir(true);
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("no package found");
    expect(result.source).toBe("unavailable");
  });

  it("rejects path traversal in CURRENT= line", () => {
    mockDistReleaseDir(true);
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("CURRENT=../../evil.zip\n"));
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    // Should fall through to the fallback, finding no zips
    expect(result.ok).toBe(false);
    expect(result.error).toBe("no package found");
  });

  // ---------------------------------------------------------------------------
  // release-metadata.json sidecar tests
  // ---------------------------------------------------------------------------

  it("reads release-metadata.json sidecar at project root when dist/release/ does not exist (packaged mode)", () => {
    // dist/release/ does not exist
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("release-metadata.json")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify({
        version: 1,
        filename: "servicenow-automation-windows-v0.1.0-rc.1-packaged-20260607-local.zip",
        sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        size: 123456789,
        mtime: 1700000000,
        linuxPath: "/home/user/dist/release/packaged.zip",
        phase: "PACKAGED",
        source: "packaged-metadata",
      })
    );

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.filename).toBe("servicenow-automation-windows-v0.1.0-rc.1-packaged-20260607-local.zip");
    expect(result.sha256).toBe("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    expect(result.size).toBe(123456789);
    expect(result.mtime).toBe(1700000000);
    expect(result.source).toBe("packaged-metadata");
    expect(result.path).toContain("packaged.zip");
    expect(result.error).toBeUndefined();
  });

  it("returns unavailable when dist/release/ missing and no sidecar found (packaged mode fallthrough)", () => {
    // No dist/release/, no release-metadata.json
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("release-metadata.json")) return false;
      if (String(path).includes("dist/release")) return false;
      return false;
    });

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("dist/release/ directory does not exist");
    expect(result.source).toBe("unavailable");
  });

  it("returns unavailable with malformed JSON in sidecar", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("release-metadata.json")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("not valid json"));

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("dist/release/ directory does not exist");
    expect(result.source).toBe("unavailable");
  });

  it("returns unavailable with version mismatch in sidecar", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("release-metadata.json")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify({
        version: 2,
        filename: "some.zip",
        sha256: "abcdef",
        size: 100,
        mtime: 1,
      })
    );

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("dist/release/ directory does not exist");
    expect(result.source).toBe("unavailable");
  });

  it("returns unavailable with missing required fields in sidecar", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("release-metadata.json")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify({
        version: 1,
        // missing filename and sha256
        size: 100,
        mtime: 1,
      })
    );

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("dist/release/ directory does not exist");
    expect(result.source).toBe("unavailable");
  });

  it("uses dist/release/release-metadata.json when sidecar exists in dist/release/ (dev repo mode)", () => {
    // dist/release/ exists, but no CURRENT.txt
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("CURRENT.txt")) return false;
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    // readCurrentTxt returns null without calling readFileSync
    // (existsSync returns false for CURRENT.txt path)
    // First readFileSync call is from readReleaseMetadataSidecar
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify({
        version: 1,
        filename: "servicenow-automation-windows-v0.1.0-rc.1-dev-sidecar-20260607-local.zip",
        sha256: "dev-sidecar-sha256",
        size: 5000,
        mtime: 1700001000,
        linuxPath: "/home/user/dist/release/dev-sidecar.zip",
        phase: "DEV",
        source: "packaged-metadata",
      })
    );

    const result = handleWorktreePackageMetadata(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.filename).toBe("servicenow-automation-windows-v0.1.0-rc.1-dev-sidecar-20260607-local.zip");
    expect(result.sha256).toBe("dev-sidecar-sha256");
    expect(result.source).toBe("packaged-metadata");
    expect(result.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// handleHygieneScan
// ---------------------------------------------------------------------------

describe("handleHygieneScan", () => {
  it("returns gitignoreVerified=true when .gitignore exists with codegraph/ and worktrees/", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes(".gitignore")) return true;
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(
      Buffer.from("codegraph/\nworktrees/\nnode_modules/\n")
    );
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.gitignoreVerified).toBe(true);
    expect(result.result?.gitignoreDetails).toContain("confirmed");
    expect(result.result?.staleArtifactCount).toBe(0);
  });

  it("returns gitignoreVerified=false when .gitignore does not exist", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      return false;
    });

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.gitignoreVerified).toBe(false);
    expect(result.result?.gitignoreDetails).toContain(".gitignore");
    expect(result.result?.staleArtifactDetails).toContain("does not exist");
  });

  it("detects stale zip artifacts in dist/release/", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes(".gitignore")) return true;
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(
      Buffer.from("codegraph/\nworktrees/\n")
    );
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-au6-20260606-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-at6-20260605-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockImplementation((path) => {
      if (String(path).includes("av6")) return { mtimeMs: 3000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      if (String(path).includes("au6")) return { mtimeMs: 2000, size: 400000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 1000, size: 300000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.staleArtifactCount).toBeGreaterThan(0);
    expect(result.result?.staleArtifactDetails).toContain("au6");
    expect(result.result?.staleArtifactDetails).toContain("at6");
  });

  it("detects .local/video-analysis/ directory existence", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes(".gitignore")) return true;
      if (String(path).includes("dist/release")) return true;
      if (String(path).includes("video-analysis")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("codegraph/\nworktrees/\n"));
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.videoAnalysisExists).toBe(true);
    expect(result.result?.videoAnalysisDetails).toContain("exists");
  });

  it("reports videoAnalysisExists=false when .local/video-analysis/ does not exist", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes(".gitignore")) return true;
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("codegraph/\nworktrees/\n"));
    vi.mocked(readdirSync).mockReturnValueOnce([] as unknown as ReturnType<typeof readdirSync>);

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.videoAnalysisExists).toBe(false);
    expect(result.result?.videoAnalysisDetails).toContain("does not exist");
  });

  it("returns ok=false when readFileSync throws", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes(".gitignore")) return true;
      return false;
    });
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      throw new Error("EACCES: permission denied");
    });

    const result = handleHygieneScan(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("EACCES");
  });
});

// ---------------------------------------------------------------------------
// handleCleanupPreview
// ---------------------------------------------------------------------------

describe("handleCleanupPreview", () => {
  it("returns stale files grouped by phase when dist/release/ has multiple non-newest zips", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-au6-20260606-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-at6-20260605-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockImplementation((path) => {
      if (String(path).includes("av6")) return { mtimeMs: 3000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      if (String(path).includes("au6")) return { mtimeMs: 2000, size: 400000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 1000, size: 300000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });

    const result = handleCleanupPreview(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.staleFiles.length).toBe(2);
    expect(result.result?.staleFiles[0].phase).toBe("au6");
    expect(result.result?.staleFiles[1].phase).toBe("at6");
    expect(result.result?.totalFiles).toBe(2);
  });

  it("returns empty preview when only the newest zip exists", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValueOnce([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockReturnValueOnce({ mtimeMs: 3000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>);

    const result = handleCleanupPreview(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.staleFiles.length).toBe(0);
    expect(result.result?.totalFiles).toBe(0);
  });

  it("returns ok=false when dist/release/ does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = handleCleanupPreview(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("returns ok=false when readdirSync throws", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockImplementationOnce(() => {
      throw new Error("EACCES: permission denied");
    });

    const result = handleCleanupPreview(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("EACCES");
  });

  it("returns empty stale entries when no .zip files exist in dist/release/", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValueOnce([
      "readme.txt",
      "manifest.json",
    ] as unknown as ReturnType<typeof readdirSync>);

    const result = handleCleanupPreview(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.staleFiles.length).toBe(0);
    expect(result.result?.totalFiles).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// handleCleanupExecute
// ---------------------------------------------------------------------------

describe("handleCleanupExecute", () => {
  it("archives stale files to correct phase directories", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      if (String(path).includes(".release-archive")) return false;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-au6-20260606-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-at6-20260605-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockImplementation((path) => {
      if (String(path).includes("av6")) return { mtimeMs: 3000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      if (String(path).includes("au6")) return { mtimeMs: 2000, size: 400000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 1000, size: 300000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });
    vi.mocked(mkdirSync).mockReturnValue(undefined as unknown as ReturnType<typeof mkdirSync>);
    vi.mocked(renameSync).mockReturnValue(undefined as unknown as ReturnType<typeof renameSync>);

    const result = handleCleanupExecute(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    expect(result.result?.archived).toBe(2);
    expect(result.result?.failed).toBe(0);
    expect(renameSync).toHaveBeenCalledTimes(2);
    // Verify archive destination uses BJ-<phase> prefix
    const renameCalls = vi.mocked(renameSync).mock.calls;
    for (const [, dest] of renameCalls) {
      expect(String(dest)).toMatch(/BJ-/);
    }
  });

  it("creates archive root directory before archiving", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-au6-20260606-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockImplementation((path) => {
      if (String(path).includes("av6")) return { mtimeMs: 2000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 1000, size: 400000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });
    vi.mocked(mkdirSync).mockReturnValue(undefined as unknown as ReturnType<typeof mkdirSync>);
    vi.mocked(renameSync).mockReturnValue(undefined as unknown as ReturnType<typeof renameSync>);

    handleCleanupExecute(PROJECT_ROOT);

    // mkdirSync called for archive root and for the phase subdirectory
    expect(mkdirSync).toHaveBeenCalled();
    const mkdirCalls = vi.mocked(mkdirSync).mock.calls;
    expect(mkdirCalls.length).toBeGreaterThanOrEqual(2);
    const allPaths = mkdirCalls.map((c) => String(c[0]));
    expect(allPaths.some((p) => p.includes(".release-archive"))).toBe(true);
    // Verify BJ- prefix in phase directory mkdir calls
    expect(allPaths.some((p) => p.includes("BJ-"))).toBe(true);
  });

  it("does not archive the newest zip", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([
      "servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip",
      "servicenow-automation-windows-v0.1.0-rc.1-au6-20260606-local.zip",
    ] as unknown as ReturnType<typeof readdirSync>);
    vi.mocked(statSync).mockImplementation((path) => {
      if (String(path).includes("av6")) return { mtimeMs: 2000, size: 500000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
      return { mtimeMs: 1000, size: 400000, isFile: () => true, isDirectory: () => false } as ReturnType<typeof statSync>;
    });
    vi.mocked(mkdirSync).mockReturnValue(undefined as unknown as ReturnType<typeof mkdirSync>);
    vi.mocked(renameSync).mockReturnValue(undefined as unknown as ReturnType<typeof renameSync>);

    const result = handleCleanupExecute(PROJECT_ROOT);

    expect(result.ok).toBe(true);
    // Only the stale zip (au6) should be renamed
    const renameCalls = vi.mocked(renameSync).mock.calls;
    const renamedSources = renameCalls.map((c) => String(c[0]));
    expect(renamedSources.some((s) => s.includes("av6"))).toBe(false);
    expect(renamedSources.some((s) => s.includes("au6"))).toBe(true);
  });

  it("returns ok=false when readdirSync throws", () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("dist/release")) return true;
      return false;
    });
    vi.mocked(readdirSync).mockImplementationOnce(() => {
      throw new Error("EACCES: permission denied");
    });

    const result = handleCleanupExecute(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("EACCES");
  });

  it("returns ok=false when dist/release/ does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = handleCleanupExecute(PROJECT_ROOT);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("does not exist");
  });
});
