"use client";

import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/application/notifications/toaster";

export function NotificationProvider({ children }: PropsWithChildren) {
    return (
        <>
            {children}
            <Toaster />
        </>
    );
}
