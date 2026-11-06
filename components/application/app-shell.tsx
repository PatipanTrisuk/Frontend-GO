"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Bell01, ChevronRight, LogOut01, Menu01, Users01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { LocaleSwitcher } from "@/components/base/locale-switcher/locale-switcher";
import { ThemeToggle } from "@/components/base/theme-toggle/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { authApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";

const USERS_HREF = "/manage/general/users" as const;
const NOTIFICATIONS_HREF = "/notifications" as const;

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations();
    const { user, isAdmin, logout, isLoading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const unreadQuery = useQuery({
        queryKey: queryKeys.notificationsUnread,
        queryFn: async () => {
            const res = await authApi.notificationsUnreadCount();
            return res.data?.unread_count ?? 0;
        },
        enabled: Boolean(user),
        refetchInterval: 20_000,
    });
    const unreadCount = unreadQuery.data ?? 0;

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileOpen]);

    const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");
    const notificationsActive =
        pathname === NOTIFICATIONS_HREF || pathname.startsWith(`${NOTIFICATIONS_HREF}/`);
    const usersActive = pathname === USERS_HREF || pathname.startsWith(`${USERS_HREF}/`) || pathname.startsWith("/admin");

    const sidebar = (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 py-5 lg:px-5">
                <Link href="/profile" className="text-lg font-semibold tracking-tight text-primary">
                    {t("app.name")}
                </Link>
                <Button
                    color="tertiary"
                    size="sm"
                    className="lg:hidden"
                    aria-label={t("nav.closeMenu")}
                    iconLeading={XClose}
                    onPress={() => setMobileOpen(false)}
                />
            </div>

            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 lg:px-4">
                <div className="flex flex-col gap-1">
                    <Link
                        href={NOTIFICATIONS_HREF}
                        className={cx(
                            "inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                            notificationsActive
                                ? "bg-brand-primary text-brand-secondary"
                                : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                        )}
                    >
                        <Bell01 className="size-5 shrink-0" />
                        <span className="min-w-0 flex-1">{t("nav.notifications")}</span>
                        {unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-solid px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        ) : null}
                    </Link>
                </div>

                {isAdmin ? (
                    <div className="flex flex-col gap-2">
                        <p className="px-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
                            {t("nav.manage")}
                        </p>

                        <div className="flex flex-col gap-1">
                            <p className="px-3 py-1 text-xs font-semibold text-tertiary">{t("nav.general")}</p>
                            <Link
                                href={USERS_HREF}
                                className={cx(
                                    "inline-flex items-center gap-3 rounded-lg py-2.5 pr-3 pl-6 text-sm font-semibold transition",
                                    usersActive
                                        ? "bg-brand-primary text-brand-secondary"
                                        : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                )}
                            >
                                <Users01 className="size-5 shrink-0" />
                                {t("nav.userAccounts")}
                            </Link>
                        </div>
                    </div>
                ) : null}
            </nav>

            <div className="mt-auto space-y-3 border-t border-secondary px-3 py-4 lg:px-4">
                {!isLoading && user ? (
                    <Link
                        href="/profile"
                        aria-current={profileActive ? "page" : undefined}
                        className={cx(
                            "flex items-center gap-3 rounded-lg px-3 py-3 transition",
                            profileActive
                                ? "bg-brand-primary text-brand-secondary ring-1 ring-brand"
                                : "bg-secondary hover:bg-primary_hover",
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-primary">{user.username}</p>
                            <p className="truncate text-xs text-tertiary">{user.email}</p>
                            <p
                                className={cx(
                                    "mt-1 text-xs font-semibold",
                                    profileActive ? "text-brand-secondary" : "text-brand-tertiary",
                                )}
                            >
                                {t("nav.profile")}
                            </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                    </Link>
                ) : null}

                <div className="flex w-full items-center gap-2">
                    <LocaleSwitcher className="min-w-0 flex-1" />
                    <ThemeToggle className="size-10 shrink-0" />
                </div>

                <Button
                    color="secondary"
                    size="md"
                    className="w-full justify-center"
                    iconLeading={LogOut01}
                    onPress={() => void logout()}
                >
                    {t("nav.logout")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-secondary lg:flex">
            <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-secondary bg-primary lg:block">
                {sidebar}
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button
                        type="button"
                        aria-label={t("nav.closeMenu")}
                        className="absolute inset-0 bg-overlay/60"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative z-10 h-full w-[min(18rem,88vw)] border-r border-secondary bg-primary shadow-xl">
                        {sidebar}
                    </aside>
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary px-4 py-3 lg:hidden">
                    <Button
                        color="tertiary"
                        size="sm"
                        aria-label={t("nav.openMenu")}
                        iconLeading={Menu01}
                        onPress={() => setMobileOpen(true)}
                    />
                    <Link href="/profile" className="text-base font-semibold text-primary">
                        {t("app.name")}
                    </Link>
                    <ThemeToggle />
                </header>

                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
            </div>
        </div>
    );
}
