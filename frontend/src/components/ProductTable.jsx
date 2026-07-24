import { useMemo, useState } from "react";

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

function ProductTable({ products, serviceAvailable }) {
  const items = products?.items || [];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((product) => {
      const haystack = [
        product.productId,
        product.title,
        product.category,
        product.brand,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [items, search]);

  const visibleProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

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
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight={700}>
              Stock Overview
            </Typography>

            <Chip
              label={`${filteredProducts.length} products`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <TextField
            label="Search inventory"
            placeholder="Search by product, category, brand or ID"
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
          <Alert severity="warning">
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
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
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
                  {visibleProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleProducts.map((product, index) => (
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
                          ₹ {Number(product.price).toLocaleString("en-IN")}
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
              count={filteredProducts.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number.parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 12, 25, 50, 100]}
            />

            <Typography variant="caption" color="text.secondary">
              Showing {visibleProducts.length} of {filteredProducts.length}{" "}
              products
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductTable;
