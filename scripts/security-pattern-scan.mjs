import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const scanRoots = ["src", "next.config.ts", "package.json"];
const sourceExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".json",
]);
const ignoredDirectories = new Set([
  ".beads",
  ".git",
  ".next",
  ".tools",
  "node_modules",
]);

const rules = [
  {
    id: "SEC-XSS-001",
    pattern:
      /\bdangerouslySetInnerHTML\b|\b__html\s*:|\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\s*\(|\bdocument\.write(?:ln)?\s*\(/,
    reason:
      "raw HTML/DOM injection sinks require a reviewed sanitizer and CSP plan",
  },
  {
    id: "SEC-EVAL-001",
    pattern:
      /\beval\s*\(|\bnew\s+Function\b|\bsetTimeout\s*\(\s*["'`]|\bsetInterval\s*\(\s*["'`]/,
    reason: "dynamic code execution is forbidden in application source",
  },
  {
    id: "SEC-STORAGE-001",
    pattern: /\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b/,
    reason:
      "auth/session state must not be exposed to browser-readable storage",
  },
  {
    id: "SEC-SECRETS-001",
    pattern:
      /\bSUPABASE_SECRET_KEY\b|\bSUPABASE_SERVICE_ROLE_KEY\b|\bSERVICE_ROLE\b|\bDATABASE_URL\b|\bDB_URL\b|\bPRIVATE_KEY\b/,
    reason: "server secrets and privileged keys must not appear in app code",
  },
  {
    id: "SEC-CORS-001",
    pattern: /Access-Control-Allow-Origin["'\s:]*\*/,
    reason:
      "wildcard CORS must not be introduced without a reviewed allowlist design",
  },
  {
    id: "SEC-MSG-001",
    pattern: /\bpostMessage\s*\(/,
    reason:
      "postMessage use must include strict targetOrigin and origin validation",
  },
  {
    id: "SEC-SW-001",
    pattern: /\bserviceWorker\.register\b|\bcaches\.open\b/,
    reason:
      "service workers and caches need a dedicated sensitive-data caching review",
  },
];

function listSourceFiles(target) {
  const absoluteTarget = path.join(projectRoot, target);

  if (!existsSync(absoluteTarget)) {
    return [];
  }

  const stat = statSync(absoluteTarget);

  if (stat.isFile()) {
    return sourceExtensions.has(path.extname(absoluteTarget))
      ? [absoluteTarget]
      : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  return readdirSync(absoluteTarget).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) {
      return [];
    }

    return listSourceFiles(path.join(target, entry));
  });
}

const findings = [];

for (const filePath of scanRoots.flatMap(listSourceFiles)) {
  const relativePath = path
    .relative(projectRoot, filePath)
    .replaceAll("\\", "/");
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  rules.forEach((rule) => {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        findings.push({
          id: rule.id,
          line: index + 1,
          path: relativePath,
          reason: rule.reason,
        });
      }
    });
  });

  if (
    /["']use client["']/.test(content) &&
    (/\bprocess\.env\b/.test(content) || /@supabase\/supabase-js/.test(content))
  ) {
    findings.push({
      id: "SEC-BOUNDARY-001",
      line: 1,
      path: relativePath,
      reason:
        "client components must not import server/secret-boundary code or read environment variables",
    });
  }
}

if (findings.length > 0) {
  console.error("Security pattern scan failed:");
  findings.forEach((finding) => {
    console.error(
      `${finding.id} ${finding.path}:${finding.line} - ${finding.reason}`,
    );
  });
  process.exitCode = 1;
} else {
  console.log("Security pattern scan passed.");
}
