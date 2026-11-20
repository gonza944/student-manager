import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("mutation diff keeps filenames intact, excludes tests, and rejects dirty or ambiguous scopes", () => {
  const root = mkdtempSync(join(tmpdir(), "stryker-diff-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const commit = () => {
    git("add", ".");
    git("-c", "user.name=Mutation test", "-c", "user.email=mutation@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture");
  };
  const run = (base: string) => spawnSync(process.execPath, ["scripts/stryker-diff.mjs", base], { cwd: root, encoding: "utf8" });
  try {
    mkdirSync(join(root, "scripts"));
    copyFileSync("scripts/stryker-diff.mjs", join(root, "scripts/stryker-diff.mjs"));
    const bin = join(root, "node_modules/@stryker-mutator/core/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(root, ".gitignore"), "node_modules/\n");
    writeFileSync(join(bin, "stryker.js"), "console.log(JSON.stringify(process.argv.slice(2)));\n");
    git("init", "-q");
    commit();
    const base = git("rev-parse", "HEAD").trim();
    assert.match(run(base).stdout, /No changed production files/);
    mkdirSync(join(root, "lib"));
    const filename = "lib/space and\nnewline.ts";
    writeFileSync(join(root, filename), "export const value = 1;\n");
    writeFileSync(join(root, "lib/value.test.ts"), "// excluded\n");
    writeFileSync(join(root, "lib/types.d.ts"), "// excluded\n");
    const dirty = run(base);
    assert.equal(dirty.status, 1);
    assert.match(dirty.stderr, /clean working tree/);
    commit();
    const clean = run(base);
    assert.equal(clean.status, 0, clean.stderr);
    assert.deepEqual(JSON.parse(clean.stdout), ["run", "--incremental", "--force", "--mutate", filename]);
    mkdirSync(join(root, "app/[studentId]/(.)edit"), { recursive: true });
    writeFileSync(join(root, "app/[studentId]/(.)edit/page.tsx"), "export const value = 1;\n");
    commit();
    const route = run(base);
    assert.equal(route.status, 0, route.stderr);
    assert.equal(JSON.parse(route.stdout).at(-1), `app/[[]studentId[]]/[(].[)]edit/page.tsx,${filename}`);
    writeFileSync(join(root, "lib/comma,name.ts"), "export const value = 2;\n");
    commit();
    const ambiguous = run(base);
    assert.equal(ambiguous.status, 1);
    assert.match(ambiguous.stderr, /Cannot safely express/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
