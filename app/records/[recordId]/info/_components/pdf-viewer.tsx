/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DownloadIcon,
  ShareIcon,
  CopyIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { generateShareableLink } from "@/actions/pdf";
import { useMutation } from "@tanstack/react-query";

interface PDFViewerProps {
  record: any;
  book: any;
  userConfig: any;
  isPublic: boolean;
  recordId: string;
}

const pdfStyles = `
        .pdf-content {
          padding: 40px !important;
          margin: 0 !important;
          min-height: 100vh !important;
        }
        .pdf-content * {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #d1d5db !important;
        }
        .pdf-content .text-gray-900 { color: #111827 !important; }
        .pdf-content .text-gray-700 { color: #374151 !important; }
        .pdf-content .text-gray-600 { color: #4b5563 !important; }
        .pdf-content .text-gray-500 { color: #6b7280 !important; }
        .pdf-content .text-muted-foreground { color: #6b7280 !important; }
        .pdf-content .bg-gray-100 { background-color: #f3f4f6 !important; }
        .pdf-content .bg-green-100 { background-color: #dcfce7 !important; }
        .pdf-content .text-green-800 { color: #166534 !important; }
        .pdf-content .text-green-600 { color: #16a34a !important; }
        .pdf-content .bg-red-100 { background-color: #fee2e2 !important; }
        .pdf-content .text-red-800 { color: #991b1b !important; }
        .pdf-content .text-red-600 { color: #dc2626 !important; }
        .pdf-content .bg-blue-100 { background-color: #dbeafe !important; }
        .pdf-content .text-blue-800 { color: #1e40af !important; }
        .pdf-content .text-yellow-400 { color: #facc15 !important; }
        .pdf-content .fill-yellow-400 { fill: #facc15 !important; }
        .pdf-content .border-b { border-bottom: 1px solid #d1d5db !important; }
        .pdf-content .rounded { border-radius: 0.25rem !important; }
        .pdf-content .rounded-lg { border-radius: 0.5rem !important; }
        .pdf-content .rounded-full { border-radius: 9999px !important; }
        .pdf-content .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
        .pdf-content .section { margin-bottom: 32px !important; }
        .pdf-content .section-header { margin-bottom: 20px !important; padding-bottom: 12px !important; }
        .pdf-content .grid { gap: 24px !important; }
        .pdf-content .space-y-3 > * + * { margin-top: 16px !important; }
        .pdf-content .space-y-4 > * + * { margin-top: 20px !important; }
      `;

