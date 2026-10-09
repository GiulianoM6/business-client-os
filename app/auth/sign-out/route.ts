import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const requestUrl = new URL(request.url);
  const appOrigin =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1"
      ? requestUrl.origin
      : "https://www.businessclientos.com";

  return NextResponse.redirect(new URL("/auth/login", appOrigin), 303);
}
