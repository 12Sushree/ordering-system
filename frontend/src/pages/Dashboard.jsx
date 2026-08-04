import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Stack,
  TextField,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/NavBar";
import AnalyticsCards from "../components/AnalyticsCard";
import DeferredOrdersPanel from "../components/DeferredOrdersPanel";
import ProductTable from "../components/ProductTable";
import OrderForm from "../components/OrderForm";
import OrdersTable from "../components/OrdersTable";
import AdminUsersTable from "../components/AdminUsersTable";
import PasswordField from "../components/PasswordField";
import { createOrder, getOrders } from "../api/orderApi";
import { getInventory, getProducts } from "../api/inventoryApi";
import { getAnalytics } from "../api/analyticsApi";
import { getServiceHealth } from "../api/healthApi";
import {
  getUsers,
  registerAdmin as registerAdminRequest,
} from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";

const SERVICE_KEYS = ["order", "inventory", "notification", "analytics"];

function Dashboard() {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const { replace } = useRouter();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState({ items: [] });
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderDataReady, setOrderDataReady] = useState(true);
  const [healthChecked, setHealthChecked] = useState(false);
  const [serviceHealth, setServiceHealth] = useState({
    order: true,
    inventory: true,
    notification: true,
    analytics: true,
  });
  const [superUsers, setSuperUsers] = useState({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [superUsersSearch, setSuperUsersSearch] = useState("");
  const [superUsersPage, setSuperUsersPage] = useState(1);
  const [superUsersLimit, setSuperUsersLimit] = useState(10);
  const [superCreateLoading, setSuperCreateLoading] = useState(false);
  const [superCreateError, setSuperCreateError] = useState("");
  const [superCreateSuccess, setSuperCreateSuccess] = useState("");
  const [superCreateForm, setSuperCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [superActiveSection, setSuperActiveSection] = useState("create");

  const handleUnauthorized = useCallback(() => {
    logout();
    replace("/login");
  }, [logout, replace]);

  const loadDashboard = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      const requests = [];

      if (!isAdmin) {
        requests.push({ key: "products", promise: getProducts() });
      }

      requests.push({ key: "orders", promise: getOrders() });

      if (isAdmin) {
        requests.push({
          key: "inventory",
          promise: getInventory({ limit: 1000 }),
        });
        requests.push({ key: "analytics", promise: getAnalytics() });
      }

      const results = await Promise.allSettled(
        requests.map((request) => request.promise),
      );

      const unauthorizedResult = results.find(
        (result) =>
          result.status === "rejected" &&
          result.reason?.response?.status === 401,
      );
      if (unauthorizedResult) {
        if (showLoader) {
          setLoading(false);
        }
        handleUnauthorized();
        return;
      }

      let resultIndex = 0;

      if (!isAdmin) {
        const nextProducts = results[resultIndex++];
        setProducts(
          nextProducts.status === "fulfilled"
            ? nextProducts.value?.items || nextProducts.value || []
            : [],
        );

        const nextOrders = results[resultIndex++];
        setOrders(
          nextOrders.status === "fulfilled"
            ? nextOrders.value?.items || nextOrders.value || []
            : [],
        );
        setOrderDataReady(
          nextProducts.status === "fulfilled" &&
            nextOrders.status === "fulfilled",
        );

        setInventory([]);
        setAnalytics({});
      } else {
        setProducts([]);

        const nextOrders = results[resultIndex++];
        setOrders(
          nextOrders.status === "fulfilled"
            ? nextOrders.value?.items || nextOrders.value || []
            : [],
        );
        setOrderDataReady(nextOrders.status === "fulfilled");

        const nextInventory = results[resultIndex++];
        const nextAnalytics = results[resultIndex++];

        setInventory(
          nextInventory.status === "fulfilled"
            ? nextInventory.value || { items: [] }
            : { items: [] },
        );
        setAnalytics(
          nextAnalytics.status === "fulfilled" ? nextAnalytics.value : {},
        );
      }

      if (showLoader) {
        setLoading(false);
      }
    },
    [isAdmin],
  );

  const loadSuperAdminData = useCallback(
    async (showLoader = false, overrides = {}) => {
      if (showLoader) {
        setLoading(true);
      }

      const nextPage = overrides.page ?? superUsersPage;
      const nextLimit = overrides.limit ?? superUsersLimit;
      const nextSearch = overrides.search ?? superUsersSearch;

      try {
        const result = await getUsers({
          page: nextPage,
          limit: nextLimit,
          search: nextSearch,
        });

        setSuperUsers(
          result || {
            items: [],
            page: nextPage,
            limit: nextLimit,
            total: 0,
            totalPages: 1,
          },
        );
      } catch (error) {
        setSuperCreateError(
          error?.response?.data?.message || "Unable to load accounts",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [superUsersLimit, superUsersPage, superUsersSearch],
  );

  const refreshHealth = useCallback(async () => {
    const results = await Promise.allSettled(
      SERVICE_KEYS.map((serviceName) => getServiceHealth(serviceName)),
    );

    const nextHealth = SERVICE_KEYS.reduce(
      (accumulator, serviceName, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          const response = result.value;
          accumulator[serviceName] =
            response?.ok ??
            response?.data?.ok ??
            response?.data?.status === "UP";
        } else {
          accumulator[serviceName] = false;
        }

        return accumulator;
      },
      {},
    );

    setServiceHealth(nextHealth);
    setHealthChecked(true);
  }, []);

  const handleSuperCreateChange = (event) => {
    setSuperCreateForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSuperCreateSubmit = async (event) => {
    event.preventDefault();
    setSuperCreateLoading(true);
    setSuperCreateError("");
    setSuperCreateSuccess("");

    try {
      await registerAdminRequest(superCreateForm);
      setSuperCreateSuccess("Admin account created successfully.");
      setSuperCreateForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      await loadSuperAdminData(false, { page: 1 });
    } catch (error) {
      setSuperCreateError(
        error?.response?.data?.message || "Unable to create admin account",
      );
    } finally {
      setSuperCreateLoading(false);
    }
  };

  const switchSuperSection = (section) => {
    setSuperActiveSection(section);
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadSuperAdminData(true);
      return;
    }
    loadDashboard(true);
    refreshHealth();
  }, [isSuperAdmin, loadDashboard, loadSuperAdminData, refreshHealth]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSuperAdmin) {
        loadSuperAdminData(false);
        return;
      }
      loadDashboard(false);
      refreshHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [isSuperAdmin, loadDashboard, loadSuperAdminData, refreshHealth]);

  const downServices = useMemo(
    () =>
      Object.entries(serviceHealth)
        .filter(([, isHealthy]) => !isHealthy)
        .map(([name]) => name),
    [serviceHealth],
  );

  const orderServiceReady = serviceHealth.order && orderDataReady;
  const hasSelectableProducts = products.length > 0;
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "PENDING"),
    [orders],
  );
  const hasPendingOrders = pendingOrders.length > 0;
  const canPlaceOrder = orderServiceReady && !hasPendingOrders;

  const handlePlaceOrder = async (data) => {
    try {
      const response = await createOrder(data);
      const payload = response?.data || {};

      if (
        !payload.duplicate &&
        !payload.deferred &&
        downServices.length === 0 &&
        serviceHealth.order
      ) {
        toast.success(response?.message || "Order initiated successfully", {
          autoClose: 3000,
        });
      } else if (payload.duplicate) {
        toast.info(
          response?.message ||
            "Order already exists and will be processed later.",
          {
            autoClose: 3500,
          },
        );
      } else if (
        payload.deferred ||
        downServices.length > 0 ||
        !serviceHealth.order
      ) {
        toast.warning(
          response?.message ||
            "Order saved. One service is down, we will process it later.",
          {
            autoClose: 4500,
          },
        );
      }

      await loadDashboard(false);

      return response;
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = error?.response?.data?.message || "Unable to place order";
      toast.error(message);
      throw error;
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

  if (isSuperAdmin) {
    return (
      <>
        <Navbar />

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant={
                  superActiveSection === "create" ? "contained" : "outlined"
                }
                onClick={() => switchSuperSection("create")}
              >
                Create Admin
              </Button>

              <Button
                variant={
                  superActiveSection === "accounts" ? "contained" : "outlined"
                }
                onClick={() => switchSuperSection("accounts")}
              >
                See All Accounts
              </Button>
            </Stack>

            {superActiveSection === "create" ? (
              <Card elevation={4} sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  {superCreateError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {superCreateError}
                    </Alert>
                  )}

                  {superCreateSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      {superCreateSuccess}
                    </Alert>
                  )}

                  <Stack
                    spacing={2}
                    component="form"
                    onSubmit={handleSuperCreateSubmit}
                  >
                    <TextField
                      label="Name"
                      name="name"
                      value={superCreateForm.name}
                      onChange={handleSuperCreateChange}
                      required
                      fullWidth
                    />

                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={superCreateForm.email}
                      onChange={handleSuperCreateChange}
                      required
                      fullWidth
                    />

                    <PasswordField
                      label="Password"
                      name="password"
                      value={superCreateForm.password}
                      onChange={handleSuperCreateChange}
                      required
                      fullWidth
                    />

                    <PasswordField
                      label="Confirm Password"
                      name="confirmPassword"
                      value={superCreateForm.confirmPassword}
                      onChange={handleSuperCreateChange}
                      required
                      fullWidth
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={superCreateLoading}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {superCreateLoading ? "Creating..." : "Create admin"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <AdminUsersTable
                users={superUsers}
                serviceAvailable
                onSearchChange={(value) => {
                  setSuperUsersSearch(value);
                  setSuperUsersPage(1);
                  loadSuperAdminData(false, {
                    page: 1,
                    limit: superUsersLimit,
                    search: value,
                  });
                }}
                search={superUsersSearch}
                page={superUsers.page}
                limit={superUsers.limit}
                total={superUsers.total}
                onPageChange={(page, limit) => {
                  const nextLimit = limit || superUsersLimit;
                  setSuperUsersPage(page);
                  setSuperUsersLimit(nextLimit);
                  loadSuperAdminData(false, {
                    page,
                    limit: nextLimit,
                    search: superUsersSearch,
                  });
                }}
              />
            )}
          </Stack>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {console.log(serviceHealth)}

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          {!isAdmin && orderDataReady && !hasSelectableProducts && (
            <Alert severity="info">
              No products are currently available for ordering.
            </Alert>
          )}
        </Stack>

        {isAdmin && (
          <AnalyticsCards
            analytics={analytics}
            serviceAvailable={serviceHealth.analytics}
          />
        )}

        {!isAdmin && (
          <>
            <DeferredOrdersPanel orders={orders} />

            <OrderForm
              products={products}
              onPlaceOrder={handlePlaceOrder}
              serviceAvailable={canPlaceOrder}
              userName={user?.name}
              userEmail={user?.email}
              blockMessage={
                hasPendingOrders
                  ? "You already have a pending order. Please wait until it is processed before placing another one."
                  : null
              }
            />
          </>
        )}

        <Grid container spacing={2}>
          {isAdmin && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <ProductTable
                products={inventory}
                serviceAvailable={serviceHealth.inventory}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, lg: isAdmin ? 6 : 12 }}>
            <OrdersTable
              orders={orders}
              serviceAvailable={orderServiceReady}
              title={isAdmin ? "All Orders" : "My Orders"}
              showCustomer={isAdmin}
            />
          </Grid>
        </Grid>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default Dashboard;
