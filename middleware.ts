import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/tools"];

export async function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "__Secure-next-auth.session-token",
  });

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tools/:path*"],
};
