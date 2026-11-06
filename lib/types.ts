export type UserRole = "user" | "admin";

export type AuthProvider = "local" | "discord";

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    auth_provider: AuthProvider;
    discord_id?: string;
    email_verified_at?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Device {
    id: string;
    userId: string;
    deviceKey: string;
    name: string;
    userAgent: string;
    ipAddress: string;
    lastSeenAt: string;
    createdAt: string;
}

export interface DevicePayload {
    deviceId: string;
    name: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface AuthSession extends AuthTokens {
    user: User;
}

export interface ApiErrorBody {
    status?: string;
    statusCode?: number;
    code?: string;
    message?: string;
}

export interface PaginatedUsers {
    data: User[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AdminStats {
    userCount: number;
    apiStatus: string;
    dbStatus: string;
}

export type ExportJobStatus = "pending" | "processing" | "completed" | "failed";

export interface ExportJob {
    id: string;
    user_id: string;
    type: string;
    status: ExportJobStatus;
    file_name?: string | null;
    error_message?: string | null;
    created_at: string;
    started_at?: string | null;
    completed_at?: string | null;
}

export type AppNotificationType = "export_queued" | "export_ready" | "export_failed";

export interface AppNotification {
    id: string;
    type: AppNotificationType | string;
    ref_type?: string | null;
    ref_id?: string | null;
    meta: {
        export_type?: string;
        file_name?: string;
        error_message?: string;
        [key: string]: unknown;
    };
    read_at?: string | null;
    created_at: string;
}
