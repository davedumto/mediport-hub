"use client"
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Calendar, User } from "iconsax-reactjs";
import { ClipboardPlus, Lock, Mail, UserLock } from "lucide-react";

const RegisterForm = () => {
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
                        <Input label="Full Name" icon={<User color="gray" variant="Bold" size={18} />} />
                        <Input label="Email Address" type="email-address" icon={<Mail size={18} color={"gray"} />} />
                        <Input label="Password" type={"password"} info="Use 8+ characters with a mix of letters,numbers & symbols" icon={<Lock color="gray" size={18} />} />
                        <Input label="Confirm Password" type={"password"} icon={<Lock color="gray" size={18} />} />


                        <div className="w-full flex items-start justify-start gap-2 leading-5" >
                            <input type="checkbox" />
                            <p className=" text-gray-400 text-xs " >I agree to the processing of my data in accordance with the <span className="text-blue-500 font-medium text-xs" >GDPR Policy</span> and <span className="text-blue-500 font-medium text-xs">Privacy Policy</span></p>
                        </div>

                        <Button btnTitle="Sign Up" onClick={() => {

                        }} />
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