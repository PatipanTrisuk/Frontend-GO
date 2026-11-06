"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { http } from "@/lib/http";

/** Keep Axios `Accept-Language` aligned with the active next-intl locale. */
export function LocaleApiSync() {
    const locale = useLocale();

    useEffect(() => {
        http.defaults.headers.common["Accept-Language"] = locale;
    }, [locale]);

    return null;
}
