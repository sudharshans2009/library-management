"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, CheckIcon } from "lucide-react";
import { BorrowRecordWithDetails } from "@/lib/services/records";

interface BorrowRecordsTableProps {
  records: BorrowRecordWithDetails[];
  compact?: boolean;
}

export default function BorrowRecordsTable({
  records,
  compact = false,
}: BorrowRecordsTableProps) {
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

  if (records.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No borrow records found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Borrow Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            {!compact && <TableHead>Return Date</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const isOverdue =
              new Date(record.dueDate) < new Date() && !record.returnDate;
            const styles = getStatusStyles(record.status);

            return (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{record.user.name}</div>
                    {!compact && (
                      <div className="text-xs text-muted-foreground">
                        {record.config.class}-{record.config.section} •{" "}
                        {record.config.rollNo}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : ""}`}
                  >
                    <ClockIcon className="w-3 h-3" />
                    <span className="text-sm">
                      {new Date(record.dueDate).toLocaleDateString()}
                    </span>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs ml-1">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={styles.variant} className={styles.className}>
                    {record.status}
                  </Badge>
                </TableCell>
                {!compact && (
                  <TableCell>
                    {record.returnDate ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckIcon className="w-3 h-3" />
                        <span className="text-sm">
                          {new Date(record.returnDate).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Not returned
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
