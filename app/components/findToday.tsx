function capitalizeFirst(str: string) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

export default function FindToday(day?: string) {
    day ??= new Date().toISOString().split('T')[0];
    const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return capitalizeFirst(new Date(day).toLocaleDateString(deviceLocale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }));
}