#!/usr/bin/env tsx

import { selectFromList } from './interactive';

async function main() {
  const pick = await selectFromList(['latest', 'compare', 'add', 'remove'], { title: 'Select a command' });
  if (!pick) return;
  switch (pick) {
    case 'latest':
      await import('./latest.js');
      return;
    case 'compare':
      await import('./compare.js');
      return;
    case 'add':
      await import('./add.js');
      return;
    case 'remove':
      await import('./remove.js');
      return;
    default:
      return;
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
