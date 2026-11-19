import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { uploadUrl } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Returns a signed URL the browser uses to upload a video straight to R2. */
export async function POST(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const { filename, size, type } = await request.json().catch(() => ({}));
  if (typeof filename !== "string" || typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "Invalid file." }, { status: 400 });
  }
  if (typeof type !== "string" || !type.startsWith("video/")) {
    return NextResponse.json({ error: "Please upload a video file." }, { status: 400 });
  }

  const { data: profile } = await supabaseAdmin().from("profiles").select("plan").eq("id", userId).single();
  const plan = PLANS[(profile?.plan as PlanId) ?? "free"];
  if (size > plan.maxUploadMb * 1024 * 1024) {
    return NextResponse.json({ error: `Files can be up to ${plan.maxUploadMb} MB on your plan.` }, { status: 413 });
  }

  const ext = (filename.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? ".mp4").toLowerCase();
  const key = `uploads/${userId}/${crypto.randomUUID()}${ext}`;
  return NextResponse.json({ url: await uploadUrl(key, type, size), key });
}
