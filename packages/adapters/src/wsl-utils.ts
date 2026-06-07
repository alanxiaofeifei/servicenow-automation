/**
 * Resolves the WSL distro name from environment variables.
 *
 * Checks SDA_WSL_DISTRO first (project-specific override), then falls back
 * to WSL_DISTRO_NAME (standard WSL env var). Returns undefined when neither
 * is set or when the value is empty/invalid.
 *
 * This function only accesses process.env — no Node.js core module imports.
 * Safe to import from Electron renderer or browser contexts where
 * process.env is available.
 */
export function resolveWslDistroName(): string | undefined {
  const distroName = process.env.SDA_WSL_DISTRO ?? process.env.WSL_DISTRO_NAME;
  const sanitizedDistroName = distroName?.trim();
  return sanitizedDistroName && /^[A-Za-z0-9_.-]+$/.test(sanitizedDistroName)
    ? sanitizedDistroName
    : undefined;
}
