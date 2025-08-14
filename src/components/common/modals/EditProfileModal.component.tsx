"use client"

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// shadcn/ui components (adjust import paths to match your project)
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
const profileSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(6).optional().or(z.literal("")),
    gender: z.union([z.literal("male"), z.literal("female"), z.literal("other")]).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
    defaultValues?: Partial<ProfileForm> & { avatarUrl?: string };
    onSave?: (data: ProfileForm & { avatarFile?: File | null }) => Promise<void> | void;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditProfileDialog({ defaultValues, onSave, onClose, isOpen }: EditProfileDialogProps) {
    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: defaultValues?.firstName ?? "",
            lastName: defaultValues?.lastName ?? "",
            email: defaultValues?.email ?? "",
            phone: defaultValues?.phone ?? "",
            gender: (defaultValues?.gender as any) ?? undefined,
        },
    });


    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(defaultValues?.avatarUrl ?? null);
    const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

    const submit = async (data: ProfileForm) => {
        try {
            if (onSave) {
                await onSave({ ...data, avatarFile });
            } else {
                await new Promise((r) => setTimeout(r, 800));
                toast.success("Profile updated — your profile was saved successfully.");
            }
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save profile.");
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        setAvatarFile(file);
        if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);

        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl w-full">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>Update your public profile information and avatar.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(submit)} className="space-y-6 mt-4">
                    <div className="flex items-center gap-2">
                        <Avatar style={{
                            width: 40,
                            height: 40
                        }} >
                            {avatarPreview ? (
                                <AvatarImage src={avatarPreview} alt="avatar" />
                            ) : (
                                <AvatarFallback>{(defaultValues?.firstName ?? "?").charAt(0)}</AvatarFallback>
                            )}
                        </Avatar>

                        <div className="space-y-2">

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                aria-label="Change avatar"
                            />

                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change avatar
                            </Button>

                            <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB.</p>
                        </div>
                    </div>


                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2" >
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" {...register("firstName")} />
                            {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
                        </div>

                        <div className="space-y-2" >
                            <Label htmlFor="lastName">Last name</Label>
                            <Input id="lastName" {...register("lastName")} />
                            {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2" >
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" {...register("phone")} />
                            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2" >
                            <Label>Gender</Label>
                            <Controller
                                control={control}
                                name="gender"
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(val)} defaultValue={field.value}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <div className="flex items-center justify-end gap-2 w-full">
                            <Button variant="outline" type="button" onClick={() => onClose()} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-500 hover:bg-white hover:border-blue-500 hover:text-blue-500 hover:border-[0.5px]" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
