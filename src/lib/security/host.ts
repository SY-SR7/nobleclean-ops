const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(host: string): string {
  const trimmedHost = host.trim().toLowerCase();

  if (trimmedHost.startsWith("[") && trimmedHost.includes("]")) {
    return trimmedHost.slice(1, trimmedHost.indexOf("]"));
  }

  return trimmedHost.split(":")[0] ?? "";
}

function getConfiguredHosts(): Set<string> {
  const rawHosts = process.env.NOBLECLEAN_ALLOWED_HOSTS ?? "";

  return new Set(
    rawHosts
      .split(",")
      .map((host) => normalizeHostname(host))
      .filter(Boolean),
  );
}

export function isAllowedRequestHost(host: string | null): boolean {
  if (!host) {
    return false;
  }

  const hostname = normalizeHostname(host);

  if (!hostname) {
    return false;
  }

  const configuredHosts = getConfiguredHosts();

  if (configuredHosts.has(hostname)) {
    return true;
  }

  return (
    process.env.NODE_ENV !== "production" &&
    LOCAL_DEVELOPMENT_HOSTS.has(hostname)
  );
}
