import { handleMcpTokenApi } from "@/cloudflare/mcp.mjs";
import { getLocalEnv, parseNextRequestSession } from "@/lib/local-d1";

async function dispatch(req: Request) {
  const session = await parseNextRequestSession(req);
  return handleMcpTokenApi(req, new URL(req.url), getLocalEnv(), session);
}

export async function GET(req: Request) {
  return dispatch(req);
}

export async function POST(req: Request) {
  return dispatch(req);
}

export async function DELETE(req: Request) {
  return dispatch(req);
}