export default function PDFViewer({
  record,
  book,
  userConfig,
  isPublic,
  recordId,
}: PDFViewerProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Calculate dates and status
  const borrowDate = new Date(record.borrowDate);
  const dueDate = new Date(record.dueDate);
  const returnDate = record.returnDate ? new Date(record.returnDate) : null;
  const today = new Date();

  const daysBorrowed = Math.floor(
    (today.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilDue = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = !returnDate && daysUntilDue < 0;
  const isReturned = !!returnDate;

  const generateShareMutation = useMutation({
    mutationFn: () => generateShareableLink(recordId),
    onSuccess: (result) => {
      if (result.success && result.data) {
        setShareUrl(result.data.url);
        toast.success("Share link generated successfully");
      } else {
        toast.error(result.message || "Failed to generate share link");
      }
    },
  });

  const downloadAsPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas-pro")).default;

      if (!pdfRef.current) return;

      // Create a temporary style element to override CSS colors for PDF generation
      const tempStyle = document.createElement("style");
      tempStyle.textContent = pdfStyles;
      document.head.appendChild(tempStyle);

      // Add the PDF content class to the ref element
      pdfRef.current.classList.add("pdf-content");

      // Create canvas from the PDF content
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: true,
        logging: false,
        width: pdfRef.current.scrollWidth,
        height: pdfRef.current.scrollHeight,
      });

      // Remove the temporary styles and class
      document.head.removeChild(tempStyle);
      pdfRef.current.classList.remove("pdf-content");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`library-record-${record.id.slice(0, 8)}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadAsPDF} className="flex items-center gap-2">
          <DownloadIcon className="w-4 h-4" />
          Download PDF
        </Button>

        {!isPublic && (
          <Button
            variant="outline"
            onClick={() => generateShareMutation.mutate()}
            disabled={generateShareMutation.isPending}
            className="flex items-center gap-2"
          >
            <ShareIcon className="w-4 h-4" />
            {generateShareMutation.isPending ? "Generating..." : "Share Record"}
          </Button>
        )}

        {shareUrl && (
          <Button
            variant="outline"
            onClick={copyShareLink}
            className="flex items-center gap-2"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        )}
      </div>

      {/* Share URL Display */}
      {shareUrl && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-800">
                Share Link Generated:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 text-blue-700 rounded border text-xs break-all">
                  {shareUrl}
                </code>
                <Button size="sm" onClick={copyShareLink}>
                  {copied ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-600">
                This link will expire in 7 days and can be shared with anyone.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Content */}
      <Card>
        <CardContent className="p-4">
          <div
            ref={pdfRef}
            className="space-y-2 rounded-md"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "20px",
              minHeight: "100vh",
            }}
          >
            {/* Header */}
            <div
              className="section flex justify-between text-center border-b pb-4"
              style={{ borderColor: "#d1d5db" }}
            >
              <h1
                className="text-xl font-bold mb-4"
                style={{ color: "#111827" }}
              >
                SS.library
              </h1>
              <p className="text-lg" style={{ color: "#6b7280" }}>
                Record ID: {record.id.slice(0, 8)} {isPublic ? "(Public)" : ""}
              </p>
            </div>

            {/* Book Information */}
            <div className="section">
              <div>
                <div className="space-y-2">
                  <h3
                    className="section-header text-lg font-bold border-b pb-3"
                    style={{ color: "#111827", borderColor: "#d1d5db" }}
                  >
                    Book Information
                  </h3>

                  <div className="space-y-2">
                    <div className="py-2">
                      <span
                        className="font-semibold text-lg block mb-2"
                        style={{ color: "#374151" }}
                      >
                        Title:
                      </span>
                      <p
                        className="text-xl font-semibold"
                        style={{ color: "#111827" }}
                      >
                        {book.title}
                      </p>
                    </div>

                    <div className="py-2">
                      <span
                        className="font-semibold text-lg block mb-2"
                        style={{ color: "#374151" }}
                      >
                        Author:
                      </span>
                      <p className="text-lg" style={{ color: "#111827" }}>
                        {book.author}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="section">
              <h3
                className="section-header text-lg font-bold border-b pb-3"
                style={{ color: "#111827", borderColor: "#d1d5db" }}
              >
                Borrower Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Name:
                  </span>
                  <p className="text-lg" style={{ color: "#111827" }}>
                    {record.user.name}
                  </p>
                </div>

                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Full Name:
                  </span>
                  <p className="text-lg" style={{ color: "#111827" }}>
                    {userConfig?.fullName}
                  </p>
                </div>

                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Class:
                  </span>
                  <p className="text-lg" style={{ color: "#111827" }}>
                    {userConfig?.class}
                  </p>
                </div>

                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Section:
                  </span>
                  <p className="text-lg" style={{ color: "#111827" }}>
                    {userConfig?.section}
                  </p>
                </div>

                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Roll Number:
                  </span>
                  <p className="text-lg" style={{ color: "#111827" }}>
                    {userConfig?.rollNo}
                  </p>
                </div>

                <div className="py-2">
                  <span
                    className="font-semibold text-lg block mb-2"
                    style={{ color: "#374151" }}
                  >
                    Email:
                  </span>
                  <p className="text-base" style={{ color: "#111827" }}>
                    {record.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Borrow Details */}
            <div className="section">
              <h3
                className="section-header text-lg font-bold border-b pb-3"
                style={{ color: "#111827", borderColor: "#d1d5db" }}
              >
                Borrow Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-start gap-3 py-2">
                  <CalendarIcon
                    className="w-6 h-6 mt-1"
                    style={{ color: "#6b7280" }}
                  />
                  <div>
                    <span
                      className="font-semibold text-lg block mb-2"
                      style={{ color: "#374151" }}
                    >
                      Borrow Date:
                    </span>
                    <p className="text-lg" style={{ color: "#111827" }}>
                      {borrowDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <ClockIcon
                    className="w-6 h-6 mt-1"
                    style={{ color: "#6b7280" }}
                  />
                  <div>
                    <span
                      className="font-semibold text-lg block mb-2"
                      style={{ color: "#374151" }}
                    >
                      Due Date:
                    </span>
                    <p
                      className="text-lg"
                      style={{
                        color: isOverdue ? "#dc2626" : "#111827",
                        fontWeight: isOverdue ? "bold" : "normal",
                      }}
                    >
                      {dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {returnDate && (
                  <div className="flex items-start gap-3 py-2">
                    <CheckCircle
                      className="w-6 h-6 mt-1"
                      style={{ color: "#16a34a" }}
                    />
                    <div>
                      <span
                        className="font-semibold text-lg block mb-2"
                        style={{ color: "#374151" }}
                      >
                        Return Date:
                      </span>
                      <p className="text-lg" style={{ color: "#16a34a" }}>
                        {returnDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 py-2">
                  <UserIcon
                    className="w-6 h-6 mt-1"
                    style={{ color: "#6b7280" }}
                  />
                  <div>
                    <span
                      className="font-semibold text-lg block mb-2"
                      style={{ color: "#374151" }}
                    >
                      Days Borrowed:
                    </span>
                    <p className="text-lg" style={{ color: "#111827" }}>
                      {daysBorrowed} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-2 py-2">
                <span
                  className="font-semibold text-lg block mb-1"
                  style={{ color: "#374151" }}
                >
                  Status:
                </span>
                <div>
                  {isReturned ? (
                    <span className="inline-flex items-center gap-2 rounded-full text-lg font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Returned
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-2 rounded-full text-lg font-medium">
                      <AlertCircle className="w-5 h-5" />
                      Overdue ({Math.abs(daysUntilDue)} days)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full text-lg font-medium">
                      <ClockIcon className="w-5 h-5" />
                      Active ({daysUntilDue} days remaining)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="text-center pt-4 border-t"
              style={{ borderColor: "#d1d5db", color: "#6b7280" }}
            >
              <div className="flex justify-between">
                <p className="text-lg font-medium">
                  SS.library Management System
                </p>
                <p className="text-base mb-2">
                  Generated on {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
