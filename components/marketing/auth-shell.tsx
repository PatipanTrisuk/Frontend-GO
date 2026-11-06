"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Grid } from "@/components/shared-assets/background-patterns/grid";

type AuthShellProps = PropsWithChildren<{
    title: string;
    description?: string;
    footer?: ReactNode;
}>;

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
    const t = useTranslations("app");

    return (
        <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-secondary px-4 py-12">
            <div className="pointer-events-none absolute inset-0 text-fg-quaternary opacity-40" suppressHydrationWarning>
                <Grid size="md" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold text-brand-secondary">{t("name")}</p>
                    <h1 className="mt-2 text-display-xs font-semibold text-primary">{title}</h1>
                    {description ? <p className="mt-2 text-md text-tertiary">{description}</p> : null}
                </div>

                <div className="rounded-2xl bg-primary p-6 shadow-lg ring-1 ring-secondary sm:p-8">{children}</div>

                {footer ? <div className="mt-6 text-center text-sm text-tertiary">{footer}</div> : null}
            </div>
        </main>
    );
}
