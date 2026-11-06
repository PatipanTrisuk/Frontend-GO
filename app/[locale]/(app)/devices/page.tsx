"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function DevicesRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/profile/devices");
    }, [router]);

    return null;
}
