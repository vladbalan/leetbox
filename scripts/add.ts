#!/usr/bin/env tsx

import { selectFromList } from './interactive';

async function main() {
  const pick = await selectFromList(['variant', 'problem'], { title: 'Select an add command' });
  if (!pick) return;
  switch (pick) {
    case 'variant':
      // @ts-ignore: tsx runtime allows importing .ts with NodeNext
      await import('./add-variant.ts');
      return;
    case 'problem':
      // @ts-ignore: tsx runtime allows importing .ts with NodeNext
      await import('./add-problem.ts');
      return;
    default:
      return;
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
