"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function AdminRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/manage/general/users");
    }, [router]);

    return null;
}
