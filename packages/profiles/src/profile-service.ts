import {
  ProjectProfileSchema,
  type ProjectProfile
} from "@servicenow-automation/core";

import assignmentMappings from "../demo-yageo/mappings/assignment-mappings.json";
import categoryMappings from "../demo-yageo/mappings/category-mappings.json";
import profileData from "../demo-yageo/profile.json";

export class ProfileService {
  loadProjectProfile(input: unknown): ProjectProfile {
    return ProjectProfileSchema.parse(input);
  }

  loadDemoYageoProfile(): ProjectProfile {
    return this.loadProjectProfile({
      ...profileData,
      categoryMappings,
      assignmentMappings
    });
  }
}

export function loadDemoYageoProfile(): ProjectProfile {
  return new ProfileService().loadDemoYageoProfile();
}
