/**
 * Windows Tauri 빌드에 필요한 최소 icon.ico 생성
 * 16x16 32bpp 단일 프레임 ICO
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "src-tauri", "icons");
const outPath = path.join(iconsDir, "icon.ico");

const W = 16;
const H = 16;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const xorBytes = W * H * 4;
const andBytes = Math.ceil(W / 32) * 4 * H;
const dibSize = 40 + xorBytes + andBytes;
const offset = 6 + 16;
const entry = Buffer.alloc(16);
entry[0] = W;
entry[1] = H;
entry[2] = 0;
entry[3] = 0;
entry[4] = 1;
entry[5] = 0;
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(dibSize, 8);
entry.writeUInt32LE(offset, 12);

const biSize = 40;
const biWidth = W;
const biHeight = H * 2;
const biPlanes = 1;
const biBitCount = 32;
const biSizeImage = xorBytes + andBytes;

const info = Buffer.alloc(40);
info.writeUInt32LE(40, 0);
info.writeUInt32LE(biWidth, 4);
info.writeUInt32LE(biHeight, 8);
info.writeUInt16LE(biPlanes, 12);
info.writeUInt16LE(biBitCount, 14);
info.writeUInt32LE(biSizeImage, 20);

const xor = Buffer.alloc(xorBytes);
for (let i = 0; i < xorBytes; i += 4) {
  xor[i] = 0x33;
  xor[i + 1] = 0x99;
  xor[i + 2] = 0xff;
  xor[i + 3] = 0xff;
}

const and = Buffer.alloc(andBytes);
and.fill(0);

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
fs.writeFileSync(outPath, Buffer.concat([header, entry, info, xor, and]));
console.log("Created:", outPath);
