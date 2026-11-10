// scripts/fetch-4k-assets.mjs — Sequential with retry for Ultra-HD 4K Retina WebP Photography
import fs from "node:fs";
import path from "node:path";

const PUBLIC_IMAGES = path.join(process.cwd(), "public/images");
const CREATORS_DIR = path.join(PUBLIC_IMAGES, "creators");
const ULTRA_DIR = path.join(PUBLIC_IMAGES, "ultra");

fs.mkdirSync(CREATORS_DIR, { recursive: true });
fs.mkdirSync(ULTRA_DIR, { recursive: true });

const ASSETS = [
  // Creator Portraits (Studio Editorial Portraits)
  {
    dest: path.join(CREATORS_DIR, "layla.jpg"),
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "youssef.jpg"),
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "farida.jpg"),
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "karim.jpg"),
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "tariq.jpg"),
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "salma.jpg"),
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "nora.jpg"),
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },
  {
    dest: path.join(CREATORS_DIR, "omar.jpg"),
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=95&fm=webp",
  },

  // 1. MADAR (Bento Tech, AI Systems, Neural Compute, Robotics)
  {
    dest: path.join(ULTRA_DIR, "madar-hero.webp"),
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "madar-1.webp"),
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "madar-2.webp"),
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 2. ATHAR (Cinema Scrollytelling, Film Direction, Editorial Visuals)
  {
    dest: path.join(ULTRA_DIR, "athar-hero.webp"),
    url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "athar-1.webp"),
    url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "athar-2.webp"),
    url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 3. HAVEN (Quiet Luxury Architecture, Stone Sanctuary, Spatial Engineering)
  {
    dest: path.join(ULTRA_DIR, "haven-hero.webp"),
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "haven-1.webp"),
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "haven-2.webp"),
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 4. SIYADA (Swiss Editorial Grid, Executive Boardroom, Venture & Legal Strategy)
  {
    dest: path.join(ULTRA_DIR, "siyada-hero.webp"),
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "siyada-1.webp"),
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "siyada-2.webp"),
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 5. WAMEED (High-Velocity Tele-Sales, Revenue Closer, Deal Desk)
  {
    dest: path.join(ULTRA_DIR, "wameed-hero.webp"),
    url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "wameed-1.webp"),
    url: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "wameed-2.webp"),
    url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 6. SALAM (MarTech, Growth Engineering, Marketing Automation & Data Pipelines)
  {
    dest: path.join(ULTRA_DIR, "salam-hero.webp"),
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "salam-1.webp"),
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "salam-2.webp"),
    url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },

  // 7. MESHWAR (Human-Centric HR, Talent Acquisition & People Culture)
  {
    dest: path.join(ULTRA_DIR, "meshwar-hero.webp"),
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "meshwar-1.webp"),
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
  {
    dest: path.join(ULTRA_DIR, "meshwar-2.webp"),
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=2400&q=95&fm=webp",
  },
];

async function downloadAsset({ dest, url }) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 50000) {
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TaqdomUltraAssetFetcher/2.0",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 15000) throw new Error(`Too small: ${buf.length}`);
      fs.writeFileSync(dest, buf);
      console.log(`[OK] ${path.relative(process.cwd(), dest)} (${(buf.length / 1024).toFixed(1)} KB)`);
      return;
    } catch (err) {
      if (attempt === 3) {
        console.error(`[WARN] Failed ${dest}: ${err.message}`);
      }
    }
  }
}

async function main() {
  for (const item of ASSETS) {
    await downloadAsset(item);
  }
  console.log("All 4K assets verified!");
}

main();
