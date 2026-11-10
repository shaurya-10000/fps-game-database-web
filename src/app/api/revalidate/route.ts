import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Next 16 requires a cache-life profile as the second argument.
// "max" expires the tag immediately, which is what we want for a manual bust.
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  if (!tag) {
    return NextResponse.json(
      { error: "Missing ?tag= parameter" },
      { status: 400 },
    );
  }
  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: tag });
}