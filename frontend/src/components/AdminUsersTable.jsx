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

function AdminUsersTable({ users, serviceAvailable }) {
  const items = users?.items || [];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((user) => {
      const haystack = [
        user.name,
        user.email,
        user.role,
        user.isSuperAdmin ? "super admin" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [items, search]);

  const visibleUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Card elevation={4} sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight={800}>
              All Accounts
            </Typography>

            <Chip
              label={`${filteredUsers.length} users`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <TextField
            label="Search users"
            placeholder="Search by name or email"
            size="small"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            fullWidth
          />

          {!serviceAvailable ? (
            <Alert severity="warning">
              User management is temporarily unavailable.
            </Alert>
          ) : (
            <>
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 450,
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
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {visibleUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleUsers.map((user, index) => (
                        <TableRow
                          key={user._id}
                          hover
                          sx={{
                            backgroundColor:
                              index % 2 === 0 ? "#fafafa" : "#ffffff",
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight="bold">
                              {user.name}
                            </Typography>

                            {user.isSuperAdmin && (
                              <Chip
                                label="Super Admin"
                                size="small"
                                color="secondary"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </TableCell>

                          <TableCell>{user.email}</TableCell>

                          <TableCell>{user.role}</TableCell>

                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredUsers.length}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number.parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />

              <Typography variant="caption" color="text.secondary">
                Showing {visibleUsers.length} of {filteredUsers.length} users
              </Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default AdminUsersTable;
