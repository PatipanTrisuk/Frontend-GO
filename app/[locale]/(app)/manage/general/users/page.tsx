"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { DialogTrigger, Heading, Popover, type SortDescriptor } from "react-aria-components";
import {
    CheckVerified01,
    Download01,
    Edit01,
    FilterLines,
    Key01,
    LogOut01,
    Mail01,
    RefreshCcw01,
    SearchLg,
    Trash01,
    UserPlus01,
} from "@untitledui/icons";
import { Table, TableCard } from "@/components/application/table/table";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Dialog, Modal, ModalOverlay, MODAL_EXIT_MS } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { notify } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import {
    adminSearchSchema,
    createAdminResetPasswordSchema,
    createAdminUserSchema,
    type AdminResetPasswordInput,
    type AdminSearchInput,
    type AdminUserInput,
} from "@/lib/schemas";
import type { User } from "@/lib/types";
import { useRequireAuth } from "@/providers/auth-provider";
import type { FC } from "react";
import { cx } from "@/utils/cx";

type AdminFilters = {
    role: string;
    auth_provider: string;
    deleted_status: string;
    created_from: string;
    created_to: string;
    updated_from: string;
    updated_to: string;
};

const emptyFilters: AdminFilters = {
    role: "",
    auth_provider: "",
    deleted_status: "active",
    created_from: "",
    created_to: "",
    updated_from: "",
    updated_to: "",
};

function countActiveFilters(filters: AdminFilters) {
    return Object.entries(filters).filter(([key, value]) => {
        if (!value) return false;
        if (key === "deleted_status" && value === "active") return false;
        return true;
    }).length;
}

type ConfirmAction = "kick" | "delete" | "restore" | "verifyEmail" | "sendReset";
type ActionKey = ConfirmAction | "setPassword" | "edit";

type DialogState =
    | { type: "none" }
    | { type: "confirm"; action: ConfirmAction; user: User }
    | { type: "reset"; user: User }
    | { type: "form"; mode: "create" | "edit"; user?: User };

type UserAction = {
    id: ActionKey;
    label: string;
    icon: FC<{ className?: string }>;
};

const VISIBLE_ACTION_LIMIT = 2;

function getUserActions(user: User, currentUserId: string | undefined, t: (key: string) => string): UserAction[] {
    const isSelf = user.id === currentUserId;
    const isDeleted = Boolean(user.deleted_at);
    const verified = Boolean(user.email_verified_at);

    if (isDeleted) {
        if (isSelf) return [];
        return [{ id: "restore", label: t("restore"), icon: RefreshCcw01 }];
    }

    const actions: UserAction[] = [{ id: "edit", label: t("edit"), icon: Edit01 }];

    actions.push({ id: "sendReset", label: t("sendReset"), icon: Mail01 });

    if (!isSelf) {
        actions.push({ id: "setPassword", label: t("setPassword"), icon: Key01 });
    }
    if (!verified) {
        actions.push({ id: "verifyEmail", label: t("verifyEmail"), icon: CheckVerified01 });
    }
    if (!isSelf) {
        actions.push({ id: "kick", label: t("kick"), icon: LogOut01 });
        actions.push({ id: "delete", label: t("delete"), icon: Trash01 });
    }

    return actions;
}

