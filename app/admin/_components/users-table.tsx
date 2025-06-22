/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import React, { useState, useMemo } from "react";
import { DataTableColumnHeader } from "@/components/datatable/coulumn-header";
import { DataTableFacetedFilter } from "@/components/datatable/faceted-filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DownloadIcon,
  CheckIcon,
  XIcon,
  BanIcon,
  MoreHorizontalIcon,
  UserIcon,
  ShieldIcon,
  Loader2,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUsers,
  approveUser,
  rejectUser,
  suspendUser,
  changeUserRole,
  exportUsersToCSV,
} from "@/actions/admins";
import { UserWithConfig, UserSearchOptions } from "@/lib/services/user";

const columns: ColumnDef<UserWithConfig>[] = [
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    accessorFn: (row) => row.user.name,
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string;
      return name?.toLowerCase().includes(value.toLowerCase());
    },
    cell: ({ row }) => {
      const { user, config } = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{config.fullName}</div>
        </div>
      );
    },
  },
  {
    id: "email",
    header: "Email",
    accessorFn: (row) => row.user.email,
    filterFn: (row, id, value) => {
      const email = row.getValue(id) as string;
      return email?.toLowerCase().includes(value.toLowerCase());
    },
    cell: ({ row }) => {
      const { user } = row.original;
      return (
        <div className="space-y-1">
          <div>{user.email}</div>
          {user.emailVerified && (
            <Badge variant="outline" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "class",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    accessorFn: (row) => row.config.class,
    filterFn: (row, id, value) => {
      const classValue = row.getValue(id) as string;
      return value.includes(classValue);
    },
    cell: ({ row }) => {
      const { config } = row.original;
      return <div>{config.class}</div>;
    },
  },
  {
    id: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    accessorFn: (row) => row.config.section,
    filterFn: (row, id, value) => {
      const section = row.getValue(id) as string;
      return value.includes(section);
    },
    cell: ({ row }) => {
      const { config } = row.original;
      return <div>{config.section}</div>;
    },
  },
  {
    id: "rollNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Roll No." />
    ),
    accessorFn: (row) => row.config.rollNo,
    filterFn: (row, id, value) => {
      const rollNo = row.getValue(id) as string;
      return rollNo?.toLowerCase().includes(value.toLowerCase());
    },
    cell: ({ row }) => {
      const { config } = row.original;
      return <div className="font-mono">{config.rollNo}</div>;
    },
  },
  {
    id: "role",
    header: "Role",
    accessorFn: (row) => row.config.role,
    filterFn: (row, id, value) => {
      const role = row.getValue(id) as string;
      return value.includes(role);
    },
    cell: ({ row }) => {
      const { config } = row.original;
      const roleVariant = config.role === "ADMIN" ? "default" : "secondary";
      const roleIcon = config.role === "ADMIN" ? ShieldIcon : UserIcon;
      const RoleIcon = roleIcon;

      return (
        <Badge variant={roleVariant} className="gap-1">
          <RoleIcon className="w-3 h-3" />
          {config.role}
        </Badge>
      );
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    accessorFn: (row) => row.config.status,
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string;
      return value.includes(status);
    },
    cell: ({ row }) => {
      const { config } = row.original;
      const getStatusStyles = (status: string) => {
        switch (status) {
          case "PENDING":
            return {
              variant: "outline" as const,
              className: "border-yellow-500 text-yellow-700",
            };
          case "APPROVED":
            return {
              variant: "default" as const,
              className: "bg-green-500 hover:bg-green-600",
            };
          case "REJECTED":
            return { variant: "destructive" as const };
          case "SUSPENDED":
            return {
              variant: "destructive" as const,
              className: "bg-red-600 hover:bg-red-700",
            };
          default:
            return { variant: "outline" as const };
        }
      };

      const styles = getStatusStyles(config.status || "PENDING");

      return (
        <Badge variant={styles.variant} className={styles.className}>
          {config.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { user, config } = row.original;

      return <UserActionsDropdown user={user} config={config} />;
    },
  },
];

function UserActionsDropdown({
  user,
  config,
}: {
  user: UserWithConfig["user"];
  config: UserWithConfig["config"];
}) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approveUser(user.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectUser(user.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendUser(user.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: (role: "USER" | "ADMIN" | "MODERATOR") =>
      changeUserRole(user.id, role),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {config.status === "PENDING" && (
          <>
            <DropdownMenuItem
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="text-green-600"
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="text-red-600"
            >
              <XIcon className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </>
        )}

        {config.status === "APPROVED" && (
          <DropdownMenuItem
            onClick={() => suspendMutation.mutate()}
            disabled={suspendMutation.isPending}
            className="text-red-600"
          >
            <BanIcon className="mr-2 h-4 w-4" />
            Suspend
          </DropdownMenuItem>
        )}

        {config.status === "SUSPENDED" && (
          <DropdownMenuItem
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="text-green-600"
          >
            <CheckIcon className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Change Role</DropdownMenuLabel>

        {config.role !== "USER" && (
          <DropdownMenuItem
            onClick={() => roleChangeMutation.mutate("USER")}
            disabled={roleChangeMutation.isPending}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Make User
          </DropdownMenuItem>
        )}

        {config.role !== "ADMIN" && (
          <DropdownMenuItem
            onClick={() => roleChangeMutation.mutate("ADMIN")}
            disabled={roleChangeMutation.isPending}
          >
            <ShieldIcon className="mr-2 h-4 w-4" />
            Make Admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Build search options from filters and pagination
  const searchOptions = useMemo((): UserSearchOptions => {
    const options: UserSearchOptions = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: globalFilter || undefined,
    };

    // Add column filters
    columnFilters.forEach((filter) => {
      if (filter.id === "role" && Array.isArray(filter.value)) {
        options.role = filter.value[0] as any;
      }
      if (filter.id === "status" && Array.isArray(filter.value)) {
        options.status = filter.value[0] as any;
      }
      if (filter.id === "class" && Array.isArray(filter.value)) {
        options.class = filter.value[0];
      }
    });

    // Add sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      options.sortBy = sort.id as any;
      options.sortOrder = sort.desc ? "desc" : "asc";
    }

    return options;
  }, [pagination, globalFilter, columnFilters, sorting]);

  const query = useQuery({
    queryKey: ["admin", "users", searchOptions],
    queryFn: () => getUsers(searchOptions),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportUsersToCSV(searchOptions),
    onSuccess: (result) => {
      if (result.success && result.data) {
        handleExportCSV(result.data);
        toast.success("Users exported successfully");
      } else {
        toast.error(result.message || "Failed to export users");
      }
    },
  });

  const table = useReactTable({
    data: query.data?.data?.users || [],
    columns,
    pageCount: query.data?.data?.totalPages || 0,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const handleExportCSV = (data: any[]) => {
    const csvContent = [
      // CSV Headers
      [
        "Name",
        "Email",
        "Full Name",
        "Class",
        "Section",
        "Roll No",
        "Role",
        "Status",
        "Created At",
        "Last Active",
      ].join(","),
      // CSV Data
      ...data.map((row) =>
        [
          `"${row.name}"`,
          `"${row.email}"`,
          `"${row.fullName}"`,
          `"${row.class}"`,
          `"${row.section}"`,
          `"${row.rollNo}"`,
          `"${row.role}"`,
          `"${row.status}"`,
          `"${row.createdAt}"`,
          `"${row.lastActiveAt || "N/A"}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (query.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center max-w-7xl mx-auto px-5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-lg font-medium">Loading your users...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Error: {(query.error as Error).message}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {table.getColumn("role") && (
            <DataTableFacetedFilter
              title="Role"
              column={table.getColumn("role")}
              options={[
                { label: "User", value: "USER" },
                { label: "Admin", value: "ADMIN" },
                { label: "Moderator", value: "MODERATOR" },
              ]}
            />
          )}
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              title="Status"
              column={table.getColumn("status")}
              options={[
                { label: "Pending", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Suspended", value: "SUSPENDED" },
              ]}
            />
          )}
          {table.getColumn("class") && (
            <DataTableFacetedFilter
              title="Class"
              column={table.getColumn("class")}
              options={[
                { label: "Class 6", value: "6" },
                { label: "Class 7", value: "7" },
                { label: "Class 8", value: "8" },
                { label: "Class 9", value: "9" },
                { label: "Class 10", value: "10" },
                { label: "Class 11", value: "11" },
                { label: "Class 12", value: "12" },
                { label: "Teacher", value: "Teacher" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DownloadIcon className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {query.data?.data && (
            <>
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                query.data.data.totalCount
              )}{" "}
              of {query.data.data.totalCount} users
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
