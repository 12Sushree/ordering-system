import {
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "./context/RouterContext";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";

const appTheme = createTheme({
  palette: {
    primary: {
      main: "#0f3d66",
    },
    secondary: {
      main: "#d97706",
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
});

function App() {
  const { loading, isAuthenticated } = useAuth();
  const { pathname, replace } = useRouter();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isDashboardRoute = pathname === "/dashboard";
  const routeReady = isAuthenticated ? isDashboardRoute : isAuthRoute;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      if (!isAuthRoute) {
        replace("/login");
      }
      return;
    }

    if (pathname !== "/dashboard") {
      replace("/dashboard");
    }
  }, [isAuthenticated, isAuthRoute, loading, pathname, replace]);

  if (loading) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {!routeReady ? (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : !isAuthenticated ? (
        pathname === "/register" ? (
          <RegisterPage />
        ) : pathname === "/forgot-password" ||
          pathname === "/reset-password" ? (
          <ForgotPasswordPage />
        ) : (
          <LoginPage />
        )
      ) : (
        <Dashboard />
      )}
    </ThemeProvider>
  );
}

export default App;
