import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["ar", "en"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages live under /ar or /en. Send everything else to the visitor's language.
  const first = pathname.split("/")[1];
  if (!LANGS.includes(first)) {
    const accept = request.headers.get("accept-language") ?? "";
    const lang = /^\s*ar\b/i.test(accept) || /\bar\b/i.test(accept.split(",")[0]) ? "ar" : "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Keep the Supabase login session fresh.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();

  // Private pages need a session; the page itself checks again on the server.
  const isPrivate = /^\/(ar|en)\/(dashboard|jobs|billing)(\/|$)/.test(pathname);
  if (isPrivate && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/login`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Skip API routes, auth callback, Next internals and static files.
  matcher: ["/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)"],
};
