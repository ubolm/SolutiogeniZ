import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";

function buildLoginUrl(request: NextRequest) {
  const loginUrl = new URL("/crm/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath && nextPath !== "/crm/login") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(getCrmSessionCookieName())?.value;
  const session = await verifyCrmSessionToken(token);
  const isLoginPage = pathname === "/crm/login";
  const isCrmPage = pathname.startsWith("/crm");
  const isCrmApi = pathname.startsWith("/api/crm");

  if (!isCrmPage && !isCrmApi) {
    return NextResponse.next();
  }

  if (session) {
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/crm", request.url));
    }

    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.next();
  }

  if (isCrmApi) {
    return NextResponse.json(
      { error: "Sesion requerida para usar el CRM." },
      { status: 401 },
    );
  }

  return NextResponse.redirect(buildLoginUrl(request));
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*"],
};
