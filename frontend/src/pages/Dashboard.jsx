import { useCallback, useEffect, useState } from "react";

import { Box, CircularProgress, Container, Grid } from "@mui/material";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../components/Navbar";
import AnalyticsCards from "../components/AnalyticsCard";
import ProductTable from "../components/ProductTable";
import OrderForm from "../components/OrderForm";
import OrdersTable from "../components/OrdersTable";

import { createOrder, getOrders, getProducts } from "../api/orderApi";
import { getAnalytics } from "../api/analyticsApi";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});

  const [loading, setLoading] = useState(true);

  const [serviceStatus, setServiceStatus] = useState({
    products: true,
    orders: true,
    analytics: true,
  });

  const loadDashboard = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    const results = await Promise.allSettled([
      getProducts(),
      getOrders(),
      getAnalytics(),
    ]);

    const [productsResult, ordersResult, analyticsResult] = results;

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value);

      setServiceStatus((prev) => ({
        ...prev,
        products: true,
      }));
    } else {
      setProducts([]);

      setServiceStatus((prev) => ({
        ...prev,
        products: false,
      }));
    }

    if (ordersResult.status === "fulfilled") {
      setOrders(ordersResult.value);

      setServiceStatus((prev) => ({
        ...prev,
        orders: true,
      }));
    } else {
      setOrders([]);

      setServiceStatus((prev) => ({
        ...prev,
        orders: false,
      }));
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalytics(analyticsResult.value);

      setServiceStatus((prev) => ({
        ...prev,
        analytics: true,
      }));
    } else {
      setAnalytics({});

      setServiceStatus((prev) => ({
        ...prev,
        analytics: false,
      }));
    }

    if (showLoader) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handlePlaceOrder = async (data) => {
    try {
      await createOrder(data);

      toast.success("Order initiated successfully.");

      setTimeout(() => loadDashboard(false), 3000);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to place order");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <AnalyticsCards
          analytics={analytics}
          serviceAvailable={serviceStatus.analytics}
        />

        <OrderForm
          products={products}
          onPlaceOrder={handlePlaceOrder}
          serviceAvailable={serviceStatus.products && serviceStatus.orders}
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <ProductTable
              products={products}
              serviceAvailable={serviceStatus.products}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <OrdersTable
              orders={orders}
              serviceAvailable={serviceStatus.orders}
            />
          </Grid>
        </Grid>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default Dashboard;
