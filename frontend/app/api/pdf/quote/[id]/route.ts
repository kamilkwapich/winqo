import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get("authorization") || "";
  const host = req.nextUrl.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const candidates = [
    process.env.BACKEND_INTERNAL_URL,
    isLocal ? "http://localhost:8100" : null,
    process.env.NEXT_PUBLIC_API_BASE,
    "http://backend:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
  ].filter(Boolean) as string[];

  const errors: string[] = [];

  for (const base of candidates) {
    const baseUrl = base.replace(/\/$/, "");
    const search = req.nextUrl.search || "";
    const target = `${baseUrl}/pdf/quote/${params.id}${search}`;
    try {
      const res = await fetch(target, {
        headers: {
          Authorization: auth,
          "X-Lang": req.headers.get("x-lang") || "",
          "Accept-Language": req.headers.get("accept-language") || "",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        errors.push(`${target}: HTTP ${res.status} ${text}`);
        continue;
      }

      const buf = await res.arrayBuffer();
      const headers = new Headers();
      headers.set("content-type", res.headers.get("content-type") || "application/pdf");
      const cd = res.headers.get("content-disposition");
      if (cd) headers.set("content-disposition", cd);

      return new NextResponse(buf, { status: res.status, headers });
    } catch (err: any) {
      errors.push(`${target}: ${err?.message || "fetch failed"}`);
    }
  }

  return new NextResponse(`PDF fetch failed. Tried: ${errors.join(" | ")}`, { status: 502 });
}
