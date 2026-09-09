// Erzeugt die App Symbole als PNG, ohne externe Abhängigkeiten.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const stroke = size * 0.085;

  // Häkchen in relativen Koordinaten
  const a = [size * 0.28, size * 0.52];
  const b = [size * 0.44, size * 0.68];
  const c = [size * 0.73, size * 0.34];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = (x / size + y / size) / 2;
      // Verlauf von Blau nach Violett
      let r = Math.round(10 + t * 152);
      let g = Math.round(124 - t * 35);
      let bl = Math.round(255 - t * 0);

      const distance = Math.min(
        distanceToSegment(x, y, a[0], a[1], b[0], b[1]),
        distanceToSegment(x, y, b[0], b[1], c[0], c[1]),
      );
      if (distance < stroke / 2) {
        r = 255;
        g = 255;
        bl = 255;
      } else if (distance < stroke / 2 + 1.2) {
        const blend = 1 - (distance - stroke / 2) / 1.2;
        r = Math.round(r + (255 - r) * blend);
        g = Math.round(g + (255 - g) * blend);
        bl = Math.round(bl + (255 - bl) * blend);
      }

      const offset = (y * size + x) * 4;
      rgba[offset] = r;
      rgba[offset + 1] = g;
      rgba[offset + 2] = bl;
      rgba[offset + 3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });

const targets = [
  [192, "public/icons/icon-192.png"],
  [512, "public/icons/icon-512.png"],
  [180, "public/icons/icon-180.png"],
  [192, "app/icon.png"],
  [180, "app/apple-icon.png"],
];

for (const [size, target] of targets) {
  writeFileSync(new URL(`../${target}`, import.meta.url), drawIcon(size));
  console.log("erstellt:", target);
}
