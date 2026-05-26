import {
  ProjectProfileSchema,
  type ProjectProfile
} from "@servicenow-automation/core";

import assignmentMappings from "../demo-service-desk/mappings/assignment-mappings.json";
import categoryMappings from "../demo-service-desk/mappings/category-mappings.json";
import profileData from "../demo-service-desk/profile.json";

export class ProfileService {
  loadProjectProfile(input: unknown): ProjectProfile {
    return ProjectProfileSchema.parse(input);
  }

  loadDemoServiceDeskProfile(): ProjectProfile {
    return this.loadProjectProfile({
      ...profileData,
      categoryMappings,
      assignmentMappings
    });
  }
}

export function loadDemoServiceDeskProfile(): ProjectProfile {
  return new ProfileService().loadDemoServiceDeskProfile();
}
