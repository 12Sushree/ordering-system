import { Alert, Card, CardContent, Grid, Typography } from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

function AnalyticsCards({ analytics, serviceAvailable }) {
  if (!serviceAvailable) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Analytics Service is currently unavailable. Dashboard is still working
        using the remaining services.
      </Alert>
    );
  }

  const cards = [
    {
      title: "Total Orders",
      value: analytics?.totalOrders ?? 0,
      color: "#1976d2",
      icon: <ShoppingCartIcon sx={{ fontSize: 42 }} />,
    },
    {
      title: "Confirmed",
      value: analytics?.confirmedOrders ?? 0,
      color: "#2e7d32",
      icon: <CheckCircleIcon sx={{ fontSize: 42 }} />,
    },
    {
      title: "Rejected",
      value: analytics?.rejectedOrders ?? 0,
      color: "#d32f2f",
      icon: <CancelIcon sx={{ fontSize: 42 }} />,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, md: 4 }} key={card.title}>
          <Card
            elevation={5}
            sx={{
              borderLeft: `6px solid ${card.color}`,
              borderRadius: 3,
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 8,
              },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Typography variant="subtitle2" color="text.secondary">
                  {card.title}
                </Typography>

                <Typography variant="h3" fontWeight="bold" color={card.color}>
                  {card.value}
                </Typography>
              </div>

              <div style={{ color: card.color }}>{card.icon}</div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default AnalyticsCards;
