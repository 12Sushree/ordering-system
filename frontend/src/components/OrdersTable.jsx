import {
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

function OrdersTable({
  orders,
  serviceAvailable,
  title = "Order History",
  showCustomer = false,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return orders || [];
    }

    return (orders || []).filter((order) => {
      const haystack = [
        order._id,
        order.customerName,
        order.customerEmail,
        order.productTitle,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [orders, search]);

  const visibleOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Card elevation={4}>
      <CardContent>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>

          <TextField
            label="Search orders"
            size="small"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            fullWidth
          />
        </Stack>

        {!serviceAvailable ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Order service unavailable</strong>
            <br />
            Unable to fetch order history right now.
          </Alert>
        ) : (
          <>
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
                      backgroundColor: "#0f3d66",
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
                    {showCustomer && <TableCell>Customer</TableCell>}
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {visibleOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showCustomer ? 7 : 6} align="center">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleOrders.map((order, index) => (
                      <TableRow
                        key={order._id}
                        hover
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "#fafafa" : "#ffffff",
                        }}
                      >
                        <TableCell>{order._id.slice(-8)}</TableCell>
                        {showCustomer && (
                          <TableCell>
                            <Typography fontWeight="bold">
                              {order.customerName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {order.customerEmail}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography fontWeight="bold">
                            {order.productTitle}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{order.quantity}</TableCell>
                        <TableCell align="center">
                          Rs. {Number(order.totalPrice).toLocaleString("en-IN")}
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

            <TablePagination
              component="div"
              count={filteredOrders.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number.parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OrdersTable;
