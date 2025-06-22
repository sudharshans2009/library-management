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
    <div className="w-full">
      <Card className="relative py-0 overflow-hidden">
        <CardHeader className="absolute text-sm sm:text-xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 bg-background/80 z-20 bottom-0 left-0 right-0 p-2 sm:p-4">
          <CardTitle className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-5 sm:h-5 ${
                  i < book.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </CardTitle>
          <CardDescription className="flex gap-1 sm:gap-2 text-sm sm:text-lg items-center text-foreground">
            {book.rating}/5
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative mt-auto">
          <Image
            src={book.coverUrl || "/placeholder.png"}
            className="object-cover aspect-[11/16] w-full"
            alt="Book Cover"
            width={350}
            height={500}
          />
        </CardContent>
      </Card>
      <div className="mt-2 sm:mt-4 text-center bg-card p-2 sm:p-4 rounded-lg shadow-md">
        <h3 className="text-sm sm:text-lg max-w-xs sm:max-w-full font-semibold truncate mx-auto">
          {book.title}
        </h3>
        <p className="text-xs sm:text-sm max-w-xs sm:max-w-full text-muted-foreground truncate mx-auto">
          {book.author ? book.author : "Unknown Author"}
        </p>
        <Link className="w-full" href={`/books/${book.id}`}>
          <Button
            variant="secondary"
            className="w-full mt-2 sm:mt-4 text-xs sm:text-sm h-8 sm:h-10"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
