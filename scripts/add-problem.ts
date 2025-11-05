#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function toCamelCase(input: string): string {
  const parts = input
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return [first.toLowerCase(), ...rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())].join('');
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

function problemIndexTs(problemName: string): string {
  return `import { runTests } from "../../utils/testRunner";\nimport { latest, testCases } from "./impl";\n\n// ${problemName}\nrunTests(\n  "${problemName}",\n  ({ arr, target }) => latest.fn(arr, target),\n  testCases\n);\n`;
}

function problemCompareTs(shortName: string): string {
  return `import { runComparison } from "../../utils/bench";\nimport { implementations, testCases } from "./impl";\n\nrunComparison(\n  "${shortName} implementations",\n  implementations,\n  testCases,\n  (input) => [input.arr, input.target],\n  { iterations: 30, warmup: 2, quiet: true }\n);\n`;
}

function implIndexTs(): string {
  return `import { naiveVariant } from "./variants/naive";\nexport { testCases } from "./testCases";\n\n// Registry of implementations (newest last)\nexport const implementations = [\n  { name: "naive", fn: (arr: number[], target: number) => naiveVariant(arr, target) },\n];\n\nexport const latest = implementations[implementations.length - 1];\n`;
}

function implTestCasesTs(problemName: string): string {
  return `import { TestCase } from "../../../utils/testRunner";\n\n// Test cases for ${problemName} (scaffold)\nexport const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [\n  { input: { arr: [1, 2, 3, 4], target: 3 }, expected: 2, description: "Find index of 3" },\n  { input: { arr: [10, 20, 30], target: 15 }, expected: -1, description: "Target not present" },\n];\n`;
}

function implVariantNaiveTs(): string {
  return `/**\n * naiveVariant: initial scaffold\n * Time: O(1) placeholder, Space: O(1) placeholder\n */\nexport function naiveVariant(arr: number[], target: number): number {\n  // TODO: implement\n  return -1;\n}\n`;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const problemsDir = path.join(repoRoot, 'problems');

  const name = await prompt('Problem name (e.g. "Longest Substring Without Repeating Characters"): ');
  if (!name) { console.error('Name cannot be empty.'); process.exit(1); }

  const defaultShort = toCamelCase(name);
  let short = await prompt(`Short name (folder, default: ${defaultShort}): `);
  if (!short) short = defaultShort;
  if (!short) { console.error('Short name cannot be empty.'); process.exit(1); }

  const problemRoot = path.join(problemsDir, short);
  if (await fileExists(problemRoot)) {
    console.error(`Problem already exists: problems/${short}`);
    process.exit(1);
  }

  // Create structure
  const implDir = path.join(problemRoot, 'impl');
  const variantsDir = path.join(implDir, 'variants');
  await ensureDir(variantsDir);

  // Write files
  await fs.writeFile(path.join(problemRoot, 'index.ts'), problemIndexTs(name), 'utf8');
  await fs.writeFile(path.join(problemRoot, 'compare.ts'), problemCompareTs(short), 'utf8');
  await fs.writeFile(path.join(implDir, 'index.ts'), implIndexTs(), 'utf8');
  await fs.writeFile(path.join(implDir, 'testCases.ts'), implTestCasesTs(name), 'utf8');
  await fs.writeFile(path.join(variantsDir, 'naive.ts'), implVariantNaiveTs(), 'utf8');

  console.log('\n✅ Problem scaffold created:');
  console.log(` - Folder: problems/${short}`);
  console.log(' - Files: index.ts, compare.ts, impl/index.ts, impl/testCases.ts, impl/variants/naive.ts');
  console.log('\nNext steps:');
  console.log(' - Update test cases to match your problem input/output.');
  console.log(' - Implement the naive variant and add more variants as needed.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
