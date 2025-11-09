export {};
// Generic comparison runner to benchmark all implementations for a given problem
// Usage:
//   npm run compare -- <problemName>
// Example:
//   npm run compare -- searchRotated

import { selectFromList } from "./interactive";
import process, { argv, cwd, exit } from "node:process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  let problem = getProblemName();
  if (!problem) {
    // Interactive selection when no problem name is provided
    const problems = await listProblems();
    if (!problems.length) {
      await printUsageAndExit("No problems found.");
      return;
    }
    problem = await selectFromList(problems, { title: "Select a problem to compare" });
    if (!problem) {
      console.log("No selection made. Exiting.");
      return;
    }
  }

  try {
    await import(`../problems/${problem}/compare.ts`);
  } catch (err: unknown) {
    console.error(`❌ Could not run compare for problem "${problem}".`);
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
      if (err.stack) {
        console.error(`Stack: ${err.stack}`);
      }
    } else {
      console.error(`Unknown error: ${String(err)}`);
    }
    await printUsageAndExit();
  }
}

function getProblemName(): string | undefined {
  // Prefer positional args
  const args = argv?.slice(2) ?? [];
  if (args[0]) return String(args[0]);

  // Attempt to parse npm_config_argv (best-effort support for "npm run compare problem")
  try {
    const raw = process.env?.npm_config_argv;
    if (!raw) return undefined;
    
    const parsed: unknown = JSON.parse(raw);
    if (!isValidNpmConfigArgv(parsed)) return undefined;
    
    const original: string[] = parsed.original ?? [];
    const skip = new Set(["run", "run-script", "compare", "--", "-s", "--silent"]);
    const candidate = original.find((t: string) => !skip.has(t));
    if (candidate) return candidate;
  } catch (err: unknown) {
    // JSON parse failed or env variable invalid - silently ignore
  }
  return undefined;
}

function isValidNpmConfigArgv(value: unknown): value is { original?: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    (!("original" in value) ||
      (Array.isArray((value as { original?: unknown }).original) &&
        (value as { original: unknown[] }).original.every((v) => typeof v === "string")))
  );
}

async function printUsageAndExit(reason?: string) {
  if (reason) console.error(`ℹ️  ${reason}`);
  console.log("Usage: npm run compare -- <problemName>");
  console.log("Examples:");
  console.log("  npm run compare -- searchRotated");
  exit(1);
}

async function listProblems(): Promise<string[]> {
  const base = join(cwd(), "problems");
  const entries = await readdir(base, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

main();

