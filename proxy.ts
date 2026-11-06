import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
    // Skip API routes, Next internals, go-api proxy, and static files
    matcher: ["/((?!api|go-api|_next|_vercel|.*\\..*).*)"],
};
