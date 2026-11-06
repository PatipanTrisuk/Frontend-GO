import { Link } from "@/i18n/navigation";

export const instant = false;

export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-primary px-4 text-center">
            <h1 className="text-display-sm font-semibold text-primary">404</h1>
            <p className="text-md text-tertiary">This page could not be found.</p>
            <Link href="/login" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
                Back to login
            </Link>
        </main>
    );
}
