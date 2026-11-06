import type { User } from "@/lib/types";

const ACCESS_KEY = "go_auth_access_token";
const REFRESH_KEY = "go_auth_refresh_token";
const USER_KEY = "go_auth_user";
const REMEMBER_KEY = "go_auth_remember";
const REMEMBERED_EMAIL_KEY = "go_auth_remembered_email";

export type PersistMode = "local" | "session";

function storages(): Storage[] {
    if (typeof window === "undefined") return [];
    return [localStorage, sessionStorage];
}

function readItem(key: string): string | null {
    for (const storage of storages()) {
        const value = storage.getItem(key);
        if (value) return value;
    }
    return null;
}

function writeItem(storage: Storage, key: string, value: string) {
    storage.setItem(key, value);
}

function removeItem(key: string) {
    for (const storage of storages()) {
        storage.removeItem(key);
    }
}

export function getRememberMe(): boolean {
    if (typeof window === "undefined") return true;
    const raw = localStorage.getItem(REMEMBER_KEY) ?? sessionStorage.getItem(REMEMBER_KEY);
    if (raw === null) return true;
    return raw === "1";
}

export function setRememberMe(remember: boolean) {
    if (typeof window === "undefined") return;
    const value = remember ? "1" : "0";
    // Preference itself stays in localStorage so the checkbox state can restore next visit
    localStorage.setItem(REMEMBER_KEY, value);
    sessionStorage.setItem(REMEMBER_KEY, value);
}

function activeStorage(remember = getRememberMe()): Storage {
    return remember ? localStorage : sessionStorage;
}

function inactiveStorage(remember = getRememberMe()): Storage {
    return remember ? sessionStorage : localStorage;
}

export function getAccessToken() {
    return readItem(ACCESS_KEY);
}

export function getRefreshToken() {
    return readItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
    const raw = readItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function getRememberedEmail(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

export function setRememberedEmail(email: string | null) {
    if (typeof window === "undefined") return;
    if (!email) {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        return;
    }
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
}

export function saveSession(
    accessToken: string,
    refreshToken: string,
    user?: User | null,
    options?: { remember?: boolean },
) {
    const remember = options?.remember ?? getRememberMe();
    setRememberMe(remember);

    const target = activeStorage(remember);
    const other = inactiveStorage(remember);

    // Avoid duplicate sessions across storages
    other.removeItem(ACCESS_KEY);
    other.removeItem(REFRESH_KEY);
    other.removeItem(USER_KEY);

    writeItem(target, ACCESS_KEY, accessToken);
    writeItem(target, REFRESH_KEY, refreshToken);
    if (user) {
        writeItem(target, USER_KEY, JSON.stringify(user));
    }
}

export function saveUser(user: User) {
    const remember = getRememberMe();
    const target = activeStorage(remember);
    const other = inactiveStorage(remember);
    other.removeItem(USER_KEY);
    writeItem(target, USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    removeItem(ACCESS_KEY);
    removeItem(REFRESH_KEY);
    removeItem(USER_KEY);
    // Keep REMEMBER_KEY + remembered email so the login form can restore preferences
}
