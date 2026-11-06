export const queryKeys = {
    profile: ["profile"] as const,
    devices: ["devices"] as const,
    notifications: ["notifications"] as const,
    notificationsUnread: ["notifications", "unread"] as const,
    adminStats: ["admin", "stats"] as const,
    adminUsers: (params: {
        page: number;
        limit: number;
        search: string;
        role: string;
        auth_provider: string;
        deleted_status: string;
        created_from: string;
        created_to: string;
        updated_from: string;
        updated_to: string;
        sort_by: string;
        sort_dir: string;
    }) => ["admin", "users", params] as const,
};
