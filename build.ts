// Builds src/ (TypeScript) and public/ (static assets) -> dist/
//   - src/**/*.ts    -> dist/**/*.js   (type stripping only, no bundling;  folder structure preserved)
//   - public/**/*    -> dist/**/*      (HTML, CSS, images, ... copied as-is)
//
// Run once:               deno task build
// Watch & rebuild on save: deno task dev
import { transpile } from "jsr:@deno/emit";

const ROOT_DIR = new URL("./", import.meta.url);
const SRC_DIR = new URL("./src/", ROOT_DIR);
const PUBLIC_DIR = new URL("./public/", ROOT_DIR);
const DIST_DIR = new URL("./dist/", ROOT_DIR);

await Deno.mkdir(DIST_DIR, { recursive: true });

// Recursively visits every file under `dir`, calling `onFile` with a path relative to `dir`.
async function walk(
  dir: URL,
  onFile: (relativePath: string) => Promise<void>,
  prefix = "",
) {
  for await (const entry of Deno.readDir(dir)) {
    const relativePath = prefix + entry.name;
    if (entry.isDirectory) {
      await walk(new URL(entry.name + "/", dir), onFile, relativePath + "/");
    } else {
      await onFile(relativePath);
    }
  }
}

// 1. Transpile every .ts file under src/, preserving its folder structure.
await walk(SRC_DIR, async (relativePath) => {
  if (!relativePath.endsWith(".ts")) return;

  const tsSrc = new URL(relativePath, SRC_DIR);
  const jsRelativePath = relativePath.replace(/\.ts$/, ".js");
  const jsOut = new URL(jsRelativePath, DIST_DIR);

  const result = await transpile(tsSrc);
  const code = result.get(tsSrc.href)!;

  await Deno.mkdir(new URL(".", jsOut), { recursive: true });
  await Deno.writeTextFile(jsOut, code);
  console.log(`Built dist/${jsRelativePath} from src/${relativePath}`);
});

// 2. Copy every file under public/ (HTML, CSS, images, ...) as-is.
await walk(PUBLIC_DIR, async (relativePath) => {
  const fileSrc = new URL(relativePath, PUBLIC_DIR);
  const fileOut = new URL(relativePath, DIST_DIR);

  await Deno.mkdir(new URL(".", fileOut), { recursive: true });
  await Deno.copyFile(fileSrc, fileOut);
  console.log(`Copied dist/${relativePath} from public/${relativePath}`);
});
