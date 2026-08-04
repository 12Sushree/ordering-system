import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import PasswordField from "./PasswordField";

function readFlashMessage() {
  if (typeof sessionStorage === "undefined") {
    return "";
  }

  const message = sessionStorage.getItem("authFlash") || "";
  if (message) {
    sessionStorage.removeItem("authFlash");
  }

  return message;
}

function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flashMessage] = useState(() => readFlashMessage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedEmail = sessionStorage.getItem("pendingLoginEmail");
    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
      }));
      sessionStorage.removeItem("pendingLoginEmail");
    }
  }, []);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(formData);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 4,
        background:
          "linear-gradient(120deg, #0f3d66 0%, #123b5d 48%, #f4f7fb 48%, #f4f7fb 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={10}
          sx={{
            borderRadius: 4,
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.96)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Sign in
            </Typography>

            {flashMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {flashMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
              />

              <PasswordField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
              New here?{" "}
              <Button
                variant="text"
                onClick={() => navigate("/register")}
                sx={{ p: 0, minWidth: 0, fontWeight: 700 }}
              >
                Register user
              </Button>
            </Typography>

            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Forgot your password?{" "}
              <Button
                variant="text"
                onClick={() => navigate("/forgot-password")}
                sx={{ p: 0, minWidth: 0, fontWeight: 700 }}
              >
                Reset it
              </Button>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default LoginPage;
