import { ImageResponse } from "next/og";

// App icons generated from code at build time (no image files needed in the repo).
// 180 = iPhone home screen, 192 + 512 = Android install.
const SIZES = [180, 192, 512];

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = SIZES.find((s) => String(s) === size) ?? 512;
  const mark = Math.round(px * 0.56); // pulse stays inside Android's "maskable" safe zone
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#193e34" }}>
        <svg width={mark} height={mark} viewBox="0 0 24 24" fill="none" stroke="#b9db7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
