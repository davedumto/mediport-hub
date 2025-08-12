"use client"
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { RegisterFormData, registerSchema } from "@/schema/registeration.schema";
import { useRegisterMutation } from "@/services/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, User } from "iconsax-reactjs";
import { ClipboardPlus, Lock, Mail, UserLock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

const RegisterForm = () => {
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            agreeToTerms: false
        }
    });

    const [registerUser, { isLoading }] = useRegisterMutation()


    const onSubmit = async (data: RegisterFormData) => {
        try {
            console.log("Form submitted:", data);
            const fullName = data.fullName.trim().split(" ");
            const firstName = fullName[0];
            const lastName = fullName[fullName.length - 1];
            const formData = {
                email: data.email,
                password: data.password,
                firstName: firstName,
                lastName: lastName,
            }
            const response = await registerUser(formData).unwrap()

            if (response.success) {
                reset();
                alert("Registration successful!");
            }

        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration failed. Please try again.");
        }
    };
    return (
        <>
            <div className="w-3/5 self-center flex items-stretch justify-between m-auto bg-white shadow-gray-300 shadow-2xl rounded-lg " >
                <div className="w-1/2 bg-blue-500 py-10 px-20" >
                    <p className="text-center text-white text-base" >Mediport Hub</p>

                    <p className="text-center text-white mt-6 text-3xl" >Join Us Today</p>
                    <p className="text-center text-white mt-3 text-sm" >Create your account to access our comprehensive healthcare management platorm</p>

                    <div className="w-full gap-10 flex flex-col mt-12 " >
                        <div className="w-full flex items-start justify-start gap-2" >
                            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5" >
                                <UserLock color="white" size={24} />
                            </div>
                            <div className="flex-1 gap-4 " >
                                <p className=" text-white text-sm">Secure Registeration</p>
                                <p className=" text-gray-300 text-xs">Your data is always protected</p>
                            </div>
                        </div>
                        <div className="w-full flex items-start justify-start gap-2" >
                            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5" >
                                <Calendar color="white" size={24} />
                            </div>
                            <div className="flex-1 gap-4 " >
                                <p className=" text-white text-sm">Easy Appointment</p>
                                <p className=" text-gray-300 text-xs">Book doctors in seconds</p>
                            </div>
                        </div>
                        <div className="w-full flex items-start justify-start gap-2" >
                            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5" >
                                <ClipboardPlus color="white" size={24} />
                            </div>
                            <div className="flex-1 gap-4 " >
                                <p className=" text-white text-sm">Medical Records</p>
                                <p className=" text-gray-300 text-xs">Access your history anytime</p>
                            </div>
                        </div>
                    </div>
                </div>
                <form className="w-1/2 py-10 px-10" >
                    <div className="w-full mb-4" >
                        <h1 className="text-left text-blue-600 font-medium text-3xl" >Create Account</h1>
                    </div>
                    <div className="w-full gap-5 flex flex-col" >
                        <div>
                            <Controller
                                control={control}
                                name="fullName"
                                render={(({ field: { value, onChange } }) => (
                                    <Input
                                        label="Full Name"
                                        value={value}
                                        icon={<User color="gray" variant="Bold" size={18} />}
                                        onChange={onChange}
                                        error={!!errors.fullName}
                                        errorMessage={errors.fullName?.message}
                                    />
                                ))} />
                        </div>

                        <div>

                            <Controller
                                control={control}
                                name="email"
                                render={(({ field: { value, onChange } }) => (
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={value}
                                        icon={<Mail size={18} color={"gray"} />}
                                        onChange={onChange}
                                        error={!!errors.email?.message}
                                        errorMessage={errors.email?.message}
                                    />
                                ))} />
                        </div>

                        <div>

                            <Controller
                                control={control}
                                name="password"
                                render={(({ field: { value, onChange } }) => (
                                    <Input
                                        onChange={onChange}
                                        value={value}
                                        label="Password"
                                        type="password"
                                        info="Use 8+ characters with a mix of letters, numbers & symbols"
                                        icon={<Lock color="gray" size={18} />}
                                        error={!!errors.password?.message}
                                        errorMessage={errors.password?.message}
                                    />
                                ))} />
                        </div>

                        <div>

                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={(({ field: { value, onChange } }) => (
                                    <Input
                                        onChange={onChange}
                                        value={value}
                                        label="Confirm Password"
                                        type="password"
                                        icon={<Lock color="gray" size={18} />}

                                        error={!!errors.confirmPassword?.message}
                                        errorMessage={errors.confirmPassword?.message}
                                    />
                                ))} />
                        </div>

                        <div className="w-full">
                            <div className="flex items-start justify-start gap-2 leading-5">
                                <input
                                    type="checkbox"
                                    {...register("agreeToTerms")}
                                    className="mt-1"
                                />
                                <p className="text-gray-400 text-xs">
                                    I agree to the processing of my data in accordance with the{" "}
                                    <span className="text-blue-500 font-medium text-xs">GDPR Policy</span> and{" "}
                                    <span className="text-blue-500 font-medium text-xs">Privacy Policy</span>
                                </p>
                            </div>
                            {errors.agreeToTerms && (
                                <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms.message}</p>
                            )}
                        </div>


                        <Button btnTitle="Sign Up" loading={isLoading} disabled={isSubmitting}
                            onClick={handleSubmit(onSubmit)} />
                    </div>

                    <div className="w-full mt-5" >
                        <p className="text-center text-gray-600 mt-3 text-sm" >Already have account? <span className="text-blue-500 font-medium text-sm">Log in</span> </p>
                    </div>
                </form>
            </div>
        </>
    );
}

export default RegisterForm;