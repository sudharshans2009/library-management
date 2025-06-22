"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  UsersIcon,
  BookOpenIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link href="/admin/books/new" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New Book
          </Button>
        </Link>

        <Link href="/admin/users" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            <UsersIcon className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </Link>

        <Link href="/admin/records?status=PENDING" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            <ClockIcon className="w-4 h-4 mr-2" />
            Pending Requests
          </Button>
        </Link>

        <Link href="/admin/records" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            <BookOpenIcon className="w-4 h-4 mr-2" />
            View All Records
          </Button>
        </Link>

        <Link href="/admin/books" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            <AlertCircleIcon className="w-4 h-4 mr-2" />
            Books Overview
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
