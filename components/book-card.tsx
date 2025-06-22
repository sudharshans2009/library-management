import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Book } from "@/database/schema";

export default function BookCard({ book }: { book: Book }) {
  return (
    <div>
      <Card className="relative py-0 overflow-hidden">
        <CardHeader className="absolute text-xl font-bold flex items-center gap-2 bg-background/80 z-20 bottom-0 left-0 right-0 p-4">
          <CardTitle className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < book.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </CardTitle>
          <CardDescription className="flex gap-2 text-lg items-center text-foreground">
            {book.rating}/5
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative mt-auto w-full">
            <Image
              src={book.coverUrl || "/placeholder.png"}
              className="object-cover aspect-[11/16]"
              alt="Book Cover"
              width={700}
              height={1000}
            />
        </CardContent>
      </Card>
      <div className="mt-4 text-center bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold truncate">{book.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {book.author ? book.author : "Unknown Author"}
        </p>
        <Link className="w-full" href={`/books/${book.id}`}>
          <Button variant="secondary" className="w-full mt-4">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
