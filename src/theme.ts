import { createTheme } from "@mui/material/styles";

const sharedTypography = {
  fontFamily: "'Outfit', 'Inter', 'Roboto', 'sans-serif'",
  h1: { fontWeight: 700, fontSize: "2.5rem", letterSpacing: "-0.025em" },
  h2: { fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.02em" },
  h3: { fontWeight: 600, fontSize: "1.75rem" },
  h4: { fontWeight: 600, fontSize: "1.5rem" },
  h5: { fontWeight: 600, fontSize: "1.25rem" },
  h6: { fontWeight: 600, fontSize: "1rem" },
  body1: { fontSize: "1rem", lineHeight: 1.5 },
  body2: { fontSize: "0.875rem", lineHeight: 1.5 },
  button: { textTransform: "none" as const, fontWeight: 600 },
};

const sharedShape = { borderRadius: 8 };

const sharedComponents = (mode: "dark" | "light") => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        padding: "7px 16px",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
        },
        "&:active": { transform: "translateY(0)" },
      },
      containedSecondary: {
        "&:hover": { boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: mode === "dark" ? "#111827" : "#ffffff",
        backgroundImage:
          mode === "dark"
            ? "linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0))"
            : "none",
        borderRadius: 10,
        border: mode === "dark"
          ? "1px solid rgba(255, 255, 255, 0.05)"
          : "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow:
          mode === "dark"
            ? "0 4px 16px -4px rgba(0, 0, 0, 0.5)"
            : "0 1px 6px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        overflow: "hidden",
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: "outlined" as const, size: "small" as const },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 7,
        backgroundColor:
          mode === "dark" ? "rgba(17, 24, 39, 0.5)" : "rgba(248, 250, 252, 0.8)",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor:
            mode === "dark" ? "rgba(17, 24, 39, 0.8)" : "rgba(241, 245, 249, 1)",
        },
        "&.Mui-focused": {
          backgroundColor: mode === "dark" ? "#111827" : "#ffffff",
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom:
          mode === "dark"
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.07)",
        padding: "11px 16px",
      },
      head: {
        fontWeight: 700,
        backgroundColor: mode === "dark" ? "#1f2937" : "#f8fafc",
        color: mode === "dark" ? "#f3f4f6" : "#374151",
        fontSize: "0.8rem",
        textTransform: "uppercase" as const,
        letterSpacing: "0.04em",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 6 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 12 },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0d9488", light: "#2dd4bf", dark: "#0f766e", contrastText: "#ffffff" },
    secondary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5", contrastText: "#ffffff" },
    background: { default: "#0b0f19", paper: "#111827" },
    text: { primary: "#f3f4f6", secondary: "#9ca3af" },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: sharedComponents("dark") as any,
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0d9488", light: "#2dd4bf", dark: "#0f766e", contrastText: "#ffffff" },
    secondary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5", contrastText: "#ffffff" },
    background: { default: "#f1f5f9", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#6b7280" },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: sharedComponents("light") as any,
});

// default export kept for backward compat
export const theme = darkTheme;
export default darkTheme;
