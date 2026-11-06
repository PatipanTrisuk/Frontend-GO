"use client";

import type { FC, ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

export type NotificationColor = "default" | "brand" | "gray" | "error" | "warning" | "success";

const colorConfig: Record<
    NotificationColor,
    {
        featuredColor: "brand" | "gray" | "success" | "warning" | "error";
        theme: "modern" | "outline";
        Icon: FC<{ className?: string }>;
    }
> = {
    default: { featuredColor: "gray", theme: "modern", Icon: InfoCircle },
    brand: { featuredColor: "brand", theme: "outline", Icon: InfoCircle },
    gray: { featuredColor: "gray", theme: "outline", Icon: InfoCircle },
    error: { featuredColor: "error", theme: "outline", Icon: AlertCircle },
    warning: { featuredColor: "warning", theme: "outline", Icon: AlertCircle },
    success: { featuredColor: "success", theme: "outline", Icon: CheckCircle },
};

export interface IconNotificationProps {
    title: string;
    description?: ReactNode;
    color?: NotificationColor;
    icon?: FC<{ className?: string }>;
    confirmLabel?: string;
    dismissLabel?: string;
    hideDismissLabel?: boolean;
    onConfirm?: () => void;
    onClose?: () => void;
    className?: string;
}

export function IconNotification({
    title,
    description,
    color = "default",
    icon,
    confirmLabel,
    dismissLabel = "Dismiss",
    hideDismissLabel = false,
    onConfirm,
    onClose,
    className,
}: IconNotificationProps) {
    const config = colorConfig[color];
    const Icon = icon ?? config.Icon;
    const showActions = Boolean(confirmLabel) || !hideDismissLabel;

    return (
        <div
            className={cx(
                "relative flex w-full max-w-[400px] items-start gap-4 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-secondary_alt",
                className,
            )}
        >
            <FeaturedIcon color={config.featuredColor} theme={config.theme} size="md" icon={Icon} />

            <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-primary">{title}</p>
                {description ? <div className="mt-1 text-sm text-tertiary">{description}</div> : null}

                {showActions ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {!hideDismissLabel ? (
                            <Button color="link-gray" size="sm" onPress={onClose}>
                                {dismissLabel}
                            </Button>
                        ) : null}
                        {confirmLabel ? (
                            <Button
                                color="link-color"
                                size="sm"
                                onPress={() => {
                                    onConfirm?.();
                                    onClose?.();
                                }}
                            >
                                {confirmLabel}
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <CloseButton size="sm" className="-mt-1 -mr-1" slot={null} onPress={onClose} />
        </div>
    );
}
