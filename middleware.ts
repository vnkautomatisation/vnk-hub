import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/orders") ||
    req.nextUrl.pathname.startsWith("/products") ||
    req.nextUrl.pathname.startsWith("/stores") ||
    req.nextUrl.pathname.startsWith("/team") ||
    req.nextUrl.pathname.startsWith("/analytics") ||
    req.nextUrl.pathname.startsWith("/settings");

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
