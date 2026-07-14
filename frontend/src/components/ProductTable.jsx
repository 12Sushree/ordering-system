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

function ProductTable({
  products,
  serviceAvailable,
  search,
  onSearchChange,
  page,
  rowsPerPage,
  total,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) {
  const getStockChip = (stock) => {
    if (stock === 0) {
      return (
        <Chip
          label="Out of Stock"
          color="error"
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      );
    }

    if (stock <= 5) {
      return (
        <Chip
          label="Low Stock"
          color="warning"
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      );
    }

    return (
      <Chip
        label="In Stock"
        color="success"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  };

  const items = products?.items || [];

  return (
    <Card elevation={4} sx={{ mb: 4 }}>
      <CardContent>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Stock Overview
          </Typography>

          <TextField
            label="Search inventory"
            size="small"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            fullWidth
          />
        </Stack>

        {!serviceAvailable ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Inventory service unavailable</strong>
            <br />
            Unable to fetch stock availability.
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
                      borderBottom: "none",
                      borderRight: "none",
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Product ID</TableCell>

                    <TableCell>Product</TableCell>

                    <TableCell align="right">Price</TableCell>

                    <TableCell align="center">Stock</TableCell>

                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No products available
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((product, index) => (
                      <TableRow
                        key={product.productId}
                        hover
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "#fafafa" : "#ffffff",
                        }}
                      >
                        <TableCell>{product.productId}</TableCell>

                        <TableCell>
                          <Typography fontWeight="bold">
                            {product.title}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {product.category}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          Rs. {Number(product.price).toLocaleString("en-IN")}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            color:
                              product.stock === 0
                                ? "red"
                                : product.stock <= 5
                                  ? "#ff9800"
                                  : "green",
                            fontWeight: "bold",
                          }}
                        >
                          {product.stock}
                        </TableCell>

                        <TableCell align="center">
                          {getStockChip(product.stock)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total || 0}
              page={Math.max((page || 1) - 1, 0)}
              onPageChange={(_, nextPage) => onPageChange?.(nextPage + 1)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) =>
                onRowsPerPageChange?.(Number.parseInt(event.target.value, 10))
              }
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />

            <Typography variant="caption" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductTable;
