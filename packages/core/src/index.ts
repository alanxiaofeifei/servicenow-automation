export const corePackageName = "@servicenow-automation/core";

export * from "./models";
export * from "./schemas";
export * from "./source-cleanup";
export * from "./real-action-gate";

export type HumanReviewPolicy = {
  aiDraftsOnly: true;
  manualSubmitRequired: true;
};

export const humanReviewPolicy: HumanReviewPolicy = {
  aiDraftsOnly: true,
  manualSubmitRequired: true
};
