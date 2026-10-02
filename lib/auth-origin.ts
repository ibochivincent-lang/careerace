/**
 * Universal origin resolver for authentication redirects.
 * Guarantees confirmation, reset, and OAuth links never land on localhost.
 */
export function getAuthRedirectOrigin(req?: Request): string {
  // 1. Explicit environment variable if set to a real production URL
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
    return appUrl;
  }

  // 2. Incoming request headers (e.g. Vercel deployment hostname)
  if (req) {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const rawHost = req.headers.get("host");
    const host = (forwardedHost || rawHost || "").trim();

    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const proto = req.headers.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
  }

  // 3. Fallback to production Vercel app
  return "https://careerace.vercel.app";
}
