import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("sda binary wrapper", () => {
  it("runs --help through the sda wrapper", async () => {
    const { stdout } = await execFileAsync("node", ["bin/sda.mjs", "--help"], {
      cwd: new URL("..", import.meta.url).pathname
    });

    expect(stdout).toContain("Usage: sda");
  });

  it("preserves the caller working directory for input file paths", async () => {
    const repoRoot = new URL("../../..", import.meta.url).pathname;
    const { stdout } = await execFileAsync(
      "node",
      [
        "apps/cli/bin/sda.mjs",
        "run",
        "--workflow",
        "vpn_troubleshooting",
        "--input",
        "apps/cli/examples/vpn-case.json",
        "--dry-run",
        "--json"
      ],
      { cwd: repoRoot }
    );
    const payload = JSON.parse(stdout);

    expect(payload.workflow).toBe("vpn_troubleshooting");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });
});
