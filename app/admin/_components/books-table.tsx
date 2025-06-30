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
  EditIcon,
  TrashIcon,
  MoreHorizontalIcon,
  BookIcon,
  TrendingUpIcon,
  Loader2,
  Search,
  Star,
  EyeIcon,
  ExternalLinkIcon,
  PlusIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminBooks,
  deleteBook,
  updateBookCopies,
  exportBooksToCSV,
  getBooksGenres,
  BookWithStats,
  BookSearchOptions,
} from "@/actions/books";
import Image from "next/image";
import Link from "next/link";

const columns: ColumnDef<BookWithStats>[] = [
  {
    id: "book",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Book" />
    ),
    accessorFn: (row) => row.title,
    filterFn: (row, id, value) => {
      const title = row.getValue(id) as string;
      return title?.toLowerCase().includes(value.toLowerCase());
    },
    cell: ({ row }) => {
      const book = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: book.coverColor }}
              >
                <BookIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="font-medium">{book.title}</div>
            <div className="text-sm text-muted-foreground">
              by {book.author}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{book.rating}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "genre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Genre" />
    ),
    accessorFn: (row) => row.genre,
    filterFn: (row, id, value) => {
      const genre = row.getValue(id) as string;
      return value.includes(genre);
    },
    cell: ({ row }) => {
      const { genre } = row.original;
      return <Badge variant="outline">{genre}</Badge>;
    },
  },
  {
    id: "copies",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Copies" />
    ),
    accessorFn: (row) => row.totalCopies,
    cell: ({ row }) => {
      const { totalCopies, availableCopies } = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{availableCopies}</span> /{" "}
            {totalCopies}
          </div>
          <div className="text-xs text-muted-foreground">Available / Total</div>
        </div>
      );
    },
  },
  {
    id: "availability",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Availability" />
    ),
    accessorFn: (row) => row.availability,
    filterFn: (row, id, value) => {
      const availability = row.getValue(id) as string;
      return value.includes(availability);
    },
    cell: ({ row }) => {
      const { availability } = row.original;
      const getAvailabilityStyles = (availability: string) => {
        switch (availability) {
          case "Available":
            return {
              variant: "default" as const,
              className: "bg-green-500 hover:bg-green-600",
            };
          case "Limited":
            return {
              variant: "outline" as const,
              className: "border-yellow-500 text-yellow-700",
            };
          case "Out of Stock":
            return { variant: "destructive" as const };
          default:
            return { variant: "outline" as const };
        }
      };

      const styles = getAvailabilityStyles(availability);

      return (
        <Badge variant={styles.variant} className={styles.className}>
          {availability}
        </Badge>
      );
    },
  },
  {
    id: "popularity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Popularity" />
    ),
    accessorFn: (row) => row.popularity,
    filterFn: (row, id, value) => {
      const popularity = row.getValue(id) as string;
      return value.includes(popularity);
    },
    cell: ({ row }) => {
      const { popularity, borrowCount } = row.original;
      const getPopularityStyles = (popularity: string) => {
        switch (popularity) {
          case "High":
            return {
              variant: "default" as const,
              className: "bg-purple-500 hover:bg-purple-600",
            };
          case "Medium":
            return {
              variant: "default" as const,
              className: "bg-blue-500 hover:bg-blue-600",
            };
          case "Low":
            return { variant: "outline" as const };
          default:
            return { variant: "outline" as const };
        }
      };

      const styles = getPopularityStyles(popularity);

      return (
        <div className="space-y-1">
          <Badge variant={styles.variant} className={styles.className}>
            <TrendingUpIcon className="w-3 h-3 mr-1" />
            {popularity}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {borrowCount} borrows
          </div>
        </div>
      );
    },
  },
  {
    id: "borrowStats",
    header: "Borrow Stats",
    cell: ({ row }) => {
      const { borrowCount, activeBorrows } = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{activeBorrows}</span> active
          </div>
          <div className="text-xs text-muted-foreground">
            {borrowCount} total
          </div>
        </div>
      );
    },
  },
  {
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added" />
    ),
    accessorFn: (row) => row.createdAt,
    cell: ({ row }) => {
      const { createdAt } = row.original;
      return (
        <div className="text-sm">
          {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const book = row.original;

      return <BookActionsDropdown book={book} />;
    },
  },
];

