"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  CreateRequestSchema,
  REQUEST_REASONS,
  type CreateRequestSchemaType,
} from "@/schemas/request";
import { createRequest, getUserBorrowRecords } from "@/actions/requests";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CreateRequestFormProps {
  borrowRecordId?: string;
  onSuccess?: () => void;
}

export function CreateRequestForm({
  borrowRecordId,
  onSuccess,
}: CreateRequestFormProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const queryClient = useQueryClient();

  const form = useForm<CreateRequestSchemaType>({
    resolver: zodResolver(CreateRequestSchema),
    defaultValues: {
      borrowRecordId: borrowRecordId || "",
      type: undefined,
      reason: "",
      description: "",
      requestedDate: undefined,
    },
  });

  // Fetch user's active borrow records
  const borrowRecordsQuery = useQuery({
    queryKey: ["user", "borrow-records"],
    queryFn: async () => {
      const result = await getUserBorrowRecords();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch borrow records");
      }
      return result;
    },
    enabled: !borrowRecordId, // Only fetch if borrowRecordId is not provided
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  const createRequestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["requests"] });
        queryClient.invalidateQueries({ queryKey: ["user", "requests"] });
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error("Failed to create request");
      console.error("Create request error:", error);
    },
  });

  const onSubmit = (data: CreateRequestSchemaType) => {
    const submitData = {
      ...data,
      requestedDate: selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : undefined,
    };
    createRequestMutation.mutate(submitData);
  };

  const requestTypeOptions = [
    { value: "EXTEND_BORROW", label: "Extend Borrow Period" },
    { value: "REPORT_LOST", label: "Report Lost Book" },
    { value: "REPORT_DAMAGE", label: "Report Damaged Book" },
    { value: "EARLY_RETURN", label: "Early Return Request" },
    { value: "CHANGE_DUE_DATE", label: "Change Due Date" },
    { value: "OTHER", label: "Other Request" },
  ];

  const selectedTypeReasons = selectedType
    ? REQUEST_REASONS[selectedType as keyof typeof REQUEST_REASONS]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Request</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!borrowRecordId && (
              <FormField
                control={form.control}
                name="borrowRecordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Borrow Record</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              borrowRecordsQuery.isLoading
                                ? "Loading borrowed books..."
                                : "Select a borrowed book"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {borrowRecordsQuery.isLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : borrowRecordsQuery.data?.data?.length === 0 ? (
                          <SelectItem value="no-records" disabled>
                            No active borrowed books found
                          </SelectItem>
                        ) : (
                          borrowRecordsQuery.data?.data?.map((record) => (
                            <SelectItem key={record.id} value={record.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {record.bookTitle}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  by {record.bookAuthor} • Due:{" "}
                                  {new Date(
                                    record.dueDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the borrowed book this request relates to
                    </FormDescription>
                    <FormMessage />
                    {borrowRecordsQuery.error && (
                      <p className="text-sm text-destructive mt-1">
                        Failed to load borrowed books. Please try again.
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedType(value);
                      form.setValue("reason", ""); // Reset reason when type changes
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {requestTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of request you want to make
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedTypeReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the specific reason for your request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any additional details about your request..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any extra information that might help process your
                    request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(selectedType === "CHANGE_DUE_DATE" ||
              selectedType === "EXTEND_BORROW") && (
              <FormItem>
                <FormLabel>Requested Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select your preferred{" "}
                  {selectedType === "CHANGE_DUE_DATE"
                    ? "new due date"
                    : "extension date"}
                </FormDescription>
              </FormItem>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Request...
                </>
              ) : (
                "Create Request"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