export default function UserAccountsPage() {
    const auth = useRequireAuth({ admin: true });
    const locale = useLocale();
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const tValidation = useTranslations();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [appliedSearch, setAppliedSearch] = useState("");
    const [appliedFilters, setAppliedFilters] = useState<AdminFilters>(emptyFilters);
    const [draftFilters, setDraftFilters] = useState<AdminFilters>(emptyFilters);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "created_at",
        direction: "descending",
    });

    const sortBy = String(sortDescriptor.column ?? "created_at");
    const sortDir = sortDescriptor.direction === "ascending" ? "asc" : "desc";
    const [dialog, setDialog] = useState<DialogState>({ type: "none" });
    const [modalOpen, setModalOpen] = useState(false);
    const closeDialogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (closeDialogTimerRef.current) clearTimeout(closeDialogTimerRef.current);
        };
    }, []);

    const activeFilterCount = countActiveFilters(appliedFilters);

    const updateDraftFilter = <K extends keyof AdminFilters>(key: K, value: AdminFilters[K]) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    const { control, handleSubmit, reset: resetSearchForm, getValues } = useForm<AdminSearchInput>({
        resolver: zodResolver(adminSearchSchema),
        defaultValues: { search: "" },
    });

    const resetSchema = useMemo(() => createAdminResetPasswordSchema(tValidation), [tValidation]);
    const resetForm = useForm<AdminResetPasswordInput>({
        resolver: zodResolver(resetSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: { password: "", confirmPassword: "" },
    });

    const userSchema = useMemo(() => createAdminUserSchema(tValidation), [tValidation]);
    const userForm = useForm<AdminUserInput>({
        resolver: zodResolver(userSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: { username: "", email: "" },
    });

    const usersQuery = useQuery({
        queryKey: queryKeys.adminUsers({
            page,
            limit: pageSize,
            search: appliedSearch,
            ...appliedFilters,
            sort_by: sortBy,
            sort_dir: sortDir,
        }),
        queryFn: async () =>
            adminApi.users({
                page,
                limit: pageSize,
                search: appliedSearch || undefined,
                role: appliedFilters.role || undefined,
                auth_provider: appliedFilters.auth_provider || undefined,
                deleted_status: appliedFilters.deleted_status || undefined,
                created_from: appliedFilters.created_from || undefined,
                created_to: appliedFilters.created_to || undefined,
                updated_from: appliedFilters.updated_from || undefined,
                updated_to: appliedFilters.updated_to || undefined,
                sort_by: sortBy,
                sort_dir: sortDir,
            }),
    });

    const invalidateUsers = async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin"] });
    };

    const exportMutation = useMutation({
        mutationFn: async () => {
            const queued = await adminApi.exportUsers({
                search: appliedSearch || undefined,
                role: appliedFilters.role || undefined,
                auth_provider: appliedFilters.auth_provider || undefined,
                deleted_status: appliedFilters.deleted_status || undefined,
                created_from: appliedFilters.created_from || undefined,
                created_to: appliedFilters.created_to || undefined,
                updated_from: appliedFilters.updated_from || undefined,
                updated_to: appliedFilters.updated_to || undefined,
                sort_by: sortBy,
                sort_dir: sortDir,
            });

            const jobId = queued.data.id;
            await queryClient.invalidateQueries({ queryKey: ["notifications"] });
            const loadingToastId = notify.info(t("exportQueuedDescription"), {
                title: t("exportQueued"),
                duration: Infinity,
                hideDismissLabel: true,
            });

            const startedAt = Date.now();
            const timeoutMs = 2 * 60 * 1000;

            while (Date.now() - startedAt < timeoutMs) {
                await new Promise((resolve) => window.setTimeout(resolve, 1000));
                const statusRes = await adminApi.getExportJob(jobId);
                const job = statusRes.data;

                if (job.status === "completed") {
                    notify.dismiss(loadingToastId);
                    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    notify.success(t("exportReadyDescription"), {
                        title: t("exportReady"),
                        confirmLabel: t("exportDownload"),
                        duration: 20000,
                        onConfirm: () => {
                            void (async () => {
                                const blob = await adminApi.downloadExportJob(jobId);
                                const url = URL.createObjectURL(blob);
                                const anchor = document.createElement("a");
                                anchor.href = url;
                                anchor.download = job.file_name || `users-${jobId}.csv`;
                                document.body.appendChild(anchor);
                                anchor.click();
                                anchor.remove();
                                URL.revokeObjectURL(url);
                            })();
                        },
                    });
                    return job;
                }

                if (job.status === "failed") {
                    notify.dismiss(loadingToastId);
                    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    throw new Error(job.error_message || t("exportFailed"));
                }
            }

            notify.dismiss(loadingToastId);
            await queryClient.invalidateQueries({ queryKey: ["notifications"] });
            throw new Error(t("exportFailed"));
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : t("exportFailedDescription"), {
                title: t("exportFailed"),
            });
        },
    });

    const actionMutation = useMutation({
        mutationFn: async () => {
            if (dialog.type !== "confirm") throw new Error("invalid dialog");
            const { action, user } = dialog;
            switch (action) {
                case "kick":
                    return adminApi.kickUser(user.id);
                case "delete":
                    return adminApi.deleteUser(user.id);
                case "restore":
                    return adminApi.restoreUser(user.id);
                case "verifyEmail":
                    return adminApi.verifyEmail(user.id);
                case "sendReset":
                    return adminApi.sendResetPassword(user.id);
            }
        },
        onSuccess: async (res) => {
            notify.success(res.message || t("actionSuccess"));
            closeDialog(true);
            await invalidateUsers();
        },
    });

    const resetMutation = useMutation({
        mutationFn: async (values: AdminResetPasswordInput) => {
            if (dialog.type !== "reset") throw new Error("invalid dialog");
            return adminApi.resetPassword(dialog.user.id, values.password);
        },
        onSuccess: async (res) => {
            notify.success(res.message || t("actionSuccess"));
            resetForm.reset();
            closeDialog(true);
            await invalidateUsers();
        },
    });

    const userMutation = useMutation({
        mutationFn: async (values: AdminUserInput) => {
            if (dialog.type !== "form") throw new Error("invalid dialog");
            if (dialog.mode === "create") {
                return adminApi.createUser(values);
            }
            if (!dialog.user) throw new Error("missing user");
            return adminApi.updateUser(dialog.user.id, {
                ...values,
                role: dialog.user.role === "admin" ? "admin" : "user",
            });
        },
        onSuccess: async (res) => {
            notify.success(res.message || t("actionSuccess"));
            userForm.reset({ username: "", email: "" });
            closeDialog(true);
            await invalidateUsers();
        },
    });

    const applySearch = (searchValue?: string) => {
        setPage(1);
        setAppliedSearch((searchValue ?? getValues("search") ?? "").trim());
        setAppliedFilters(draftFilters);
        setFilterOpen(false);
    };

    const onSearch = handleSubmit((values) => {
        applySearch(values.search);
    });

    const clearFilters = () => {
        setPage(1);
        setAppliedSearch("");
        setAppliedFilters(emptyFilters);
        setDraftFilters(emptyFilters);
        resetSearchForm({ search: "" });
        setFilterOpen(false);
    };

    const openDialog = (next: Exclude<DialogState, { type: "none" }>) => {
        if (closeDialogTimerRef.current) {
            clearTimeout(closeDialogTimerRef.current);
            closeDialogTimerRef.current = null;
        }
        setDialog(next);
        setModalOpen(true);
    };

    const openConfirm = (action: ConfirmAction, user: User) => {
        openDialog({ type: "confirm", action, user });
    };

    const openReset = (user: User) => {
        resetForm.reset({ password: "", confirmPassword: "" });
        openDialog({ type: "reset", user });
    };

    const openCreate = () => {
        userForm.reset({ username: "", email: "" });
        openDialog({ type: "form", mode: "create" });
    };

    const openEdit = (user: User) => {
        userForm.reset({
            username: user.username,
            email: user.email,
        });
        openDialog({ type: "form", mode: "edit", user });
    };

    const closeDialog = (force = false) => {
        if (!force && (actionMutation.isPending || resetMutation.isPending || userMutation.isPending)) {
            return;
        }
        setModalOpen(false);
        if (closeDialogTimerRef.current) clearTimeout(closeDialogTimerRef.current);
        // Keep dialog content mounted until exit animation finishes.
        closeDialogTimerRef.current = setTimeout(() => {
            setDialog({ type: "none" });
            closeDialogTimerRef.current = null;
        }, MODAL_EXIT_MS);
    };

    const confirmMessage = (() => {
        if (dialog.type !== "confirm") return "";
        const name = dialog.user.username;
        switch (dialog.action) {
            case "kick":
                return t("confirmKick", { name });
            case "delete":
                return t("confirmDelete", { name });
            case "restore":
                return t("confirmRestore", { name });
            case "verifyEmail":
                return t("confirmVerify", { name });
            case "sendReset":
                return t("confirmSendReset", { email: dialog.user.email });
        }
    })();

    const users = usersQuery.data?.data ?? [];
    const totalPages = usersQuery.data?.meta.totalPages || 1;
    const total = usersQuery.data?.meta.total || 0;
    const loading = usersQuery.isLoading;
    const currentUserId = auth.user?.id;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>
                <p className="mt-1 text-md text-tertiary">{t("subtitle")}</p>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={onSearch}>
                <Controller
                    name="search"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            aria-label={t("searchPlaceholder")}
                            placeholder={t("searchPlaceholder")}
                            icon={SearchLg}
                            className="min-w-0 flex-1"
                        />
                    )}
                />

                <ButtonUtility
                    type="button"
                    size="sm"
                    color="secondary"
                    className="size-10 shrink-0"
                    icon={
                        <RefreshCcw01
                            data-icon
                            className={
                                usersQuery.isFetching && !usersQuery.isLoading ? "animate-spin" : undefined
                            }
                        />
                    }
                    tooltip={tCommon("refresh")}
                    isDisabled={usersQuery.isFetching && !usersQuery.isLoading}
                    onPress={() => {
                        void usersQuery.refetch();
                    }}
                />

                <DialogTrigger
                    isOpen={filterOpen}
                    onOpenChange={(open) => {
                        setFilterOpen(open);
                        if (open) setDraftFilters(appliedFilters);
                    }}
                >
                    <Button
                        type="button"
                        color="secondary"
                        iconLeading={FilterLines}
                        className={cx(activeFilterCount > 0 && "ring-2 ring-brand")}
                    >
                        {activeFilterCount > 0 ? `${t("filters")} (${activeFilterCount})` : t("filters")}
                    </Button>
                    <Popover
                        placement="bottom end"
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "w-[min(100vw-2rem,24rem)] origin-(--trigger-anchor-point) overflow-auto rounded-xl bg-primary p-4 shadow-lg ring-1 ring-secondary_alt outline-hidden",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <Dialog className="outline-hidden">
                            <div className="space-y-3">
                                <Heading slot="title" className="text-sm font-semibold text-primary">
                                    {t("filters")}
                                </Heading>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <NativeSelect
                                        size="sm"
                                        label={t("filterRole")}
                                        value={draftFilters.role}
                                        onChange={(e) => updateDraftFilter("role", e.target.value)}
                                        options={[
                                            { label: t("filterAll"), value: "" },
                                            { label: t("roleUser"), value: "user" },
                                            { label: t("roleAdmin"), value: "admin" },
                                        ]}
                                    />
                                    <NativeSelect
                                        size="sm"
                                        label={t("filterProvider")}
                                        value={draftFilters.auth_provider}
                                        onChange={(e) => updateDraftFilter("auth_provider", e.target.value)}
                                        options={[
                                            { label: t("filterAll"), value: "" },
                                            { label: t("providerLocal"), value: "local" },
                                            { label: t("providerDiscord"), value: "discord" },
                                        ]}
                                    />
                                    <NativeSelect
                                        size="sm"
                                        label={t("filterStatus")}
                                        value={draftFilters.deleted_status}
                                        onChange={(e) => updateDraftFilter("deleted_status", e.target.value)}
                                        options={[
                                            { label: t("statusActive"), value: "active" },
                                            { label: t("statusDeleted"), value: "deleted" },
                                            { label: t("statusAll"), value: "all" },
                                        ]}
                                    />
                                    <Input
                                        type="date"
                                        size="sm"
                                        label={t("filterCreatedFrom")}
                                        value={draftFilters.created_from}
                                        onChange={(value) => updateDraftFilter("created_from", value)}
                                    />
                                    <Input
                                        type="date"
                                        size="sm"
                                        label={t("filterCreatedTo")}
                                        value={draftFilters.created_to}
                                        onChange={(value) => updateDraftFilter("created_to", value)}
                                    />
                                    <Input
                                        type="date"
                                        size="sm"
                                        label={t("filterUpdatedFrom")}
                                        value={draftFilters.updated_from}
                                        onChange={(value) => updateDraftFilter("updated_from", value)}
                                    />
                                    <Input
                                        type="date"
                                        size="sm"
                                        label={t("filterUpdatedTo")}
                                        value={draftFilters.updated_to}
                                        onChange={(value) => updateDraftFilter("updated_to", value)}
                                    />
                                </div>
                                <div className="flex justify-between gap-2 pt-1">
                                    <Button type="button" color="link-gray" size="sm" onPress={clearFilters}>
                                        {t("filterClear")}
                                    </Button>
                                    <Button type="button" size="sm" onPress={() => applySearch()}>
                                        {tCommon("search")}
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Popover>
                </DialogTrigger>

                <Button type="submit" color="primary">
                    {tCommon("search")}
                </Button>

                <Button
                    type="button"
                    color="secondary"
                    iconLeading={Download01}
                    isLoading={exportMutation.isPending}
                    onPress={() => exportMutation.mutate()}
                >
                    {t("exportCsv")}
                </Button>

                <Button type="button" color="secondary" iconLeading={UserPlus01} onPress={openCreate}>
                    {t("addUser")}
                </Button>
            </form>

            {loading ? (
                <div className="flex justify-center py-16">
                    <LoadingIndicator size="md" label={t("loading")} />
                </div>
            ) : (
                <TableCard.Root>
                    <TableCard.Header title={t("tableTitle")} badge={`${total}`} description={t("tableDescription")} />
                    {users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
                            <p className="text-md font-semibold text-primary">{t("emptyTitle")}</p>
                            <p className="text-sm text-tertiary">
                                {appliedSearch
                                    ? t("emptySearchDescription", { query: appliedSearch })
                                    : t("emptyDescription")}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table
                                aria-label={t("tableTitle")}
                                sortDescriptor={sortDescriptor}
                                onSortChange={(next) => {
                                    setPage(1);
                                    setSortDescriptor(next);
                                }}
                            >
                                <Table.Header>
                                    <Table.Head id="username" isRowHeader allowsSorting>
                                        {t("user")}
                                    </Table.Head>
                                    <Table.Head id="role" allowsSorting>
                                        {t("role")}
                                    </Table.Head>
                                    <Table.Head id="auth_provider" allowsSorting>
                                        {t("provider")}
                                    </Table.Head>
                                    <Table.Head id="email_verified_at" allowsSorting>
                                        {t("emailStatus")}
                                    </Table.Head>
                                    <Table.Head id="created_at" allowsSorting>
                                        {t("created")}
                                    </Table.Head>
                                    <Table.Head id="updated_at" allowsSorting>
                                        {t("updated")}
                                    </Table.Head>
                                    <Table.Head className="text-center [&>div]:justify-center">{t("actions")}</Table.Head>
                                </Table.Header>
                                <Table.Body items={users}>
                                    {(user) => {
                                        const isSelf = user.id === currentUserId;
                                        const verified = Boolean(user.email_verified_at);
                                        const actions = getUserActions(user, currentUserId, t);
                                        const visibleActions = actions.slice(0, VISIBLE_ACTION_LIMIT);
                                        const overflowActions = actions.slice(VISIBLE_ACTION_LIMIT);

                                        const runAction = (key: ActionKey) => {
                                            switch (key) {
                                                case "edit":
                                                    openEdit(user);
                                                    break;
                                                case "sendReset":
                                                    openConfirm("sendReset", user);
                                                    break;
                                                case "setPassword":
                                                    openReset(user);
                                                    break;
                                                case "verifyEmail":
                                                    openConfirm("verifyEmail", user);
                                                    break;
                                                case "kick":
                                                    openConfirm("kick", user);
                                                    break;
                                                case "delete":
                                                    openConfirm("delete", user);
                                                    break;
                                                case "restore":
                                                    openConfirm("restore", user);
                                                    break;
                                            }
                                        };

                                        const isDeleted = Boolean(user.deleted_at);

                                        return (
                                            <Table.Row id={user.id}>
                                                <Table.Cell>
                                                    <div>
                                                        <p className="font-medium text-primary">
                                                            {user.username}
                                                            {isSelf ? (
                                                                <span className="ml-2 text-xs font-normal text-tertiary">
                                                                    ({t("you")})
                                                                </span>
                                                            ) : null}
                                                            {isDeleted ? (
                                                                <span className="ml-2">
                                                                    <Badge color="error" size="sm">
                                                                        {t("deleted")}
                                                                    </Badge>
                                                                </span>
                                                            ) : null}
                                                        </p>
                                                        <p className="text-sm text-tertiary">{user.email}</p>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color={user.role === "admin" ? "brand" : "gray"} size="sm">
                                                        {user.role}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color="blue" size="sm">
                                                        {user.auth_provider}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color={verified ? "success" : "warning"} size="sm">
                                                        {verified ? t("verified") : t("unverified")}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>{formatDate(user.created_at, { locale })}</Table.Cell>
                                                <Table.Cell>{formatDate(user.updated_at, { locale })}</Table.Cell>
                                                <Table.Cell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        {visibleActions.map((action) => (
                                                            <ButtonUtility
                                                                key={action.id}
                                                                size="sm"
                                                                color="tertiary"
                                                                icon={action.icon}
                                                                tooltip={action.label}
                                                                onPress={() => runAction(action.id)}
                                                            />
                                                        ))}
                                                        {overflowActions.length > 0 ? (
                                                            <Dropdown.Root>
                                                                <Dropdown.DotsButton aria-label={t("actionMenu")} />
                                                                <Dropdown.Popover className="w-min">
                                                                    <Dropdown.Menu
                                                                        onAction={(key) => runAction(String(key) as ActionKey)}
                                                                    >
                                                                        {overflowActions.flatMap((action) => {
                                                                            const item = (
                                                                                <Dropdown.Item
                                                                                    key={action.id}
                                                                                    id={action.id}
                                                                                    icon={action.icon}
                                                                                    label={action.label}
                                                                                />
                                                                            );
                                                                            if (action.id === "delete") {
                                                                                return [
                                                                                    <Dropdown.Separator key={`${action.id}-sep`} />,
                                                                                    item,
                                                                                ];
                                                                            }
                                                                            return [item];
                                                                        })}
                                                                    </Dropdown.Menu>
                                                                </Dropdown.Popover>
                                                            </Dropdown.Root>
                                                        ) : null}
                                                    </div>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    }}
                                </Table.Body>
                            </Table>
                            <PaginationCardAdvanced
                                page={page}
                                total={totalPages}
                                pageSize={pageSize}
                                align="space-between"
                                rowsPerPageLabel={t("rowsPerPage")}
                                onPageChange={setPage}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        </>
                    )}
                </TableCard.Root>
            )}

            <ModalOverlay
                isOpen={modalOpen}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
                isDismissable={!actionMutation.isPending && !resetMutation.isPending && !userMutation.isPending}
            >
                <Modal className="max-w-md">
                    <Dialog className="p-6 sm:p-8">
                        {dialog.type === "confirm" ? (
                            <div className="space-y-5">
                                <Heading slot="title" className="text-lg font-semibold text-primary">
                                    {t("confirm")}
                                </Heading>
                                <p className="text-sm text-tertiary">{confirmMessage}</p>
                                <div className="flex justify-end gap-3">
                                    <Button color="secondary" onPress={closeDialog} isDisabled={actionMutation.isPending}>
                                        {t("cancel")}
                                    </Button>
                                    <Button
                                        color={dialog.action === "delete" ? "primary-destructive" : "primary"}
                                        onPress={() => actionMutation.mutate()}
                                        isLoading={actionMutation.isPending}
                                    >
                                        {t("confirm")}
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {dialog.type === "reset" ? (
                            <form
                                className="space-y-5"
                                noValidate
                                onSubmit={resetForm.handleSubmit((values) => resetMutation.mutate(values))}
                            >
                                <div>
                                    <Heading slot="title" className="text-lg font-semibold text-primary">
                                        {t("resetTitle", { name: dialog.user.username })}
                                    </Heading>
                                    <p className="mt-1 text-sm text-tertiary">{t("resetDescription")}</p>
                                </div>
                                <Controller
                                    name="password"
                                    control={resetForm.control}
                                    render={({ field, fieldState }) => (
                                        <Input
                                            name={field.name}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                            type="password"
                                            label={t("password")}
                                            isInvalid={Boolean(fieldState.error)}
                                            hint={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="confirmPassword"
                                    control={resetForm.control}
                                    render={({ field, fieldState }) => (
                                        <Input
                                            name={field.name}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                            type="password"
                                            label={t("confirmPassword")}
                                            isInvalid={Boolean(fieldState.error)}
                                            hint={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <div className="flex justify-end gap-3">
                                    <Button color="secondary" onPress={closeDialog} isDisabled={resetMutation.isPending}>
                                        {t("cancel")}
                                    </Button>
                                    <Button type="submit" isLoading={resetMutation.isPending}>
                                        {t("save")}
                                    </Button>
                                </div>
                            </form>
                        ) : null}

                        {dialog.type === "form" ? (
                            <form
                                className="space-y-5"
                                noValidate
                                onSubmit={userForm.handleSubmit((values) => userMutation.mutate(values))}
                            >
                                <div>
                                    <Heading slot="title" className="text-lg font-semibold text-primary">
                                        {dialog.mode === "create"
                                            ? t("createTitle")
                                            : t("editTitle", { name: dialog.user?.username ?? "" })}
                                    </Heading>
                                    <p className="mt-1 text-sm text-tertiary">{t("formDescription")}</p>
                                </div>
                                <Controller
                                    name="username"
                                    control={userForm.control}
                                    render={({ field, fieldState }) => (
                                        <Input
                                            name={field.name}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                            isRequired
                                            label={t("username")}
                                            isInvalid={Boolean(fieldState.error)}
                                            hint={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="email"
                                    control={userForm.control}
                                    render={({ field, fieldState }) => (
                                        <Input
                                            name={field.name}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                            isRequired
                                            type="email"
                                            label={t("email")}
                                            isInvalid={Boolean(fieldState.error)}
                                            hint={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <div className="flex justify-end gap-3">
                                    <Button color="secondary" onPress={closeDialog} isDisabled={userMutation.isPending}>
                                        {t("cancel")}
                                    </Button>
                                    <Button type="submit" isLoading={userMutation.isPending}>
                                        {dialog.mode === "create" ? t("createUser") : t("saveUser")}
                                    </Button>
                                </div>
                            </form>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
}
