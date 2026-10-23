import { db } from "@/db";
import { weeklyCheckins } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
const VIEWS = ["front", "side", "back"];
const notFound = () => new Response("Not found", { status: 404 });

// Serves one progress photo as a real image, so the main data response never carries photo data.
// Protected by the password proxy like every other /api route.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; view: string }> }) {
  const { id, view } = await params;
  const checkinId = Number(id);
  if (!Number.isInteger(checkinId) || checkinId <= 0 || !VIEWS.includes(view)) return notFound();
  try {
    const [row] = await db
      .select({ photo: sql<string | null>`${weeklyCheckins.photos} ->> ${view}::text` })
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.id, checkinId))
      .limit(1);
    const photo = row?.photo;
    const header = photo ? /^data:(image\/(?:jpeg|png|webp));base64,/.exec(photo) : null;
    if (!photo || !header) return notFound();
    const bytes = new Uint8Array(Buffer.from(photo.slice(header[0].length), "base64"));
    return new Response(bytes, {
      headers: {
        "Content-Type": header[1],
        // Check-in photos never change, so the phone can keep them; "private" keeps them out of shared caches.
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Photo GET error", error);
    return new Response("Unable to load photo", { status: 500 });
  }
}
