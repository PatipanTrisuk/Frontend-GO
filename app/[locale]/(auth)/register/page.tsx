"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail01, User01 } from "@untitledui/icons";
import { AuthShell } from "@/components/marketing/auth-shell";
import { LocaleSwitcher } from "@/components/base/locale-switcher/locale-switcher";
import { ThemeToggle } from "@/components/base/theme-toggle/theme-toggle";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ApiError } from "@/lib/api";
import { createRegisterSchema, type RegisterInput } from "@/lib/schemas";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations();
    const { register: registerUser } = useAuth();
    const schema = useMemo(() => createRegisterSchema(t), [t]);

    const {
        control,
        handleSubmit,
        formState: { isSubmitting, errors },
        setError,
        clearErrors,
        setValue,
    } = useForm<RegisterInput>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: { username: "", email: "", password: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        clearErrors("root");
        try {
            await registerUser(values.username.trim(), values.email.trim(), values.password);
            setValue("password", "");
            router.push("/login");
        } catch (err) {
            setError("root", {
                message: err instanceof ApiError ? err.message : t("register.failed"),
            });
        }
    });

    return (
        <AuthShell
            title={t("register.title")}
            description={t("register.description")}
            footer={
                <>
                    {t("register.hasAccount")}{" "}
                    <Link href="/login" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
                        {t("register.login")}
                    </Link>
                </>
            }
        >
            <div className="mb-5 flex items-center justify-end gap-2">
                <LocaleSwitcher />
                <ThemeToggle />
            </div>

            <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
                <Controller
                    name="username"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Input
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            isRequired
                            label={t("register.username")}
                            placeholder={t("register.usernamePlaceholder")}
                            icon={User01}
                            isInvalid={Boolean(fieldState.error)}
                            hint={fieldState.error?.message ?? t("register.usernameHint")}
                        />
                    )}
                />
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
                            label={t("register.email")}
                            type="email"
                            placeholder={t("register.emailPlaceholder")}
                            icon={Mail01}
                            isInvalid={Boolean(fieldState.error)}
                            hint={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Input
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            isRequired
                            label={t("register.password")}
                            type="password"
                            placeholder={t("register.passwordPlaceholder")}
                            isInvalid={Boolean(fieldState.error)}
                            hint={fieldState.error?.message ?? t("register.passwordHint")}
                        />
                    )}
                />

                {errors.root?.message ? <p className="text-sm text-error-primary">{errors.root.message}</p> : null}

                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} isDisabled={isSubmitting}>
                    {t("register.submit")}
                </Button>
            </form>
        </AuthShell>
    );
}
