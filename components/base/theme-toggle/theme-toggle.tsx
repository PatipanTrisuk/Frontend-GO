"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon01, Sun } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const t = useTranslations("theme");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                color="secondary"
                size="sm"
                className={className}
                aria-label={t("toDark")}
                isDisabled
                iconLeading={Sun}
            />
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            color="secondary"
            size="sm"
            className={className}
            aria-label={isDark ? t("toLight") : t("toDark")}
            iconLeading={isDark ? Sun : Moon01}
            onPress={() => setTheme(isDark ? "light" : "dark")}
        />
    );
}
