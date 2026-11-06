"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cx } from "@/utils/cx";

export function LocaleSwitcher({ className }: { className?: string }) {
    const t = useTranslations("locale");
    const locale = useLocale() as AppLocale;
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    function switchLocale(next: AppLocale) {
        if (next === locale) return;
        startTransition(() => {
            router.replace(pathname, { locale: next });
        });
    }

    return (
        <div
            className={cx(
                "inline-flex w-full items-center gap-1 rounded-lg bg-secondary p-1 ring-1 ring-secondary",
                className,
            )}
            aria-label={t("label")}
        >
            {routing.locales.map((item) => {
                const active = item === locale;
                return (
                    <Button
                        key={item}
                        size="sm"
                        color={active ? "primary" : "tertiary"}
                        className="min-w-0 flex-1 justify-center"
                        isDisabled={isPending}
                        onPress={() => switchLocale(item)}
                        aria-pressed={active}
                    >
                        {t(item)}
                    </Button>
                );
            })}
        </div>
    );
}
