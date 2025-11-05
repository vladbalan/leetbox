export {};
// Generic comparison runner to benchmark all implementations for a given problem
// Usage:
//   npm run compare -- <problemName>
// Example:
//   npm run compare -- searchRotated

// Minimal env typings to avoid adding @types/node
declare const process: any;
declare function require(name: string): any;
declare const __dirname: string;
import { selectFromList } from "./interactive";

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
  } catch (err: any) {
    console.error(`❌ Could not run compare for problem "${problem}".`);
    console.error(err?.message || err);
    await printUsageAndExit();
  }
}

function getProblemName(): string | undefined {
  // Prefer positional args
  const argv = process.argv?.slice(2) ?? [];
  if (argv[0]) return String(argv[0]);

  // Attempt to parse npm_config_argv (best-effort support for "npm run compare problem")
  try {
    const raw = process.env?.npm_config_argv;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const original: string[] = parsed?.original ?? [];
    const skip = new Set(["run", "run-script", "compare", "--", "-s", "--silent"]);
    const candidate = original.find((t: string) => !skip.has(t));
    if (candidate) return candidate;
  } catch {
    // ignore
  }
  return undefined;
}

async function printUsageAndExit(reason?: string) {
  if (reason) console.error(`ℹ️  ${reason}`);
  console.log("Usage: npm run compare -- <problemName>");
  console.log("Examples:");
  console.log("  npm run compare -- searchRotated");
}

main();

async function listProblems(): Promise<string[]> {
  const fs: any = require("fs");
  const path: any = require("path");
  const base = path.resolve(__dirname, "../problems");
  const entries = fs.readdirSync(base, { withFileTypes: true });
  return entries
    .filter((e: any) => e.isDirectory?.())
    .map((e: any) => e.name)
    .sort();
}

