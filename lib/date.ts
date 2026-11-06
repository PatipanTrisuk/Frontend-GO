const TH_MONTHS_SHORT = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
] as const;

const EN_MONTHS_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

export type DateInput = string | number | Date | null | undefined;

export type FormatDateOptions = {
    /** Use Buddhist Era (พ.ศ.). Defaults to `true` for Thai. */
    buddhist?: boolean;
    /** Include time as `HH:mm`. */
    withTime?: boolean;
    /** Locale for formatting. Thai uses abbreviated Thai months. */
    locale?: "th" | "en" | string;
};

function toValidDate(input: DateInput): Date | null {
    if (input == null || input === "") return null;
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function pad2(value: number) {
    return String(value).padStart(2, "0");
}

/**
 * Format a date with Thai abbreviated months, e.g. `6 พ.ย. 2569`.
 * Pass `locale: "en"` for English short months, e.g. `6 Nov 2026`.
 */
export function formatDate(input: DateInput, options: FormatDateOptions = {}): string {
    const date = toValidDate(input);
    if (!date) return "—";

    const locale = (options.locale ?? "th").toLowerCase().startsWith("th") ? "th" : "en";
    const withTime = options.withTime ?? false;
    const useBuddhist = options.buddhist ?? locale === "th";

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = useBuddhist ? date.getFullYear() + 543 : date.getFullYear();

    const month = locale === "th" ? TH_MONTHS_SHORT[monthIndex] : EN_MONTHS_SHORT[monthIndex];
    const datePart = `${day} ${month} ${year}`;

    if (!withTime) return datePart;

    return `${datePart} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Thai abbreviated date, e.g. `6 พ.ย. 2569`. */
export function formatDateTh(input: DateInput, options?: Omit<FormatDateOptions, "locale">): string {
    return formatDate(input, { ...options, locale: "th" });
}

/** Thai abbreviated date + time, e.g. `6 พ.ย. 2569 11:05`. */
export function formatDateTimeTh(input: DateInput, options?: Omit<FormatDateOptions, "locale" | "withTime">): string {
    return formatDate(input, { ...options, locale: "th", withTime: true });
}
