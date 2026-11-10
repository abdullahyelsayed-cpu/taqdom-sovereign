import { NextRequest, NextResponse } from "next/server";
import { validateUsername } from "@/lib/types";
import { checkUsernameAvailability } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "";
  const validation = validateUsername(u);

  if (!validation.valid) {
    return NextResponse.json({
      username: validation.normalized,
      valid: false,
      available: false,
      isDemoAccount: false,
      reasonAr: validation.reasonAr,
      reasonEn: validation.reasonEn,
    });
  }

  const status = await checkUsernameAvailability(validation.normalized);
  return NextResponse.json({
    username: validation.normalized,
    valid: true,
    ...status,
  });
}
