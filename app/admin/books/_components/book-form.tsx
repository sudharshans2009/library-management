"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ImageIcon, 
  VideoIcon, 
  Loader2, 
  UploadIcon,
  XIcon 
} from "lucide-react";
import { createBook, updateBook } from "@/actions/books";
import { uploadBookCoverAction, uploadBookVideoAction } from "@/actions/upload";
import { Book } from "@/database/schema";
import Image from "next/image";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  author: z.string().min(1, "Author is required").max(255, "Author too long"),
  genre: z.string().min(1, "Genre is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  description: z.string().min(1, "Description is required"),
  summary: z.string().min(1, "Summary is required"),
  totalCopies: z.number().min(1, "Must have at least 1 copy"),
  availableCopies: z.number().min(0, "Available copies cannot be negative"),
  coverColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

type BookFormData = z.infer<typeof bookSchema>;

interface BookFormProps {
  initialData?: Book;
  mode: "create" | "edit";
}

const GENRE_OPTIONS = [
  "Fiction",
  "Non-Fiction", 
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Biography",
  "Self-Help",
  "Educational",
  "Children's",
  "Young Adult",
  "Poetry",
  "Drama",
  "Horror",
  "Adventure",
  "Comedy",
  "Philosophy",
  "Religion",
  "Science",
  "Technology",
  "Health",
  "Travel",
  "Cooking",
  "Art",
  "Music",
  "Sports",
  "Business",
  "Economics",
  "Politics",
  "History",
  "Geography"
];

export default function BookForm({ initialData, mode }: BookFormProps) {
  const router = useRouter();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(initialData?.coverUrl || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(initialData?.videoUrl || "");

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title || "",
      author: initialData?.author || "",
      genre: initialData?.genre || "",
      rating: initialData?.rating || 5,
      description: initialData?.description || "",
      summary: initialData?.summary || "",
      totalCopies: initialData?.totalCopies || 1,
      availableCopies: initialData?.availableCopies || 1,
      coverColor: initialData?.coverColor || "#3b82f6",
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: uploadBookCoverAction,
    onSuccess: (url) => {
      setCoverPreview(url);
      toast.success("Cover image uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload cover image");
      console.error("Cover upload error:", error);
    },
  });

  const uploadVideoMutation = useMutation({
    mutationFn: uploadBookVideoAction,
    onSuccess: (url) => {
      setVideoPreview(url);
      toast.success("Video uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload video");
      console.error("Video upload error:", error);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BookFormData) => {
      let coverUrl = coverPreview;
      let videoUrl = videoPreview;

      // Upload cover if new file selected
      if (coverFile) {
        coverUrl = await uploadBookCoverAction(coverFile);
      }

      // Upload video if new file selected
      if (videoFile) {
        videoUrl = await uploadBookVideoAction(videoFile);
      }

      const bookData = {
        ...data,
        coverUrl,
        videoUrl,
      };

      if (mode === "edit" && initialData) {
        return await updateBook(initialData.id, bookData);
      } else {
        return await createBook(bookData);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          mode === "edit" 
            ? "Book updated successfully" 
            : "Book created successfully"
        );
        router.push("/admin/books");
      } else {
        toast.error(result.message || "Operation failed");
      }
    },
    onError: (error) => {
      toast.error("An error occurred");
      console.error("Submit error:", error);
    },
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: BookFormData) => {
    if (!coverPreview) {
      toast.error("Cover image is required");
      return;
    }

    if (!videoPreview) {
      toast.error("Video is required");
      return;
    }

    if (data.availableCopies > data.totalCopies) {
      toast.error("Available copies cannot exceed total copies");
      return;
    }

    submitMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter book title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter author name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENRE_OPTIONS.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (1-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter book description"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter book summary"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Copies Information */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalCopies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Copies</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of copies in the library
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableCopies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Copies</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max={form.watch("totalCopies")}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Currently available copies for borrowing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cover Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a cover image for the book
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="coverColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Fallback Color</FormLabel>
                      <FormControl>
                        <Input type="color" className="w-12 h-8 p-1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="mb-4"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => uploadCoverMutation.mutate(coverFile!)}
                    disabled={!coverFile || uploadCoverMutation.isPending}
                    className="w-full"
                  >
                    {uploadCoverMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UploadIcon className="w-4 h-4 mr-2" />
                    )}
                    Upload Cover
                  </Button>
                </div>

                {coverPreview && (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image
                        src={coverPreview}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setCoverPreview("");
                          setCoverFile(null);
                        }}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Video */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Book Trailer</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a video trailer for the book
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="mb-4"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => uploadVideoMutation.mutate(videoFile!)}
                    disabled={!videoFile || uploadVideoMutation.isPending}
                    className="w-full"
                  >
                    {uploadVideoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <VideoIcon className="w-4 h-4 mr-2" />
                    )}
                    Upload Video
                  </Button>
                </div>

                {videoPreview && (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setVideoPreview("");
                          setVideoFile(null);
                        }}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {mode === "edit" ? "Update Book" : "Create Book"}
          </Button>
        </div>
      </form>
    </Form>
  );
}