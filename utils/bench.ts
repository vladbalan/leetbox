import { TestCase } from "./testRunner";

// Minimal env typings to avoid adding @types/node
declare const process: any;
declare const performance: { now: () => number } | undefined;

export interface Implementation<A, B, R> {
  name: string;
  fn: (a: A, b: B) => R;
}

export interface BenchOptions {
  iterations?: number; // measured iterations (batches across all test cases)
  warmup?: number; // warmup iterations (not measured)
  quiet?: boolean; // temporarily silence console during runs
}

function nowNs(): bigint {
  if (typeof process !== "undefined" && process?.hrtime?.bigint) {
    return process.hrtime.bigint();
  }
  const ms = typeof performance !== "undefined" && performance ? performance.now() : Date.now();
  return BigInt(Math.floor(ms * 1_000_000));
}

function nsToMs(ns: bigint): number {
  return Number(ns) / 1_000_000;
}

function withQuiet<T>(quiet: boolean | undefined, run: () => T): T {
  if (!quiet) return run();
  const original = { ...console } as Partial<typeof console> & Record<string, any>;
  try {
    // no-op common console methods
    const noop = () => {};
    (console as any).log = noop;
    (console as any).info = noop;
    (console as any).warn = noop;
    (console as any).error = noop;
    (console as any).debug = noop;
    return run();
  } finally {
    // restore
    Object.assign(console, original);
  }
}

export function runComparison<A, B, R, TInput>(
  title: string,
  implementations: Implementation<A, B, R>[],
  testCases: TestCase<TInput, R>[],
  extractArgs: (input: TInput) => [A, B],
  options: BenchOptions = {}
): void {
  const iterations = options.iterations ?? 30;
  const warmup = options.warmup ?? 2;
  const quiet = options.quiet ?? true;

  console.log(`\n🚀 ${title}: comparison of ${implementations.length} implementation(s)`);
  console.log(`Cases: ${testCases.length} | Warmup: ${warmup} | Iterations: ${iterations}`);

  type Row = {
    name: string;
    pass: number;
    total: number;
    fail: number;
    totalMs: number;
    avgMsPerOp: number;
    ops: number;
  };

  const rows: Row[] = [];

  for (const impl of implementations) {
    // correctness check (single pass)
    let pass = 0;
    for (const tc of testCases) {
      const [a, b] = extractArgs(tc.input);
      const r = withQuiet(quiet, () => impl.fn(a, b));
      const ok = JSON.stringify(r) === JSON.stringify(tc.expected);
      if (ok) pass++;
    }

    // warmup
    withQuiet(quiet, () => {
      for (let i = 0; i < warmup; i++) {
        for (const tc of testCases) {
          const [a, b] = extractArgs(tc.input);
          impl.fn(a, b);
        }
      }
    });

    // measure
    const start = nowNs();
    withQuiet(quiet, () => {
      for (let i = 0; i < iterations; i++) {
        for (const tc of testCases) {
          const [a, b] = extractArgs(tc.input);
          impl.fn(a, b);
        }
      }
    });
    const end = nowNs();

    const ops = iterations * testCases.length;
    const totalMs = nsToMs(end - start);
    const avgMsPerOp = totalMs / ops;

    rows.push({
      name: impl.name,
      pass,
      total: testCases.length,
      fail: testCases.length - pass,
      totalMs: Number(totalMs.toFixed(3)),
      avgMsPerOp: Number(avgMsPerOp.toFixed(6)),
      ops,
    });
  }

  const best = Math.min(...rows.map((r) => r.avgMsPerOp));
  const table = rows.map((r) => ({
    Implementation: r.name,
    Pass: `${r.pass}/${r.total}`,
    Fail: r.fail,
    TotalMs: r.totalMs,
    AvgMsPerOp: r.avgMsPerOp,
    RelToBest: Number((r.avgMsPerOp / best).toFixed(2)),
  }));

  console.log("\n\n📊 Comparison Report");
  console.table(table);
}
