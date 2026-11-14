import { handleOAuthRequest } from "@/cloudflare/oauth.mjs";
import { getLocalEnv, parseNextRequestSession } from "@/lib/local-d1";

async function dispatch(req: Request) {
  return handleOAuthRequest(req, new URL(req.url), getLocalEnv(), {
    parseSessionFn: parseNextRequestSession,
  });
}

export async function GET(req: Request) {
  return dispatch(req);
}

export async function POST(req: Request) {
  return dispatch(req);
}

export async function OPTIONS(req: Request) {
  return dispatch(req);
}
