import { getDevicePayload } from "@/lib/device";
import { getLocale, http } from "@/lib/http";
import { getRefreshToken } from "@/lib/token-storage";
import type { AdminStats, AppNotification, AuthSession, Device, ExportJob, PaginatedUsers, User } from "@/lib/types";

export { ApiError, toApiError } from "@/lib/http";

export const authApi = {
    async register(payload: { username: string; email: string; password: string }) {
        const { data } = await http.post<{ status: string; message: string; user: User }>(
            "/api/auth/register",
            payload,
        );
        return data;
    },

    async login(payload: { email: string; password: string }) {
        const { data } = await http.post<{ status: string; message: string; data: AuthSession }>(
            "/api/auth/login",
            { ...payload, device: getDevicePayload() },
        );
        return data;
    },

    async discord(payload: { code: string; redirectUri: string }) {
        const { data } = await http.post<{ status: string; data: AuthSession }>("/api/auth/discord", {
            ...payload,
            device: getDevicePayload(),
        });
        return data;
    },

    async forgotPassword(email: string, locale?: string) {
        const { data } = await http.post<{ status: string; message: string }>(
            "/api/auth/forgot-password",
            { email },
            { headers: { "Accept-Language": getLocale(locale) } },
        );
        return data;
    },

    async resetPassword(payload: { token: string; password: string }, locale?: string) {
        const { data } = await http.post<{ status: string; message: string }>(
            "/api/auth/reset-password",
            payload,
            { headers: { "Accept-Language": getLocale(locale) } },
        );
        return data;
    },

    async logout() {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return { message: "Logout successful" };
        const { data } = await http.post<{ message: string }>("/api/auth/logout", { refreshToken });
        return data;
    },

    async profile() {
        const { data } = await http.get<{ status: string; data: User }>("/api/users/profile");
        return data;
    },

    async devices() {
        const { data } = await http.get<{ status: string; data: Device[] }>("/api/users/devices");
        return data;
    },

    async notifications() {
        const { data } = await http.get<{
            status: string;
            data: AppNotification[];
            meta: { unread_count: number };
        }>("/api/users/notifications");
        return data;
    },

    async notificationsUnreadCount() {
        const { data } = await http.get<{ status: string; data: { unread_count: number } }>(
            "/api/users/notifications/unread-count",
        );
        return data;
    },

    async markNotificationRead(id: string) {
        const { data } = await http.post<{ status: string; message: string }>(
            `/api/users/notifications/${id}/read`,
        );
        return data;
    },

    async markAllNotificationsRead() {
        const { data } = await http.post<{ status: string; message: string }>(
            "/api/users/notifications/read-all",
        );
        return data;
    },
};

export const adminApi = {
    async users(
        params: {
            page?: number;
            limit?: number;
            search?: string;
            role?: string;
            auth_provider?: string;
            deleted_status?: string;
            created_from?: string;
            created_to?: string;
            updated_from?: string;
            updated_to?: string;
            sort_by?: string;
            sort_dir?: string;
        } = {},
    ) {
        const { data } = await http.get<{ status: string } & PaginatedUsers>("/api/admin/users", {
            params: {
                page: params.page,
                limit: params.limit,
                search: params.search || undefined,
                role: params.role || undefined,
                auth_provider: params.auth_provider || undefined,
                deleted_status: params.deleted_status || undefined,
                created_from: params.created_from || undefined,
                created_to: params.created_to || undefined,
                updated_from: params.updated_from || undefined,
                updated_to: params.updated_to || undefined,
                sort_by: params.sort_by || undefined,
                sort_dir: params.sort_dir || undefined,
            },
        });
        return data;
    },

    async exportUsers(
        params: {
            search?: string;
            role?: string;
            auth_provider?: string;
            deleted_status?: string;
            created_from?: string;
            created_to?: string;
            updated_from?: string;
            updated_to?: string;
            sort_by?: string;
            sort_dir?: string;
        } = {},
    ) {
        const { data } = await http.post<{ status: string; message: string; data: ExportJob }>(
            "/api/admin/users/export",
            {
                search: params.search || undefined,
                role: params.role || undefined,
                auth_provider: params.auth_provider || undefined,
                deleted_status: params.deleted_status || undefined,
                created_from: params.created_from || undefined,
                created_to: params.created_to || undefined,
                updated_from: params.updated_from || undefined,
                updated_to: params.updated_to || undefined,
                sort_by: params.sort_by || undefined,
                sort_dir: params.sort_dir || undefined,
            },
        );
        return data;
    },

    async getExportJob(id: string) {
        const { data } = await http.get<{ status: string; data: ExportJob }>(`/api/admin/users/export/jobs/${id}`);
        return data;
    },

    async downloadExportJob(id: string) {
        const { data } = await http.get<Blob>(`/api/admin/users/export/jobs/${id}/download`, {
            responseType: "blob",
        });
        return data;
    },

    async stats() {
        const { data } = await http.get<{ status: string; data: AdminStats }>("/api/admin/stats");
        return data;
    },

    async createUser(payload: { username: string; email: string; role?: string }) {
        const { data } = await http.post<{ status: string; message: string; data: User }>("/api/admin/users", {
            username: payload.username,
            email: payload.email,
            ...(payload.role ? { role: payload.role } : {}),
        });
        return data;
    },

    async updateUser(id: string, payload: { username: string; email: string; role: string }) {
        const { data } = await http.patch<{ status: string; message: string; data: User }>(
            `/api/admin/users/${id}`,
            payload,
        );
        return data;
    },

    async deleteUser(id: string) {
        const { data } = await http.delete<{ status: string; message: string }>(`/api/admin/users/${id}`);
        return data;
    },

    async restoreUser(id: string) {
        const { data } = await http.post<{ status: string; message: string; data: User }>(
            `/api/admin/users/${id}/restore`,
        );
        return data;
    },

    async kickUser(id: string) {
        const { data } = await http.post<{ status: string; message: string }>(`/api/admin/users/${id}/kick`);
        return data;
    },

    async resetPassword(id: string, password: string) {
        const { data } = await http.post<{ status: string; message: string }>(`/api/admin/users/${id}/reset-password`, {
            password,
        });
        return data;
    },

    async sendResetPassword(id: string) {
        const { data } = await http.post<{ status: string; message: string }>(
            `/api/admin/users/${id}/send-reset-password`,
        );
        return data;
    },

    async verifyEmail(id: string) {
        const { data } = await http.post<{ status: string; message: string; data: User }>(
            `/api/admin/users/${id}/verify-email`,
        );
        return data;
    },
};

export function getDiscordRedirectUri() {
    if (typeof window === "undefined") {
        return process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? "http://localhost:3000/api/auth/discord/callback";
    }
    return `${window.location.origin}/api/auth/discord/callback`;
}

export function getDiscordAuthorizeUrl() {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) return null;
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: getDiscordRedirectUri(),
        scope: "identify email",
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
