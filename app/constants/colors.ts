/* Check user color scheme */
export const colors = {
  light: {
    type: "light",
    background: "#fff",
    text: "#000",
    card: "rgba(0, 0, 0, 0.05)",
    primary: "#007AFF",
    secondary: "#5856D6",
    caution: "#FF3B30",
    action: "#c4c4c4",
    disabled: "rgba(0, 0, 0, 0.3)",
  },
  dark: {
    type: "dark",
    background: "#000",
    text: "#fff",
    card: "rgba(255, 255, 255, 0.05)",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    caution: "#FF3B30",
    action: "#404040",
    disabled: "rgba(255, 255, 255, 0.3)",
  },
};

export type Theme = typeof colors.light;