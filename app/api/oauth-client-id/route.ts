import { NextResponse } from "next/server";

export async function GET() {
  // OAuth client IDs are public browser identifiers. Keep an env override for deployments,
  // but use the project's configured client so sign-in also works without extra setup.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "483485079124-ojo8q3jc13q7qj63g8tfgl6705aotd1n.apps.googleusercontent.com";
  return NextResponse.json({ clientId });
}
