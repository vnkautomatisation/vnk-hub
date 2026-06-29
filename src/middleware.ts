import { auth } from "@/lib/auth";

const dashboardRoutes = ["/", "/orders", "/products", "/stores", "/team", "/analytics", "/settings"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isDashboard = dashboardRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
