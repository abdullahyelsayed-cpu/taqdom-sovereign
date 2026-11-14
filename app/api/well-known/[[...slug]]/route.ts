import { handleOAuthRequest } from "@/cloudflare/oauth.mjs";
import { getLocalEnv, parseNextRequestSession } from "@/lib/local-d1";

async function dispatch(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/well-known")) {
    url.pathname = "/.well-known" + url.pathname.slice("/api/well-known".length);
  }
  return handleOAuthRequest(req, url, getLocalEnv(), {
    parseSessionFn: parseNextRequestSession,
  });
}

export async function GET(req: Request) {
  return dispatch(req);
}

export async function OPTIONS(req: Request) {
  return dispatch(req);
}
