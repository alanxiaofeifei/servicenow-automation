export const corePackageName = "@service-now-automation/core";

export * from "./models";
export * from "./schemas";

export type HumanReviewPolicy = {
  aiDraftsOnly: true;
  manualSubmitRequired: true;
};

export const humanReviewPolicy: HumanReviewPolicy = {
  aiDraftsOnly: true,
  manualSubmitRequired: true
};
