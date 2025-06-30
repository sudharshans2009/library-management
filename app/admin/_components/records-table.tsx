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
import { useState } from "react";
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
  MoreHorizontalIcon,
  BookIcon,
  Loader2,
  Search,
  ClockIcon,
  CalendarIcon,
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
  getBorrowRecords,
  approveRecord,
  rejectRecord,
  returnRecord,
  exportRecordsToCSV,
} from "@/actions/records";
import {
  BorrowRecordWithDetails,
  RecordSearchOptions,
} from "@/lib/services/records";

const columns: ColumnDef<BorrowRecordWithDetails>[] = [
  {
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
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
          <div className="text-xs text-muted-foreground">
            {config.class}-{config.section} • Roll: {config.rollNo}
          </div>
        </div>
      );
    },
  },
  {
    id: "book",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Book" />
    ),
    accessorFn: (row) => row.book.title,
    filterFn: (row, id, value) => {
      const title = row.getValue(id) as string;
      return title?.toLowerCase().includes(value.toLowerCase());
    },
    cell: ({ row }) => {
      const { book } = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{book.title}</div>
          <div className="text-sm text-muted-foreground">by {book.author}</div>
          <div className="text-xs text-muted-foreground">{book.genre}</div>
        </div>
      );
    },
  },
  {
    id: "borrowDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrow Date" />
    ),
    accessorFn: (row) => row.borrowDate,
    cell: ({ row }) => {
      const { borrowDate } = row.original;
      return (
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm">
            {new Date(borrowDate).toLocaleDateString()}
          </span>
        </div>
      );
    },
  },
  {
    id: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    accessorFn: (row) => row.dueDate,
    cell: ({ row }) => {
      const { dueDate } = row.original;
      const isOverdue =
        new Date(dueDate) < new Date() && !row.original.returnDate;

      return (
        <div
          className={`flex items-center gap-1 ${
            isOverdue ? "text-red-600" : ""
          }`}
        >
          <ClockIcon className="w-3 h-3" />
          <span className="text-sm">
            {new Date(dueDate).toLocaleDateString()}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "returnDate",
    header: "Return Date",
    accessorFn: (row) => row.returnDate,
    cell: ({ row }) => {
      const { returnDate } = row.original;
      return (
        <div className="text-sm">
          {returnDate ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckIcon className="w-3 h-3" />
              {new Date(returnDate).toLocaleDateString()}
            </div>
          ) : (
            <span className="text-muted-foreground">Not returned</span>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    accessorFn: (row) => row.status,
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string;
      return value.includes(status);
    },
    cell: ({ row }) => {
      const { status } = row.original;
      const getStatusStyles = (status: string) => {
        switch (status) {
          case "PENDING":
            return {
              variant: "outline" as const,
              className: "border-yellow-500 text-yellow-700",
            };
          case "BORROWED":
            return {
              variant: "default" as const,
              className: "bg-blue-500 hover:bg-blue-600",
            };
          case "RETURNED":
            return {
              variant: "default" as const,
              className: "bg-green-500 hover:bg-green-600",
            };
          default:
            return { variant: "outline" as const };
        }
      };

      const styles = getStatusStyles(status);

      return (
        <Badge variant={styles.variant} className={styles.className}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const record = row.original;

      return <RecordActionsDropdown record={record} />;
    },
  },
];

function RecordActionsDropdown({
  record,
}: {
  record: BorrowRecordWithDetails;
}) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approveRecord(record.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "records"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRecord(record.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "records"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => returnRecord(record.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "records"] });
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

        {record.status === "PENDING" && (
          <>
            <DropdownMenuItem
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="text-green-600"
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              Approve Request
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="text-red-600"
            >
              <XIcon className="mr-2 h-4 w-4" />
              Reject Request
            </DropdownMenuItem>
          </>
        )}

        {record.status === "BORROWED" && !record.returnDate && (
          <DropdownMenuItem
            onClick={() => returnMutation.mutate()}
            disabled={returnMutation.isPending}
            className="text-blue-600"
          >
            <BookIcon className="mr-2 h-4 w-4" />
            Mark as Returned
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface RecordsTableProps {
  searchParams: {
    bookId?: string;
  };
}

export default function RecordsTable({ searchParams }: RecordsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Build search options from filters and pagination
  const searchOptions = ((): RecordSearchOptions => {
    const options: RecordSearchOptions = {
      bookId: searchParams.bookId || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: globalFilter || undefined,
    };

    // Add column filters
    columnFilters.forEach((filter) => {
      if (filter.id === "status" && Array.isArray(filter.value)) {
        options.status = filter.value[0] as any;
      }
    });

    // Add sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      options.sortBy = sort.id as any;
      options.sortOrder = sort.desc ? "desc" : "asc";
    }

    return options;
  })();

  const query = useQuery({
    queryKey: ["admin", "records", searchOptions],
    queryFn: () => getBorrowRecords(searchOptions),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportRecordsToCSV(searchOptions),
    onSuccess: (result) => {
      if (result.success && result.data) {
        handleExportCSV(result.data);
        toast.success("Records exported successfully");
      } else {
        toast.error(result.message || "Failed to export records");
      }
    },
  });

  const table = useReactTable({
    data: query.data?.data?.records || [],
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
        "User Name",
        "Full Name",
        "Class",
        "Section",
        "Roll No",
        "Book Title",
        "Author",
        "Borrow Date",
        "Due Date",
        "Return Date",
        "Status",
        "Days Overdue",
      ].join(","),
      // CSV Data
      ...data.map((row) =>
        [
          `"${row.userName}"`,
          `"${row.userFullName}"`,
          `"${row.userClass}"`,
          `"${row.userSection}"`,
          `"${row.userRollNo}"`,
          `"${row.bookTitle}"`,
          `"${row.bookAuthor}"`,
          `"${row.borrowDate}"`,
          `"${row.dueDate}"`,
          `"${row.returnDate || "N/A"}"`,
          `"${row.status}"`,
          `"${row.daysOverdue || 0}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `borrow_records_export_${new Date().toISOString().split("T")[0]}.csv`,
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
          <p className="text-lg font-medium">Loading your records...</p>
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
            placeholder="Search records..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              title="Status"
              column={table.getColumn("status")}
              options={[
                { label: "Pending", value: "PENDING" },
                { label: "Borrowed", value: "BORROWED" },
                { label: "Returned", value: "RETURNED" },
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
                          header.getContext(),
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
                        cell.getContext(),
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
                  No records found.
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
                query.data.data.totalCount,
              )}{" "}
              of {query.data.data.totalCount} records
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
