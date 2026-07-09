import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

function OrderForm({ products, onPlaceOrder, serviceAvailable = true }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    productId: "",
    quantity: 1,
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;

    return Number(selectedProduct.price) * Number(formData.quantity || 0);
  }, [selectedProduct, formData.quantity]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    onPlaceOrder({
      ...formData,
      productId: Number(selectedProduct.productId),
      quantity: Number(formData.quantity),
    });

    setFormData({
      customerName: "",
      customerEmail: "",
      productId: "",
      quantity: 1,
    });

    setSelectedProduct(null);
  };

  return (
    <Card elevation={4} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Place Order
        </Typography>

        {!serviceAvailable && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Order Service is currently unavailable.</strong>
            <br />
            New orders cannot be placed right now.
            <br />
            Other services are still working normally.
          </Alert>
        )}

        <Grid container spacing={2} component="form" onSubmit={handleSubmit}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              disabled={!serviceAvailable}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              disabled={!serviceAvailable}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Autocomplete
              options={products}
              disabled={!serviceAvailable}
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue);

                setFormData((prev) => ({
                  ...prev,
                  productId: newValue ? newValue.productId : "",
                }));
              }}
              getOptionLabel={(option) => option.title}
              isOptionEqualToValue={(option, value) =>
                option.productId === value.productId
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Product" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Qty"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              disabled={!serviceAvailable}
              inputProps={{
                min: 1,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              label="Total Price"
              value={`₹${Number(totalPrice).toLocaleString("en-IN")}`}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!serviceAvailable || !selectedProduct}
            >
              Place Order
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OrderForm;
