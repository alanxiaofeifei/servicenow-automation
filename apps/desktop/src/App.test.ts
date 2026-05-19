import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { App } from "./App";

function renderAppMarkup() {
  return renderToStaticMarkup(createElement(App));
}

describe("App", () => {
  it("exposes the required safety copy", () => {
    const rendered = renderAppMarkup();

    expect(rendered).toContain("ServiceNow Automation");
    expect(rendered).toContain(
      "AI drafts only. Human review and manual submit required."
    );
  });

  it("renders the Ticket Draft workspace controls and default VPN draft", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Ticket Draft Workspace");
    expect(output).toContain("Load VPN Demo");
    expect(output).toContain("Load Windows Demo");
    expect(output).toContain("Load Account/Login Demo");
    expect(output).toContain("VPN connection issue after password or MFA change");
    expect(output).toContain("Short Description");
    expect(output).toContain("Work Notes");
    expect(output).toContain("KB Matches");
    expect(output).toContain("VPN connectivity troubleshooting");
    expect(output).toContain("Human review required before any ServiceNow action.");
  });

  it("renders a filled mock ServiceNow Incident form with disabled demo submit", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Mock ServiceNow Incident Form");
    expect(output).toContain("Fill Mock ServiceNow Form");
    expect(output).toContain("Incident · QA/Dev rehearsal");
    expect(output).toContain("Caller");
    expect(output).toContain("Assignment Group");
    expect(output).toContain("VPN connection issue after password or MFA change");
    expect(output).toContain("Submit disabled in demo mode");
  });

  it("renders risk controls for no auto-submit/close and fill confirmation", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Risk Control Gate");
    expect(output).toContain("The app does not submit, close, or update real tickets automatically.");
    expect(output).toContain("Confirm human review before fill");
    expect(output).toContain("Fill action locked until review confirmation");
    expect(output).toContain("Final submit is always manual.");
  });

  it("renders ServiceNow environment modes and QA/dev safety boundaries", () => {
    const output = renderAppMarkup();

    expect(output).toContain("ServiceNow Environment Mode");
    expect(output).toContain("Mock Demo");
    expect(output).toContain("QA Test Environment");
    expect(output).toContain("Development Test Environment");
    expect(output).toContain("Production Shadow Mode");
    expect(output).not.toContain("href=\"https://");
    expect(output).toContain("Full ServiceNow URL hidden for privacy");
    expect(output).toContain("No raw clickable QA/dev link");
    expect(output).toContain("QA — No write until #22");
    expect(output).toContain("NO SUBMIT · NO UPDATE · NO CLOSE");
    expect(output).toContain("manual-login-only");
    expect(output).toContain("Ignored local runtime path");
    expect(output).toContain(".local/servicenow-browser-profiles/production-shadow");
    expect(output).toContain("Manual login required. Credentials are never stored in source code.");
    expect(output).toContain("Browser sessions stay in ignored local runtime folders.");
    expect(output).toContain("Any real QA/dev submit requires explicit Alan approval.");
    expect(output).toContain("Production remains shadow-only by default.");
    expect(output).toContain("No production submit, close, or update path is implemented.");
  });
});
