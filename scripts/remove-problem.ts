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

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const problems = await listProblems(repoRoot);
  if (!problems.length) {
    console.error('No problems found in problems/.');
    process.exit(1);
  }

  const problem = await selectFromList(problems, { title: 'Select a problem to remove' });
  if (!problem) return;

  const confirmed = (await prompt(`Remove entire problem folder "problems/${problem}"? This cannot be undone. [y/N]: `)).toLowerCase();
  if (confirmed !== 'y' && confirmed !== 'yes') {
    console.log('Aborted.');
    return;
  }

  const problemRoot = path.join(repoRoot, 'problems', problem);
  // Remove the directory tree
  await fs.rm(problemRoot, { recursive: true, force: true });

  console.log('✅ Problem removed: problems/' + problem);
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error(`Unknown error: ${String(err)}`);
  }
  process.exit(1);
});
