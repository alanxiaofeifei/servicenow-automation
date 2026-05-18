import { describe, expect, it } from "vitest";

import { humanReviewPolicy } from "./index";

describe("humanReviewPolicy", () => {
  it("requires human review and manual submit", () => {
    expect(humanReviewPolicy).toEqual({
      aiDraftsOnly: true,
      manualSubmitRequired: true
    });
  });
});
