/**
 * Cursor/IDE 터미널에서 PATH에 cargo가 없을 때를 위해
 * .cargo\bin을 PATH 앞에 넣은 뒤 tauri dev 실행
 */
import { spawnSync } from "child_process";
import path from "path";

const cargoBin =
  process.env.USERPROFILE || process.env.HOME
    ? path.join(process.env.USERPROFILE || process.env.HOME || "", ".cargo", "bin")
    : "";

if (cargoBin) {
  const sep = process.platform === "win32" ? ";" : ":";
  process.env.PATH = `${cargoBin}${sep}${process.env.PATH || ""}`;
}

const args = process.argv.slice(2);
const result = spawnSync("npx", ["tauri", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
