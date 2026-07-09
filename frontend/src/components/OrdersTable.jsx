import {
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

function OrdersTable({ orders, serviceAvailable }) {
  const getStatusChip = (status) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Chip
            label="CONFIRMED"
            color="success"
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        );

      case "REJECTED":
        return (
          <Chip
            label="REJECTED"
            color="error"
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        );

      default:
        return (
          <Chip
            label="PENDING"
            color="warning"
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        );
    }
  };

  return (
    <Card elevation={4}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order History
        </Typography>

        {!serviceAvailable ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Order Service Unavailable</strong>
            <br />
            Unable to fetch order history.
            <br />
            Other services are still working normally.
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 500,
              overflow: "auto",
            }}
          >
            <Table stickyHeader>
              <TableHead
                sx={{
                  "& .MuiTableCell-head": {
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    fontWeight: "bold",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  },
                }}
              >
                <TableRow>
                  <TableCell>Order ID</TableCell>

                  <TableCell>Customer</TableCell>

                  <TableCell>Product</TableCell>

                  <TableCell align="center">Qty</TableCell>

                  <TableCell align="right">Total</TableCell>

                  <TableCell align="center">Status</TableCell>

                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Orders Found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order, index) => (
                    <TableRow
                      key={order._id}
                      hover
                      sx={{
                        backgroundColor:
                          index % 2 === 0 ? "#fafafa" : "#ffffff",
                      }}
                    >
                      <TableCell>{order._id.slice(-8)}</TableCell>

                      <TableCell>
                        <Typography fontWeight="bold">
                          {order.customerName}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {order.customerEmail}
                        </Typography>
                      </TableCell>

                      <TableCell>{order.productTitle}</TableCell>

                      <TableCell align="center">{order.quantity}</TableCell>

                      <TableCell align="right">
                        ₹{Number(order.totalPrice).toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell align="center">
                        {getStatusChip(order.status)}
                      </TableCell>

                      <TableCell>
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default OrdersTable;
