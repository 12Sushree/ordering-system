import {
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

function AdminUsersTable({
  users,
  serviceAvailable,
  onSearchChange,
  search,
  page,
  limit,
  total,
  onPageChange,
}) {
  const items = users?.items || [];
  const totalPages = users?.totalPages || 1;

  return (
    <Card elevation={4} sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight={800}>
              All accounts
            </Typography>

            <Chip
              label={`${total || 0} users`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <TextField
            size="small"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            label="Search users"
            placeholder="Search by name or email"
            fullWidth
          />

          {!serviceAvailable ? (
            <Alert severity="warning">User management is temporarily unavailable.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Typography fontWeight={700}>{user.name}</Typography>
                          {user.isSuperAdmin && (
                            <Chip
                              size="small"
                              label="Super Admin"
                              color="secondary"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={total || 0}
            page={Math.max(page - 1, 0)}
            onPageChange={(_, nextPage) => onPageChange?.(nextPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(event) =>
              onPageChange?.(1, Number.parseInt(event.target.value, 10))
            }
            rowsPerPageOptions={[5, 10, 20]}
          />

          <Typography variant="caption" color="text.secondary">
            Page {page} of {totalPages}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default AdminUsersTable;
