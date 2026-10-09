import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { authDestination } from "@/lib/commerce/auth-destination";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next");
  const next =
    requestedNext === "/auth/update-password"
      ? requestedNext
      : authDestination(requestedNext);

  const appOrigin =
    url.hostname === "localhost" || url.hostname === "127.0.0.1"
      ? url.origin
      : "https://www.businessclientos.com";
  const successUrl = new URL(next, appOrigin);
  const response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return response;
  }

  const errorUrl = new URL("/auth/login", appOrigin);
  errorUrl.searchParams.set("error", "callback_failed");
  errorUrl.searchParams.set("next", next);
  return NextResponse.redirect(errorUrl);
}
