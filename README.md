# LeetBox

A leetcode sandbox - Practice algorithm problems using Typescript with quick testing and micro‑benchmarks.

## Quick start (CLI)

Prefer the single `leetbox` command over long npm invocations.

```pwsh
# From the project root
npm install

# Expose the CLI (so you can run `leetbox`)
npm link

# Interactive menu (pick latest / compare / add / remove)
leetbox

# Direct commands (problem name optional; omitting opens a picker)
leetbox latest [problem]
leetbox compare [problem]

# Scaffolding
leetbox add              # interactive add (problem or variant)
leetbox add problem      # create a new problem folder with a naive variant
leetbox add variant      # add a new variant to an existing problem

# Cleanup
leetbox remove           # interactive remove (problem or variant)
leetbox remove problem   # delete an entire problem folder
leetbox remove variant   # delete a variant and unregister it

# Help
leetbox --help
```

## Local dev

Prerequisites: Node 22+ (and dev deps installed locally).

```pwsh
# Install dev deps used by the TypeScript runners
npm i -D tsx typescript @types/node

# Run tests / benchmarks (with or without a problem name)
npm run latest -- binarySearch
npm run compare -- binarySearch

# Omit the name to get an interactive picker
npm run latest
npm run compare

# Code quality (BiomeJS)
npm run lint      # Check for linting issues
npm run format    # Format code
npm run check     # Format + lint + auto-fix
npm run ci        # CI-mode check (no fixes applied)

# Testing
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

## CI/CD

GitHub Actions workflows are configured for:

- **CI** (`.github/workflows/ci.yml`): Runs on push/PR
  - Linting and formatting checks
  - Tests across Node.js 18.x, 20.x, 22.x
  - Coverage report generation

- **Code Quality** (`.github/workflows/code-quality.yml`): Runs on PRs
  - Coverage reports on pull requests
  - TypeScript type checking

- **Release** (`.github/workflows/release.yml`): Runs on version tags
  - Triggers on version tags (v*.*.*)
  - Creates GitHub releases with auto-generated notes

- **Dependabot** (`.github/dependabot.yml`):
  - Weekly dependency updates
  - GitHub Actions version updates

## Project layout

- problems/<name>/
  - index.ts: runs tests for the latest implementation of this problem
  - compare.ts: benchmarks all implementations for this problem
  - impl/
    - index.ts: imports variants, exports `implementations` (array of { name, fn }) and `latest`, and re‑exports `testCases`
    - testCases.ts: typed test cases (`TestCase<Input, Expected>[]`)
    - variants/*.ts: each variant exports a `<camel>Variant` function
- utils/: tiny test runner and benchmark harness
- scripts/: TypeScript CLIs for `latest`, `compare`, `add`, `remove` (used by `leetbox`)

## Add a new problem

Fastest: use the CLI scaffolder.

```pwsh
# Guided prompts: name + short folder
leetbox add problem
```

This creates:

- problems/<shortName>/index.ts
- problems/<shortName>/compare.ts
- problems/<shortName>/impl/index.ts
- problems/<shortName>/impl/testCases.ts
- problems/<shortName>/impl/variants/naive.ts

Edit `impl/testCases.ts` to match the problem. Implement `variants/naive.ts`, then add more variants as you iterate.

Manual route (if you prefer): mirror the structure above and ensure `impl/index.ts` exports:

- `export const implementations = [{ name, fn }, ...]`
- `export const latest = implementations[implementations.length - 1]`
- `export { testCases } from './testCases'`

## Add or remove a variant

```pwsh
# Add a variant to an existing problem (interactive problem picker)
leetbox add variant

# Remove a variant (also prunes the import and registry entry)
leetbox remove variant
```

The scaffolder writes `impl/variants/<camel>.ts` with a `<camel>Variant` function and appends it to the `implementations` array so it becomes the new `latest`.

## What’s included

- [x] Test harness: dependency‑free, default deep‑equality via JSON.stringify with an optional custom comparator
- [x] Bench harness: correctness check, warmups, quiet mode, high‑res timing, relative‑to‑best table
- [x] Interactive UX: pick a problem when you omit the name; add/remove problem and variant scaffolding
- [x] Time complexity benchmarks
- [ ] Space complexity benchmarks
- [x] TypeScript types for inputs and expected outputs (clean up the `any`'s)
- [x] CI/CD workflows: linting, formatting, tests, coverage, releases

## Master the fundamentals

If you are preparing for coding interviews, you should also check out [LeetTrivia](https://leettrivia.com/?source=leetbox) - an addictive trivia game that helps you master the fundamentals of coding, data structures, algorithms and more.

## License

MIT © Vlad Balan
