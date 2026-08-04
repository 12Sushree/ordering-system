import { useState } from "react";
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
import { requestPasswordReset, resetPassword } from "../api/authApi";
import { useRouter } from "../context/RouterContext";
import PasswordField from "./PasswordField";

function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await requestPasswordReset({ email });
      if (!result?.resetToken) {
        setError("No account found with that email address.");
        return;
      }
      setResetToken(result.resetToken);
      setStep("reset");
      setMessage("Account found. Set a new password below.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to request password reset",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPassword({
        token: resetToken,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setMessage("Password updated successfully.");
      setStep("email");
      setEmail("");
      setResetToken("");
      setFormData({
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reset password");
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
              Reset password
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
              Enter your email first. If the account exists, we will let you set
              a new password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {step === "email" ? (
              <Stack spacing={2} component="form" onSubmit={handleEmailSubmit}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check account"}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2} component="form" onSubmit={handleResetSubmit}>
                <PasswordField
                  label="New Password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                />

                <PasswordField
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </Stack>
            )}

            <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
              Back to{" "}
              <Button
                variant="text"
                onClick={() => navigate("/login")}
                sx={{ p: 0, minWidth: 0, fontWeight: 700 }}
              >
                sign in
              </Button>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default ForgotPasswordPage;
