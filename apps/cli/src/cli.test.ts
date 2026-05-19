import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runCli } from "./cli";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

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

  it("prints a no-write browser launch dry-run result for QA", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-launch-"));

    const result = await runCli(["browser", "launch", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser launch");
    expect(payload.launch.status).toBe("dry-run");
    expect(payload.launch.safety.noWriteMode).toBe(true);
    expect(payload.launch.safety.writeOperationsAllowed).toBe(false);
    expect(payload.launch.commandPreview.args).toContain("--new-window");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("blocks Windows browser executable dry-run from WSL/Linux without exposing a launchable command", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-windows-exe-blocked-"));

    const result = await runCli([
      "browser",
      "launch",
      "--mode",
      "qa",
      "--browser-executable",
      "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.launch.status).toBe("blocked");
    expect(payload.launch.plan.status).toBe("blocked");
    expect(payload.launch.blockedReason).toBe("Windows browser executable requires a verified Windows-compatible isolated profile path before launch.");
    expect(payload.launch.commandPreview).toBeUndefined();
    expect(payload.launch.profileIsolation).toMatchObject({
      status: "blocked",
      reason: "Windows browser executable requires a verified Windows-compatible isolated profile path before launch."
    });
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("sys_id");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("user:");
  });

  it("blocks Windows browser executable configured through SDA_BROWSER_EXECUTABLE", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-env-exe-blocked-"));
    const previousExecutable = process.env.SDA_BROWSER_EXECUTABLE;
    process.env.SDA_BROWSER_EXECUTABLE = "/mnt/./c/Program Files (x86)/Microsoft/Edge/Application/msedge.EXE  ";

    try {
      const result = await runCli([
        "browser",
        "launch",
        "--mode",
        "qa",
        "--execute",
        "--confirm-no-write-launch",
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(payload.launch.status).toBe("blocked");
      expect(payload.launch.commandPreview).toBeUndefined();
      expect(payload.launch.profileIsolation).toMatchObject({ status: "blocked" });
      expect(payload.safety.browserProcessLaunched).toBe(false);
    } finally {
      if (previousExecutable === undefined) {
        delete process.env.SDA_BROWSER_EXECUTABLE;
      } else {
        process.env.SDA_BROWSER_EXECUTABLE = previousExecutable;
      }
    }
  });

  it("blocks browser launch output for credential-bearing, query, or encoded sensitive URLs without leaking details", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-launch-blocked-"));
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;
    let repeatedEncodedPayload = "?sys_id=abc123";
    for (let index = 0; index < 4; index += 1) {
      repeatedEncodedPayload = encodeURIComponent(repeatedEncodedPayload);
    }

    const targetUrls = [
      `https://user:placeholder@${qaHost}/nav_to.do`,
      `https://${qaHost}/nav_to.do?sys_id=abc123`,
      `https://${qaHost}/nav_to.do${repeatedEncodedPayload}`,
      `https://${qaHost}/nav_to.do%253Fshort_description%253Dcustomer-data`
    ];

    for (const targetUrl of targetUrls) {
      const result = await runCli([
        "browser",
        "launch",
        "--mode",
        "qa",
        "--target-url",
        targetUrl,
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);
      const serialized = JSON.stringify(payload);

      expect(result.exitCode).toBe(0);
      expect(payload.launch.status).toBe("blocked");
      expect(serialized).not.toContain("user:");
      expect(serialized).not.toContain("@");
      expect(serialized).not.toContain("sys_id");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("placeholder");
      expect(payload.safety.browserProcessLaunched).toBe(false);
    }
  });

  it("returns sanitized JSON when an executable launch fails", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-missing-executable-"));

    const result = await runCli([
      "browser",
      "launch",
      "--mode",
      "qa",
      "--browser-executable",
      "/definitely/missing/sda-browser",
      "--execute",
      "--confirm-no-write-launch",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.launch.status).toBe("blocked");
    expect(payload.launch.blockedReason).toBe("Browser process could not be started. Check the configured browser executable.");
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("sys_id");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("user:");
  });
});
