import type { DevicePayload } from "@/lib/types";

const DEVICE_ID_KEY = "go_auth_device_id";

function randomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `device-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getDevicePayload(): DevicePayload {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = randomId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    const name =
        typeof navigator !== "undefined"
            ? `${navigator.platform || "Web"} · ${navigator.language || "en"}`
            : "Web Client";

    return { deviceId, name: name.slice(0, 100) };
}
