#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import { selectFromList } from './interactive';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function toCamelCase(input: string): string {
  const parts = input
    .replace(/[^A-Za-z0-9]+/g, ' ') // non-alnum -> spaces
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return [first.toLowerCase(), ...rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())].join('');
}

async function listProblems(root: string): Promise<string[]> {
  const dir = path.join(root, 'problems');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

async function detectReturnType(problemRoot: string): Promise<'number' | 'number[]' | 'unknown'> {
  // Inspect impl/testCases.ts; prefer concrete 'expected:' patterns for robustness
  const p = path.join(problemRoot, 'impl', 'testCases.ts');
  try {
    const content = await fs.readFile(p, 'utf8');
    // Look for first expected: ...
    const m = content.match(/expected\s*:\s*(\[[^\n]*\]|-?\d+)/);
    if (m) {
      const exp = m[1].trim();
      if (exp.startsWith('[')) return 'number[]';
      return 'number';
    }
    // Fallback to generic type detection
    const g = content.match(/TestCase\s*<\s*\{[^}]*\}\s*,\s*([^>\]]+)\s*>/);
    if (g) {
      const expected = g[1].replace(/\s+/g, '');
      if (expected === 'number[]') return 'number[]';
      if (expected === 'number') return 'number';
    }
  } catch {}
  return 'unknown';
}

function variantTemplate(fnName: string, returnType: 'number' | 'number[]' | 'unknown'): string {
  const isArray = returnType === 'number[]';
  const rt = returnType === 'unknown' ? 'number' : returnType; // fall back to number to align with existing patterns
  const defaultReturn = isArray ? '[-1, -1]' : '-1';
  return `/**\n * ${fnName}: new variant\n * Time: O(1) placeholder, Space: O(1) placeholder\n */\nexport function ${fnName}(arr: number[], target: number): ${rt} {\n  // TODO: implement\n  // Keep signature aligned with other variants (arr: number[], target: number)\n  return ${defaultReturn};\n}\n`;
}

async function addImportAndImplementation(implIndexPath: string, camel: string): Promise<void> {
  const content = await fs.readFile(implIndexPath, 'utf8');
  const importLine = `import { ${camel}Variant } from "./variants/${camel}";`;

  let updated = content;
  if (!content.includes(importLine)) {
    // Insert new import before the testCases export to keep grouping with imports
    updated = updated.replace(
      /(export\s+\{\s*testCases\s*\}\s+from\s+"\.\/testCases";)/,
      `${importLine}\n$1`
    );
  }

  // Insert new implementation entry at the END of the array so it becomes the new latest
  const implArrayRegex = /(export\s+const\s+implementations\s*=\s*\[)([\s\S]*?)(\];)/;
  const m = updated.match(implArrayRegex);
  if (!m) throw new Error('Could not locate implementations array in impl/index.ts');

  const [full, head, body, tail] = m;
  const indentMatch = body.match(/\n(\s*)\{/);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const eol = /\r\n/.test(content) ? "\r\n" : "\n";
  // Trim trailing whitespace/newlines in body to avoid extra blank lines, then ensure one separator
  const bodyTrimmed = body.replace(/\s*$/, "");
  const sep = bodyTrimmed.length ? eol : "";
  const newItem = `${indent}{ name: \"${camel}\", fn: (arr: number[], target: number) => ${camel}Variant(arr, target) },${eol}`;
  const newBody = bodyTrimmed + sep + newItem; // append with normalized spacing

  updated = updated.replace(implArrayRegex, `${head}${newBody}${tail}`);

  if (updated !== content) {
    await fs.writeFile(implIndexPath, updated, 'utf8');
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const probs = await listProblems(repoRoot);
  if (probs.length === 0) {
    console.error('No problems found in problems/');
    process.exit(1);
  }

  const problem = await selectFromList(probs, { title: 'Select a problem to add a variant to' });
  if (!problem) {
    console.log('No selection made. Exiting.');
    return;
  }
  const problemRoot = path.join(repoRoot, 'problems', problem);

  let rawName = '';
  while (!rawName) {
    rawName = await prompt('Variant name (e.g. "Brute force"): ');
    if (!rawName) console.log('Name cannot be empty.');
  }

  const camel = toCamelCase(rawName);
  if (!camel) {
    console.error('Could not derive a valid camelCase name from input.');
    process.exit(1);
  }

  const fnName = `${camel}Variant`;
  const variantsDir = path.join(problemRoot, 'impl', 'variants');
  const variantPath = path.join(variantsDir, `${camel}.ts`);

  // Safety checks
  try {
    await fs.access(variantPath);
    console.error(`Variant file already exists: ${path.relative(repoRoot, variantPath)}`);
    process.exit(1);
  } catch {}

  const returnType = await detectReturnType(problemRoot);
  const template = variantTemplate(fnName, returnType);

  // Write file
  await fs.mkdir(variantsDir, { recursive: true });
  await fs.writeFile(variantPath, template, 'utf8');

  // Wire into impl/index.ts
  const implIndexPath = path.join(problemRoot, 'impl', 'index.ts');
  await addImportAndImplementation(implIndexPath, camel);

  console.log('\n✅ Variant scaffold created:');
  console.log(` - File: ${path.relative(repoRoot, variantPath)}`);
  console.log(` - Function: ${fnName}`);
  console.log(` - Registered in: ${path.relative(repoRoot, implIndexPath)} (appended as new latest)`);
  console.log('\nNext steps: implement your algorithm in the new file.');
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error(`Unknown error: ${String(err)}`);
  }
  process.exit(1);
});
