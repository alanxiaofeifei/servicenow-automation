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
});
