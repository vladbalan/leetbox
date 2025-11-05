#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import { selectFromList } from './interactive';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function listProblems(root: string): Promise<string[]> {
  const dir = path.join(root, 'problems');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

type VariantInfo = {
  name: string;            // implementations[].name
  func: string;            // e.g., hashVariant
  fileBase?: string;       // e.g., 'hash' from import path
};

async function parseImplIndex(implIndexPath: string): Promise<{ content: string; variants: VariantInfo[]; importMap: Record<string, string>; }>{
  const content = await fs.readFile(implIndexPath, 'utf8');

  // Build map funcName -> file base from imports
  const importMap: Record<string, string> = {};
  const importRe = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*"\.\/variants\/([A-Za-z0-9_-]+)"\s*;?/g;
  for (const m of content.matchAll(importRe)) {
    importMap[m[1]] = m[2];
  }

  // Extract implementations array body
  const implArrayRe = /export\s+const\s+implementations\s*=\s*\[([\s\S]*?)\];/m;
  const bodyMatch = content.match(implArrayRe);
  const body = bodyMatch ? bodyMatch[1] : '';

  const variants: VariantInfo[] = [];
  // Match entries like { name: "hash", fn: (arr: number[], target: number) => hashVariant(arr, target) },
  const entryRe = /\{\s*name:\s*"([^"]+)",\s*fn:\s*\([^)]*\)\s*=>\s*([A-Za-z0-9_]+)\([\s\S]*?\)\s*\}/g;
  for (const m of body.matchAll(entryRe)) {
    const name = m[1];
    const func = m[2];
    const fileBase = importMap[func];
    variants.push({ name, func, fileBase });
  }

  return { content, variants, importMap };
}

function removeImport(content: string, funcName: string, fileBase?: string): string {
  const re = new RegExp(`^.*import\\s*\\{\\s*${funcName}\\s*\\}\\s*from\\s*\\"\\.\\/variants\\/${fileBase ?? '[A-Za-z0-9_-]+'}\\";?\\r?\\n`, 'm');
  return content.replace(re, '');
}

function removeImplementationEntry(content: string, variantName: string, _funcName: string): string {
  // Target only the array body and filter out the exact named entry (names are unique in this repo)
  const arrayRe = /(export\s+const\s+implementations\s*=\s*\[)([\s\S]*?)(\]\s*;)/m;
  if (!arrayRe.test(content)) return content;

  return content.replace(arrayRe, (_full, head: string, body: string, tail: string) => {
    // Match each object entry (one per line block), capturing the whole text and the name
    const entryRe = /(\n?\s*\{[\s\S]*?name:\s*"([^"]+)"[\s\S]*?\}\s*,?\s*)/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = entryRe.exec(body))) {
      // Append any text between previous match and this match (usually whitespace)
      result += body.slice(lastIndex, match.index);
      const full = match[1];
      const name = match[2];
      if (name !== variantName) {
        result += full; // keep this entry as-is
      }
      lastIndex = match.index + full.length;
    }
    // Append the remaining tail
    result += body.slice(lastIndex);

    // Cleanup stray commas before closing bracket and normalize spacing
    result = result.replace(/,\s*(\n?\s*)\]/g, '$1]');
    result = result.replace(/\n{3,}/g, '\n\n');

    return `${head}${result}${tail}`;
  });
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const problems = await listProblems(repoRoot);
  if (!problems.length) {
    console.error('No problems found in problems/.');
    process.exit(1);
  }

  const problem = await selectFromList(problems, { title: 'Select a problem to remove a variant from' });
  if (!problem) return;

  const implIndexPath = path.join(repoRoot, 'problems', problem, 'impl', 'index.ts');
  let parsed = await parseImplIndex(implIndexPath);
  if (!parsed.variants.length) {
    console.error('No variants found to remove.');
    return;
  }

  const items = parsed.variants.map(v => {
    const file = v.fileBase ? `${v.fileBase}.ts` : '(unknown file)';
    return `${v.name}  —  ${file}`;
  });
  const picked = await selectFromList(items, { title: `Select a variant to remove (${problem})` });
  if (!picked) return;
  const idx = items.indexOf(picked);
  const toRemove = parsed.variants[idx];

  const confirmed = (await prompt(`Remove variant "${toRemove.name}" from "${problem}"? [y/N]: `)).toLowerCase();
  if (confirmed !== 'y' && confirmed !== 'yes') {
    console.log('Aborted.');
    return;
  }

  // Delete file if known
  if (toRemove.fileBase) {
    const filePath = path.join(repoRoot, 'problems', problem, 'impl', 'variants', `${toRemove.fileBase}.ts`);
    try {
      await fs.unlink(filePath);
      console.log(`Deleted file: ${path.relative(repoRoot, filePath)}`);
    } catch (e: any) {
      if (e?.code !== 'ENOENT') throw e;
      console.log('File already missing, continuing.');
    }
  }

  // Update impl/index.ts: remove import and implementation entry
  let updated = parsed.content;
  updated = removeImport(updated, toRemove.func, toRemove.fileBase);
  updated = removeImplementationEntry(updated, toRemove.name, toRemove.func);

  if (updated !== parsed.content) {
    await fs.writeFile(implIndexPath, updated, 'utf8');
    console.log(`Updated: ${path.relative(repoRoot, implIndexPath)}`);
  } else {
    console.log('No changes made to impl/index.ts (entry not found).');
  }

  console.log('✅ Variant removed.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
