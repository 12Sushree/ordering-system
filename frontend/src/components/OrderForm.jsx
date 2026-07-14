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

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readPendingRequestId() {
  if (typeof sessionStorage === "undefined") {
    return createRequestId();
  }

  return sessionStorage.getItem("pendingOrderRequestId") || createRequestId();
}

function OrderForm({
  products,
  onPlaceOrder,
  serviceAvailable = true,
  userName,
  userEmail,
  blockMessage = null,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientRequestId, setClientRequestId] = useState(() => readPendingRequestId());

  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct || submitting) {
      return;
    }

    setSubmitting(true);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("pendingOrderRequestId", clientRequestId);
    }

    try {
      await onPlaceOrder({
        productId: Number(selectedProduct.productId),
        quantity: Number(formData.quantity),
        clientRequestId,
      });

      setFormData({
        productId: "",
        quantity: 1,
      });

      setSelectedProduct(null);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("pendingOrderRequestId");
      }
      setClientRequestId(createRequestId());
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = !serviceAvailable || submitting;

  return (
    <Card elevation={4} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Place Order
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Orders are placed as <strong>{userName}</strong> &lt;{userEmail}&gt;.
        </Typography>

        {blockMessage ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {blockMessage}
          </Alert>
        ) : !serviceAvailable ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Order service is currently unavailable.</strong>
            <br />
            You can review existing data, but new orders cannot be submitted
            right now.
          </Alert>
        ) : null}

        <Grid container spacing={2} component="form" onSubmit={handleSubmit}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={products}
              disabled={isDisabled}
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

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Qty"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              disabled={isDisabled}
              inputProps={{
                min: 1,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Total Price"
              value={`Rs. ${Number(totalPrice).toLocaleString("en-IN")}`}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isDisabled || !selectedProduct}
            >
              {submitting ? "Submitting..." : "Place Order"}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OrderForm;
