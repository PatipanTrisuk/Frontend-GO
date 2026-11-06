"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Mail01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { AuthShell } from "@/components/marketing/auth-shell";
import { LocaleSwitcher } from "@/components/base/locale-switcher/locale-switcher";
import { ThemeToggle } from "@/components/base/theme-toggle/theme-toggle";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ApiError, authApi, toApiError } from "@/lib/api";
import { createForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
    const t = useTranslations();
    const locale = useLocale();
    const [sentEmail, setSentEmail] = useState<string | null>(null);
    const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: { email: "" },
    });

    const mutation = useMutation({
        mutationFn: (email: string) => authApi.forgotPassword(email, locale),
    });

    const sendReset = async (email: string) => {
        clearErrors("root");
        try {
            await mutation.mutateAsync(email);
            setSentEmail(email);
        } catch (err) {
            const apiErr = toApiError(err);
            setError("root", {
                message: apiErr instanceof ApiError ? apiErr.message : t("forgotPassword.failed"),
            });
        }
    };

    const onSubmit = handleSubmit(async (values) => {
        await sendReset(values.email.trim());
    });

    return (
        <AuthShell
            title={sentEmail ? t("forgotPassword.sentTitle") : t("forgotPassword.title")}
            description={
                sentEmail
                    ? t("forgotPassword.sentDescription", { email: sentEmail })
                    : t("forgotPassword.description")
            }
            footer={
                <Link href="/login" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
                    {t("common.backToLogin")}
                </Link>
            }
        >
            <div className="mb-5 flex items-center justify-end gap-2">
                <LocaleSwitcher />
                <ThemeToggle />
            </div>

            {sentEmail ? (
                <EmptyState size="sm" className="max-w-none">
                    <EmptyState.Header pattern="none">
                        <EmptyState.FeaturedIcon color="brand" theme="light" icon={Mail01} />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>{t("forgotPassword.sentTitle")}</EmptyState.Title>
                        <EmptyState.Description>{t("forgotPassword.sentHint")}</EmptyState.Description>
                    </EmptyState.Content>
                    <EmptyState.Footer className="flex w-full flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full"
                            isLoading={mutation.isPending}
                            isDisabled={mutation.isPending}
                            onPress={() => void sendReset(sentEmail)}
                        >
                            {t("forgotPassword.sendAgain")}
                        </Button>
                        <Button
                            size="lg"
                            color="secondary"
                            className="w-full"
                            onPress={() => {
                                setSentEmail(null);
                                clearErrors("root");
                            }}
                        >
                            {t("forgotPassword.useAnotherEmail")}
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            ) : (
                <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Input
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                isRequired
                                label={t("forgotPassword.email")}
                                type="email"
                                placeholder={t("forgotPassword.emailPlaceholder")}
                                icon={Mail01}
                                isInvalid={Boolean(fieldState.error)}
                                hint={fieldState.error?.message}
                            />
                        )}
                    />

                    {errors.root?.message ? <p className="text-sm text-error-primary">{errors.root.message}</p> : null}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        isLoading={mutation.isPending}
                        isDisabled={mutation.isPending}
                    >
                        {t("forgotPassword.submit")}
                    </Button>
                </form>
            )}
        </AuthShell>
    );
}