function BookActionsDropdown({ book }: { book: BookWithStats }) {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [totalCopies, setTotalCopies] = useState(book.totalCopies);
  const [availableCopies, setAvailableCopies] = useState(book.availableCopies);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(book.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateBookCopies(book.id, totalCopies, availableCopies),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
        setIsEditDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <>
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

          <DropdownMenuItem asChild>
            <Link
              href={`/admin/books/${book.id}`}
              className="flex items-center"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href={`/admin/books/${book.id}/edit`}
              className="flex items-center"
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Book
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Copies
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/books/${book.id}`} className="flex items-center">
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              View Public Page
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending || book.activeBorrows > 0}
            className="text-red-600 focus:text-red-600"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete Book
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book Copies</DialogTitle>
            <DialogDescription>
              Update the total and available copies for &quot;{book.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Total Copies</label>
              <Input
                type="number"
                value={totalCopies}
                onChange={(e) => setTotalCopies(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Available Copies</label>
              <Input
                type="number"
                value={availableCopies}
                onChange={(e) =>
                  setAvailableCopies(parseInt(e.target.value) || 0)
                }
                min="0"
                max={totalCopies}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function BooksTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch genres for filter
  const genresQuery = useQuery({
    queryKey: ["genres"],
    queryFn: () => getBooksGenres(),
  });

  // Build search options from filters and pagination
  const searchOptions = ((): BookSearchOptions => {
    const options: BookSearchOptions = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: globalFilter || undefined,
    };

    // Add column filters
    columnFilters.forEach((filter) => {
      if (filter.id === "genre" && Array.isArray(filter.value)) {
        options.genre = filter.value[0];
      }
      if (filter.id === "availability" && Array.isArray(filter.value)) {
        options.availability = filter.value[0] as any;
      }
      if (filter.id === "popularity" && Array.isArray(filter.value)) {
        options.popularity = filter.value[0] as any;
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
    queryKey: ["admin", "books", searchOptions],
    queryFn: () => getAdminBooks(searchOptions),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportBooksToCSV(searchOptions),
    onSuccess: (result) => {
      if (result.success && result.data) {
        handleExportCSV(result.data);
        toast.success("Books exported successfully");
      } else {
        toast.error(result.message || "Failed to export books");
      }
    },
  });

  const table = useReactTable({
    data: query.data?.data?.books || [],
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
        "Title",
        "Author",
        "Genre",
        "Total Copies",
        "Available Copies",
        "Borrow Count",
        "Active Borrows",
        "Popularity",
        "Availability",
        "Rating",
        "Created At",
      ].join(","),
      // CSV Data
      ...data.map((row) =>
        [
          `"${row.title}"`,
          `"${row.author}"`,
          `"${row.genre}"`,
          `"${row.totalCopies}"`,
          `"${row.availableCopies}"`,
          `"${row.borrowCount}"`,
          `"${row.activeBorrows}"`,
          `"${row.popularity}"`,
          `"${row.availability}"`,
          `"${row.rating}"`,
          `"${row.createdAt}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `books_export_${new Date().toISOString().split("T")[0]}.csv`,
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
          <p className="text-lg font-medium">Loading your books...</p>
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
            placeholder="Search books..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {table.getColumn("genre") && genresQuery.data?.success && (
            <DataTableFacetedFilter
              title="Genre"
              column={table.getColumn("genre")}
              options={genresQuery.data.data.map((genre) => ({
                label: genre,
                value: genre,
              }))}
            />
          )}
          {table.getColumn("availability") && (
            <DataTableFacetedFilter
              title="Availability"
              column={table.getColumn("availability")}
              options={[
                { label: "Available", value: "Available" },
                { label: "Limited", value: "Limited" },
                { label: "Out of Stock", value: "Out of Stock" },
              ]}
            />
          )}
          {table.getColumn("popularity") && (
            <DataTableFacetedFilter
              title="Popularity"
              column={table.getColumn("popularity")}
              options={[
                { label: "High", value: "High" },
                { label: "Medium", value: "Medium" },
                { label: "Low", value: "Low" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {query.data?.data && (
            <>
              Showing {query.data.data.books.length} of{" "}
              {query.data.data.totalCount} books
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Link href="/admin/books/new">
            <Button variant="outline" size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </Link>

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
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    window.open(`/admin/books/${row.original.id}`, "_blank")
                  }
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
                  No books found.
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
              of {query.data.data.totalCount} books
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
