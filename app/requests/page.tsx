import { Suspense } from "react";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RequestList } from "@/components/requests/request-list";
import { CreateRequestForm } from "@/components/forms/create-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Background } from "@/components/background";

export default async function RequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col max-w-7xl mx-auto pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage your library requests and create new ones
          </p>
        </div>

        <Tabs defaultValue="my-requests" className="space-y-6 z-20">
          <TabsList>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="create-request">Create Request</TabsTrigger>
          </TabsList>

          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle>Your Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading requests...</div>}>
                  <RequestList
                    searchOptions={{
                      userId: session.user.id,
                      sortBy: "createdAt",
                      sortOrder: "desc",
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-request">
            <CreateRequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export const metadata = {
  title: "My Requests | SS.Library",
  description: "Manage your library requests",
};
