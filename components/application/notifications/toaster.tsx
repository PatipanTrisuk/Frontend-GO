"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";
import { useBreakpoint } from "@/hooks/use-breakpoint";

export const DEFAULT_TOAST_POSITION: ToasterProps["position"] = "top-right";

export function Toaster(props: ToasterProps) {
    const { resolvedTheme } = useTheme();
    const isDesktop = useBreakpoint("sm");

    return (
        <SonnerToaster
            theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
            position={DEFAULT_TOAST_POSITION}
            visibleToasts={5}
            gap={12}
            expand
            style={
                {
                    "--width": isDesktop ? "400px" : "100%",
                } as CSSProperties
            }
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "w-full",
                },
            }}
            {...props}
        />
    );
}
