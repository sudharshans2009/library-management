"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormData } from "@/schemas/sign-up";
import { useMutation } from "@tanstack/react-query";
import { signUpAction } from "@/actions/sign-up";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

export default function SignUp() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            passwordConfirmation: "",
            image: "",
        },
    });

    const signUpMutation = useMutation({
        mutationFn: signUpAction,
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Account created successfully!");
                router.push("/dashboard");
            } else {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            toast.error("An unexpected error occurred");
            console.error("Sign up error:", error);
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        form.setValue("image", "");
        setImagePreview(null);
        // Reset the file input
        const fileInput = document.getElementById("image") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const onSubmit = (data: SignUpFormData) => {
        signUpMutation.mutate(data);
    };

    return (
        <Card className="w-full z-10 rounded-md max-w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Smith"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="me@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Confirm Password"
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="image">Profile Image (optional)</Label>
                            <div className="flex items-end gap-4">
                                {imagePreview && (
                                    <div className="relative w-16 h-16 rounded-sm overflow-hidden">
                                        <Image
                                            src={imagePreview}
                                            alt="Profile preview"
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 w-full">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full"
                                    />
                                    {imagePreview && (
                                        <X
                                            className="cursor-pointer"
                                            onClick={clearImage}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={signUpMutation.isPending}
                        >
                            {signUpMutation.isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                "Create an account"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter>
                <div className="flex justify-center w-full border-t py-4">
                    <p className="text-center text-xs text-neutral-500">
                        Secured by <span className="text-orange-400">better-auth.</span>
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}