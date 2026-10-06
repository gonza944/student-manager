import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

try {
  if (git("status", "--porcelain", "--untracked-files=all").trim()) {
    throw new Error(
      "Mutation diff requires a clean working tree: <base>...HEAD excludes staged, unstaged, and untracked changes.",
    );
  }

  const base = process.argv[2] ?? git("symbolic-ref", "--short", "refs/remotes/origin/HEAD").trim();
  if (process.argv.length > 3 || base.startsWith("-")) {
    throw new Error("Usage: npm run mutation:diff -- <review-base>");
  }
  git("rev-parse", "--verify", `${base}^{commit}`);
  const files = git("diff", "--name-only", "-z", "--diff-filter=ACMRTUXB", `${base}...HEAD`, "--")
    .split("\0")
    .filter((file) => /^(app|components|lib)\/[\s\S]*\.(ts|tsx|js|jsx)$/.test(file))
    .filter((file) => !/(^|\/)(__tests__|__mocks__|fixtures|generated|migrations)\//.test(file))
    .filter((file) => !/\.(test|spec)\.(ts|tsx|js|jsx)$|\.d\.ts$|(^|\/)index\.(ts|tsx|js|jsx)$/.test(file));

  if (!files.length) {
    console.log(`No changed production files to mutate against ${base}.`);
  } else {
    for (const file of files) {
      if (/[,\\:]/.test(file)) {
        throw new Error(`Cannot safely express this filename as a Stryker mutation pattern: ${JSON.stringify(file)}`);
      }
    }
    const patterns = files.map((file) => file.replace(/[!*?\[\]{}()]/g, (character) => `[${character}]`));
    const cli = fileURLToPath(new URL("../node_modules/@stryker-mutator/core/bin/stryker.js", import.meta.url));
    // Command runner cannot detect test changes: force execution while preserving reports.
    const result = spawnSync(process.execPath, [cli, "run", "--incremental", "--force", "--mutate", patterns.join(",")], {
      stdio: "inherit",
      shell: false,
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
