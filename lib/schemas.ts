import { z } from "zod";

type Translate = (key: string) => string;

function requiredEmail(t: Translate) {
    return z
        .string()
        .trim()
        .min(1, t("validation.required"))
        .pipe(z.email(t("validation.email")));
}

function requiredPassword(t: Translate) {
    return z.string().superRefine((value, ctx) => {
        if (value.length < 1) {
            ctx.addIssue({ code: "custom", message: t("validation.required") });
            return;
        }
        if (value.length < 8) {
            ctx.addIssue({ code: "custom", message: t("validation.passwordMin") });
            return;
        }
        if (value.length > 72) {
            ctx.addIssue({ code: "custom", message: t("validation.passwordMax") });
        }
    });
}

function requiredUsername(t: Translate) {
    return z.string().trim().superRefine((value, ctx) => {
        if (value.length < 1) {
            ctx.addIssue({ code: "custom", message: t("validation.required") });
            return;
        }
        if (value.length < 3) {
            ctx.addIssue({ code: "custom", message: t("validation.usernameMin") });
            return;
        }
        if (value.length > 50) {
            ctx.addIssue({ code: "custom", message: t("validation.usernameMax") });
        }
    });
}

function requiredConfirmPassword(t: Translate) {
    return z.string().min(1, t("validation.confirmPassword"));
}

export function createLoginSchema(t: Translate) {
    return z.object({
        email: requiredEmail(t),
        password: requiredPassword(t),
        rememberMe: z.boolean(),
    });
}

export function createRegisterSchema(t: Translate) {
    return z.object({
        username: requiredUsername(t),
        email: requiredEmail(t),
        password: requiredPassword(t),
    });
}

export function createForgotPasswordSchema(t: Translate) {
    return z.object({
        email: requiredEmail(t),
    });
}

export function createResetPasswordSchema(t: Translate) {
    return z
        .object({
            password: requiredPassword(t),
            confirmPassword: requiredConfirmPassword(t),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("validation.passwordMismatch"),
            path: ["confirmPassword"],
        });
}

export const adminSearchSchema = z.object({
    search: z.string().max(255),
});

export function createAdminResetPasswordSchema(t: Translate) {
    return z
        .object({
            password: requiredPassword(t),
            confirmPassword: requiredConfirmPassword(t),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("validation.passwordMismatch"),
            path: ["confirmPassword"],
        });
}

export function createAdminUserSchema(t: Translate) {
    return z.object({
        username: requiredUsername(t),
        email: requiredEmail(t),
    });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type ForgotPasswordInput = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordInput = z.infer<ReturnType<typeof createResetPasswordSchema>>;
export type AdminSearchInput = z.infer<typeof adminSearchSchema>;
export type AdminResetPasswordInput = z.infer<ReturnType<typeof createAdminResetPasswordSchema>>;
export type AdminUserInput = z.infer<ReturnType<typeof createAdminUserSchema>>;
