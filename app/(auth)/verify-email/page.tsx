"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/actions/account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token found.");
        return;
      }

      try {
        const result = await verifyEmail(token);

        if (result.success) {
          setStatus("success");
          setMessage(result.message);

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.message);
        }
      } catch (error) {
        setStatus("error");
        setMessage("An unexpected error occurred during verification.");
      }
    };

    handleVerification();
  }, [searchParams, token, router]);

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="w-6 h-6" />
          Email Verification
        </CardTitle>
        <CardDescription>
          We&apos;re verifying your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                {message}
              </AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Redirecting you to the dashboard in a few seconds...
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                If you continue to have issues, please contact support or try
                requesting a new verification email.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard/account">
                  <Button variant="outline">Account Settings</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
