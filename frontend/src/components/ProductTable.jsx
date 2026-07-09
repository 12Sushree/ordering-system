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

function ProductTable({ products, serviceAvailable }) {
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

  return (
    <Card elevation={4} sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Product Inventory
        </Typography>

        {!serviceAvailable ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Product Service Unavailable</strong>
            <br />
            Unable to fetch product inventory.
            <br />
            Other services are still running normally.
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
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No Products Available
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
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
                        ₹{Number(product.price).toLocaleString("en-IN")}
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
        )}
      </CardContent>
    </Card>
  );
}

export default ProductTable;
