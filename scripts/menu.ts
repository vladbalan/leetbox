#!/usr/bin/env tsx

import { selectFromList } from './interactive';

async function main() {
  const pick = await selectFromList(['latest', 'compare', 'add', 'remove'], { title: 'Select a command' });
  if (!pick) return;
  switch (pick) {
    case 'latest':
      // @ts-ignore NodeNext+tsx
      await import('./latest.ts');
      return;
    case 'compare':
      // @ts-ignore NodeNext+tsx
      await import('./compare.ts');
      return;
    case 'add':
      // @ts-ignore NodeNext+tsx
      await import('./add.ts');
      return;
    case 'remove':
      // @ts-ignore NodeNext+tsx
      await import('./remove.ts');
      return;
    default:
      return;
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
