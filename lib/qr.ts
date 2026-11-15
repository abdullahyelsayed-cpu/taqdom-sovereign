// Deterministic ISO/IEC 18004 QR Code matrix & SVG generator (Byte mode, EC Level M, Versions 1..9)

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(ecCount: number): number[] {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Array<number>(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// Version 1..9, EC Level M: [totalDataCodewords, numBlocks1, dataCwPerBlock1, ecCwPerBlock, alignCoords]
// Versions 1..5 use single group; 6..9 may have group1+group2 — specify exact block groups cleanly:
interface QrVersionSpec {
  version: number;
  size: number;
  maxBytes: number;
  totalData: number;
  ecPerBlock: number;
  groups: [number, number][]; // [blocks, dataCwPerBlock]
  align: number[];
}

const QR_M_SPECS: QrVersionSpec[] = [
  { version: 1, size: 21, maxBytes: 14, totalData: 16, ecPerBlock: 10, groups: [[1, 16]], align: [] },
  { version: 2, size: 25, maxBytes: 26, totalData: 28, ecPerBlock: 16, groups: [[1, 28]], align: [6, 18] },
  { version: 3, size: 29, maxBytes: 42, totalData: 44, ecPerBlock: 26, groups: [[1, 44]], align: [6, 22] },
  { version: 4, size: 33, maxBytes: 62, totalData: 64, ecPerBlock: 18, groups: [[2, 32]], align: [6, 26] },
  { version: 5, size: 37, maxBytes: 84, totalData: 86, ecPerBlock: 24, groups: [[2, 43]], align: [6, 30] },
  { version: 6, size: 41, maxBytes: 106, totalData: 108, ecPerBlock: 16, groups: [[4, 27]], align: [6, 34] },
  { version: 7, size: 45, maxBytes: 122, totalData: 124, ecPerBlock: 18, groups: [[4, 31]], align: [6, 22, 38] },
  { version: 8, size: 49, maxBytes: 152, totalData: 154, ecPerBlock: 22, groups: [[2, 38], [2, 39]], align: [6, 24, 42] },
  { version: 9, size: 53, maxBytes: 180, totalData: 182, ecPerBlock: 22, groups: [[3, 36], [2, 37]], align: [6, 26, 46] },
];

const REMAINDER_BITS = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0];

function formatInfoBits(maskId: number): number {
  // EC Level M = 00
  const data = (0b00 << 3) | (maskId & 0x7);
  let rem = data << 10;
  const poly = 0x537;
  for (let bit = 14; bit >= 10; bit--) {
    if ((rem >> bit) & 1) rem ^= poly << (bit - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text || "https://taqdom.me");
  const spec =
    QR_M_SPECS.find((s) => utf8.length <= s.maxBytes) ||
    QR_M_SPECS[QR_M_SPECS.length - 1];
  const payload = utf8.slice(0, spec.maxBytes);

  // Build bit stream: Mode 0100 + 8-bit count + data + terminator + pad to byte + 0xEC/0x11
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4);
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);
  const maxBits = spec.totalData * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataCw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCw.push(byte);
  }

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, size] of spec.groups) {
    for (let b = 0; b < count; b++) {
      const slice = dataCw.slice(offset, offset + size);
      offset += size;
      dataBlocks.push(slice);
      ecBlocks.push(rsEncode(slice, spec.ecPerBlock));
    }
  }

  const codewords: number[] = [];
  const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) if (i < blk.length) codewords.push(blk[i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const blk of ecBlocks) codewords.push(blk[i]);
  }

  const streamBits: number[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) streamBits.push((cw >> i) & 1);
  }
  for (let i = 0; i < REMAINDER_BITS[spec.version]; i++) streamBits.push(0);

  const n = spec.size;
  const grid: (boolean | null)[][] = Array.from({ length: n }, () => Array<boolean | null>(n).fill(null));
  const isFunc: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return;
    grid[r][c] = val;
    isFunc[r][c] = true;
  };

  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || c < 0 || r >= n || c >= n) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const isDark =
          inOuter &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setFunc(r, c, isDark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    const dark = i % 2 === 0;
    if (!isFunc[6][i]) setFunc(6, i, dark);
    if (!isFunc[i][6]) setFunc(i, 6, dark);
  }

  for (const rCenter of spec.align) {
    for (const cCenter of spec.align) {
      if (isFunc[rCenter][cCenter]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunc(rCenter + dr, cCenter + dc, isDark);
        }
      }
    }
  }

  // Dark module
  setFunc(4 * spec.version + 9, 8, true);

  // Reserve format info coordinates
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      if (!isFunc[8][i]) setFunc(8, i, false);
      if (!isFunc[i][8]) setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunc[8][n - 1 - i]) setFunc(8, n - 1 - i, false);
  }
  for (let i = 0; i < 7; i++) {
    if (!isFunc[n - 1 - i][8]) setFunc(n - 1 - i, 8, false);
  }

  // Place data bits in upward/downward zigzag
  let bitIdx = 0;
  let upward = true;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < n; step++) {
      const r = upward ? n - 1 - step : step;
      for (const dc of [0, -1]) {
        const c = right + dc;
        if (!isFunc[r][c]) {
          grid[r][c] = bitIdx < streamBits.length ? streamBits[bitIdx] === 1 : false;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  const maskCondition = (maskId: number, r: number, c: number): boolean => {
    switch (maskId) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  };

  const applyFormat = (mat: boolean[][], maskId: number) => {
    const fmt = formatInfoBits(maskId);
    for (let i = 0; i <= 5; i++) {
      const bit = Boolean((fmt >> i) & 1);
      mat[8][i] = bit;
      mat[n - 1 - i][8] = bit;
    }
    const b6 = Boolean((fmt >> 6) & 1);
    const b7 = Boolean((fmt >> 7) & 1);
    const b8 = Boolean((fmt >> 8) & 1);
    mat[8][7] = b6;
    mat[n - 7][8] = b6;
    mat[8][8] = b7;
    mat[8][n - 8] = b7;
    mat[7][8] = b8;
    mat[8][n - 7] = b8;
    for (let i = 9; i < 15; i++) {
      const bit = Boolean((fmt >> i) & 1);
      mat[14 - i][8] = bit;
      mat[8][n - 15 + i] = bit;
    }
  };

  const scoreMatrix = (mat: boolean[][]): number => {
    let score = 0;
    for (let r = 0; r < n; r++) {
      let runLen = 1;
      for (let c = 1; c < n; c++) {
        if (mat[r][c] === mat[r][c - 1]) runLen++;
        else {
          if (runLen >= 5) score += 3 + (runLen - 5);
          runLen = 1;
        }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let c = 0; c < n; c++) {
      let runLen = 1;
      for (let r = 1; r < n; r++) {
        if (mat[r][c] === mat[r - 1][c]) runLen++;
        else {
          if (runLen >= 5) score += 3 + (runLen - 5);
          runLen = 1;
        }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        const v = mat[r][c];
        if (mat[r][c + 1] === v && mat[r + 1][c] === v && mat[r + 1][c + 1] === v) score += 3;
      }
    }
    return score;
  };

  let bestMatrix: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let maskId = 0; maskId < 8; maskId++) {
    const candidate: boolean[][] = grid.map((row, r) =>
      row.map((val, c) => {
        const dark = Boolean(val);
        return isFunc[r][c] ? dark : maskCondition(maskId, r, c) ? !dark : dark;
      })
    );
    applyFormat(candidate, maskId);
    const pen = scoreMatrix(candidate);
    if (pen < bestScore) {
      bestScore = pen;
      bestMatrix = candidate;
    }
  }

  return bestMatrix || grid.map((row) => row.map(Boolean));
}

export function qrMatrixToSvgPath(matrix: boolean[][], quietZone = 2): { viewBoxSize: number; path: string } {
  const n = matrix.length;
  const total = n + quietZone * 2;
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!matrix[r][c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < n && matrix[r][c]) c++;
      const w = c - start;
      parts.push(`M${start + quietZone},${r + quietZone}h${w}v1h-${w}z`);
    }
  }
  return { viewBoxSize: total, path: parts.join("") };
}
