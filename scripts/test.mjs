/**
 * 用 esbuild 把 tests/accumulation/entry.mjs 打成临时 bundle，再交给 node --test。
 * 不引入 vitest/jest —— 本仓库的依赖表里没有测试框架，也不该为它加一个。
 */
import esbuild from "esbuild";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "..");

const outDir = mkdtempSync(join(tmpdir(), "fd-acc-test-"));
const outfile = join(outDir, "bundle.mjs");

await esbuild.build({
  entryPoints: [join(root, "tests/accumulation/entry.mjs")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile,
  logLevel: "warning",
  alias: { obsidian: join(root, "tests/stubs/obsidian.mjs") },
});

const testDir = join(root, "tests/accumulation");
const files = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => join(testDir, name));

if (files.length === 0) {
  console.error("no test files found");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  env: { ...process.env, ACC_BUNDLE: outfile },
});

process.exit(result.status ?? 1);
