// scripts/build-cloudflare.mjs — Packages Next.js build into .cf-assets for Cloudflare Workers
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".cf-assets");

function copyDirRecursive(src, dest, excludeDirs = new Set()) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (excludeDirs.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyAppServerPages(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (
        !entry.name.endsWith(".segments") &&
        entry.name !== "robots.txt" &&
        entry.name !== "sitemap.xml" &&
        entry.name !== "api"
      ) {
        copyAppServerPages(srcPath, destPath);
      }
    } else if (entry.name.endsWith(".html") || entry.name.endsWith(".rsc")) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Preparing .cf-assets for Cloudflare Workers deployment...");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1. Copy public/* (excluding screenshots to keep upload fast)
copyDirRecursive(path.join(ROOT, "public"), OUT, new Set(["screenshots"]));

// 2. Copy .next/static -> .cf-assets/_next/static
copyDirRecursive(
  path.join(ROOT, ".next/static"),
  path.join(OUT, "_next/static")
);

// 3. Copy pre-rendered HTML & RSC payloads from .next/server/app
const appServer = path.join(ROOT, ".next/server/app");
copyAppServerPages(appServer, OUT);

// 4. Copy robots.txt and sitemap.xml bodies
const robotsBody = path.join(appServer, "robots.txt.body");
if (fs.existsSync(robotsBody)) {
  fs.copyFileSync(robotsBody, path.join(OUT, "robots.txt"));
}
const sitemapBody = path.join(appServer, "sitemap.xml.body");
if (fs.existsSync(sitemapBody)) {
  fs.copyFileSync(sitemapBody, path.join(OUT, "sitemap.xml"));
}
const notFoundHtml = path.join(appServer, "_not-found.html");
if (fs.existsSync(notFoundHtml)) {
  fs.copyFileSync(notFoundHtml, path.join(OUT, "404.html"));
}

console.log(".cf-assets packaged successfully!");
