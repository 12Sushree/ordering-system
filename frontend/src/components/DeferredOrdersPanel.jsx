import {
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

function formatOrderLabel(order) {
  return `${order.productTitle} - ${order.quantity}`;
}

function DeferredOrdersPanel({ orders }) {
  const pendingOrders = orders.filter((order) => order.status === "PENDING");

  return (
    <Card elevation={4} sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            flexWrap="wrap"
          >
            <Typography variant="h6">Deferred Orders</Typography>

            <Chip
              label={`${pendingOrders.length} pending`}
              color={pendingOrders.length > 0 ? "warning" : "success"}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Alert severity={pendingOrders.length > 0 ? "warning" : "success"}>
            {pendingOrders.length > 0
              ? "One or more orders are saved and waiting for downstream services to recover."
              : "There are no deferred orders right now."}
          </Alert>

          {pendingOrders.length > 0 && (
            <Stack spacing={1.5}>
              {pendingOrders.map((order, index) => (
                <Stack key={order._id} spacing={1}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography fontWeight={700}>
                      {formatOrderLabel(order)}
                    </Typography>

                    <Chip label="Waiting" color="warning" size="small" />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Saved at {new Date(order.createdAt).toLocaleString("en-IN")}
                  </Typography>

                  {index < pendingOrders.length - 1 && <Divider />}
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default DeferredOrdersPanel;
