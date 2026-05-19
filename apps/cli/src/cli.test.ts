import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runCli } from "./cli";

const cwd = new URL("..", import.meta.url).pathname;

describe("sda CLI", () => {
  it("prints help", async () => {
    const result = await runCli(["--help"], { cwd });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: sda");
    expect(result.stdout).toContain("sda kb search <query>");
    expect(result.stdout).toContain("sda run --workflow <workflow_name>");
  });

  it("searches demo KB with machine-readable JSON", async () => {
    const result = await runCli(["kb", "search", "VPN cannot connect", "--json"], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("kb search");
    expect(payload.query).toBe("VPN cannot connect");
    expect(payload.matches[0].title).toContain("VPN");
  });

  it("creates a ticket draft from structured flags", async () => {
    const result = await runCli([
      "ticket",
      "draft",
      "--template",
      "vpn_issue",
      "--user",
      "Demo User",
      "--summary",
      "Cannot connect to VPN after password change",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("ticket draft");
    expect(payload.dryRun).toBe(true);
    expect(payload.ticketDraft.shortDescription.value).toContain("VPN");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("generates work notes from a sample JSON file", async () => {
    const result = await runCli([
      "notes",
      "generate",
      "--template",
      "password_reset",
      "--input",
      "examples/password-reset-case.json",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("notes generate");
    expect(payload.notes.workNotes).toContain("password");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("runs a workflow in dry-run mode without external actions", async () => {
    const result = await runCli([
      "run",
      "--workflow",
      "vpn_troubleshooting",
      "--input",
      "examples/vpn-case.json",
      "--dry-run",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("run");
    expect(payload.workflow).toBe("vpn_troubleshooting");
    expect(payload.dryRun).toBe(true);
    expect(payload.plannedActions).toContain("Generate editable TicketDraft");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("prints a browser session launch plan for QA without launching a browser", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-plan-"));

    const result = await runCli(["browser", "plan", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser plan");
    expect(payload.plan.status).toBe("ready");
    expect(payload.plan.targetUrl).toContain("https://yageoqa.service-now.com");
    expect(payload.plan.browserProfileDirectory).toContain(".local/servicenow-browser-profiles/qa");
    expect(payload.plan.safety.browserAutomationImplemented).toBe(false);
    expect(payload.plan.safety.realSubmitAllowed).toBe(false);
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("resets a browser session profile directory without touching source files", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-reset-"));
    const profileDir = join(projectRoot, ".local/servicenow-browser-profiles/qa");
    const marker = join(profileDir, "cookie-placeholder.txt");
    await mkdir(profileDir, { recursive: true });
    await writeFile(marker, "runtime only", "utf8");

    const result = await runCli(["browser", "reset", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser reset");
    expect(payload.reset.deletedDirectory).toContain(".local/servicenow-browser-profiles/qa");
    await expect(readFile(marker, "utf8")).rejects.toThrow();
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });
});
