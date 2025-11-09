#!/usr/bin/env tsx

import { selectFromList } from './interactive';

async function main() {
  const pick = await selectFromList(['variant', 'problem'], { title: 'Select a remove command' });
  if (!pick) return;
  switch (pick) {
    case 'variant':
      await import('./remove-variant.js');
      return;
    case 'problem':
      await import('./remove-problem.js');
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
