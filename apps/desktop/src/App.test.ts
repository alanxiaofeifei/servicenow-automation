import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("exposes the required safety copy", () => {
    const rendered = App();

    expect(JSON.stringify(rendered)).toContain("Service Now Automation");
    expect(JSON.stringify(rendered)).toContain(
      "AI drafts only. Human review and manual submit required."
    );
  });
});
