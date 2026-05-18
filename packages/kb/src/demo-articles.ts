import type { KnowledgeArticle } from "@servicenow-automation/core";

export const demoKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: "demo-vpn-connectivity",
    title: "VPN connectivity troubleshooting",
    category: "Network",
    tags: ["vpn", "remote access", "tunnel", "mfa", "password", "certificate"],
    symptoms: [
      "VPN client cannot connect or remains disconnected.",
      "User recently changed password or moved between office and home network.",
      "Service desk needs enough context before escalating to network support."
    ],
    checks: [
      "Confirm whether internet access works outside VPN.",
      "Ask whether the user recently changed password or MFA method.",
      "Restart the VPN client and retry after confirming the correct username format.",
      "Capture the visible error message and approximate failure time."
    ],
    escalationCriteria: [
      "Multiple users report the same VPN failure.",
      "VPN fails after password/MFA checks and client restart.",
      "Certificate or policy error appears and cannot be resolved by standard steps."
    ],
    responseTemplate:
      "I will help check the VPN connection first. Please confirm whether your internet works without VPN, whether you recently changed your password or MFA method, and share the exact VPN error message if available.",
    updatedAt: "2026-05-18T00:00:00.000Z"
  },
  {
    id: "demo-windows-troubleshooting",
    title: "Windows endpoint troubleshooting",
    category: "Endpoint",
    tags: ["windows", "laptop", "blue screen", "bsod", "startup", "slow", "update"],
    symptoms: [
      "Windows laptop is slow, frozen, or repeatedly restarting.",
      "Blue screen, startup failure, update loop, or application launch issue is reported.",
      "User needs service desk triage before endpoint support escalation."
    ],
    checks: [
      "Ask when the issue started and whether it affects one application or the full device.",
      "Confirm whether reboot, power cycle, and network change were already attempted.",
      "Capture device name if available, but do not require it for the first draft.",
      "Ask for a screenshot or exact error text when safe and available."
    ],
    escalationCriteria: [
      "Device cannot boot or shows repeated blue screen.",
      "Multiple business-critical applications fail after basic checks.",
      "Data loss, encryption, or hardware failure is suspected."
    ],
    responseTemplate:
      "I will collect the Windows troubleshooting details first. Please confirm when the issue started, whether the whole laptop or only one application is affected, and whether a reboot has already been tried.",
    updatedAt: "2026-05-18T00:00:00.000Z"
  },
  {
    id: "demo-account-login",
    title: "Account and login troubleshooting",
    category: "Access Management",
    tags: ["account", "login", "password", "locked", "mfa", "authentication", "access denied"],
    symptoms: [
      "User cannot login, account appears locked, or password reset did not work.",
      "MFA prompt, authentication loop, or access denied message appears.",
      "Service desk needs to distinguish password, account lock, MFA, and entitlement issues."
    ],
    checks: [
      "Confirm whether the issue is password, MFA, locked account, or access to a specific application.",
      "Ask whether the user can login to other standard services.",
      "Confirm whether the password was recently changed.",
      "Record the application or portal name without collecting passwords or secrets."
    ],
    escalationCriteria: [
      "User cannot access any standard service after password reset.",
      "MFA device is unavailable or registration is broken.",
      "Access appears missing for a role or application entitlement."
    ],
    responseTemplate:
      "I will help check the login issue safely. Please do not share your password. Confirm whether this is a locked account, MFA prompt problem, password issue, or access denied message for a specific application.",
    updatedAt: "2026-05-18T00:00:00.000Z"
  }
];
