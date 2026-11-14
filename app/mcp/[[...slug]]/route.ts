import { handleMcpRequest } from "@/cloudflare/mcp.mjs";
import { getLocalEnv } from "@/lib/local-d1";

async function dispatch(
  req: Request,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await context.params;
  const targetUsername = slug && slug[0] ? slug[0] : null;
  const directToken = slug && slug[1] ? slug[1] : null;
  return handleMcpRequest(req, getLocalEnv(), targetUsername, directToken);
}

export async function GET(req: Request, context: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(req, context);
}

export async function POST(req: Request, context: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(req, context);
}

export async function DELETE(req: Request, context: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(req, context);
}

export async function OPTIONS(req: Request, context: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(req, context);
}
