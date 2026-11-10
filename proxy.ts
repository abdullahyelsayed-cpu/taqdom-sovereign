import { NextRequest, NextResponse } from "next/server";

const RESERVED = new Set([
  "www",
  "app",
  "api",
  "admin",
  "studio",
  "auth",
  "mail",
  "cdn",
  "static",
  "dashboard",
  "blog",
  "help",
  "status",
  "templates",
  "explore",
  "legal",
  "portfolio",
  "root",
  "support",
  "icon",
  "apple-icon",
  "opengraph-image",
]);

function parseHost(rawHost: string): { root: string | null; sub: string | null; isLocal: boolean } {
  const host = rawHost.toLowerCase().trim();

  // Check taqdom.me
  if (host === "taqdom.me") {
    return { root: "taqdom.me", sub: null, isLocal: false };
  }
  if (host.endsWith(".taqdom.me")) {
    const sub = host.slice(0, -".taqdom.me".length);
    return { root: "taqdom.me", sub, isLocal: false };
  }

  // Check localhost(:port) and lvh.me(:port)
  const localMatch = host.match(/^(?:([a-z0-9-]+)\.)?(localhost(?::\d+)?|lvh\.me(?::\d+)?)$/);
  if (localMatch) {
    return {
      root: localMatch[2],
      sub: localMatch[1] || null,
      isLocal: true,
    };
  }

  return { root: null, sub: null, isLocal: false };
}

export function proxy(req: NextRequest) {
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const url = req.nextUrl;
  const { pathname } = url;

  // Skip internal Next.js, API, and static media paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    /\.[a-zA-Z0-9]{2,5}$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const { root, sub, isLocal } = parseHost(rawHost);
  const proto = isLocal ? "http" : "https";

  // 1. www -> apex 308 redirect
  if (root && sub === "www") {
    return NextResponse.redirect(`${proto}://${root}${pathname}${url.search}`, 308);
  }

  // 2. Subdomain rewrite: username.taqdom.me -> internal /portfolio/username
  if (root && sub && !RESERVED.has(sub)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-taqdom-sub", sub);
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = `/portfolio/${sub}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Direct path access on apex (taqdom.me/portfolio/x, taqdom.me/@x, or taqdom.me/x) -> 308 redirect to x.taqdom.me
  if (root && !sub && !req.headers.get("x-taqdom-sub")) {
    const explicitMatch = pathname.match(/^\/(?:portfolio\/|@)([a-z0-9-]{3,30})\/?$/i);
    if (explicitMatch) {
      const targetUser = explicitMatch[1].toLowerCase();
      if (!RESERVED.has(targetUser) && !targetUser.startsWith("-") && !targetUser.endsWith("-")) {
        return NextResponse.redirect(`${proto}://${targetUser}.${root}/`, 308);
      }
    }

    const directUserMatch = pathname.match(/^\/([a-z0-9-]{3,30})\/?$/i);
    if (directUserMatch) {
      const candidate = directUserMatch[1].toLowerCase();
      if (!RESERVED.has(candidate) && !candidate.startsWith("-") && !candidate.endsWith("-")) {
        return NextResponse.redirect(`${proto}://${candidate}.${root}/`, 308);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
