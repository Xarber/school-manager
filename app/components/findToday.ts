import { localeMap } from "@/constants/i18n";

function capitalizeFirst(str: string) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

export default function findToday(language: any, day?: string) {
    day ??= new Date().toISOString().split('T')[0];

    const locale = language.locale;
    const dateLocale = localeMap[locale];
    const deviceLocale = dateLocale ?? Intl.DateTimeFormat().resolvedOptions().locale;

    return capitalizeFirst(new Date(day).toLocaleDateString(deviceLocale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }));
}