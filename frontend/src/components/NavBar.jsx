import {
  AppBar,
  Avatar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, rgba(11,47,76,0.98) 0%, rgba(15,61,102,0.98) 55%, rgba(18,72,111,0.98) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", gap: 2, py: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.14)",
              color: "#fff",
              fontWeight: 800,
              width: 44,
              height: 44,
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {initials}
          </Avatar>

          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 2.2 }}>
              Ordering System
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Box sx={{ textAlign: "right", minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{ color: "#fff", fontWeight: 500, lineHeight: 1.0 }}
              noWrap
            >
              {user?.name}
            </Typography>
          </Box>

          <Button
            onClick={logout}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "rgba(255,255,255,0.28)",
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.06)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.45)",
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
