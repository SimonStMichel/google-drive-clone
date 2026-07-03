"use client";

import { useState } from "react";

import Link from "next/link";
import Image from "next/image";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/lib/auth/auth-context";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type FormType = "sign-in" | "sign-up";

type StatusType = "idle" | "loading" | "success" | "error";

interface StatusMessage {
  type: StatusType;
  text: string;
}

const authFormSchema = (formType: FormType) => {
  const baseSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(50)
  });

  if (formType === "sign-up") {
    return baseSchema.extend({
      fullName: z.string().optional()
    });
  }

  return baseSchema;
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({ type: "idle", text: "" });

  const router = useRouter();
  const { signInEmailPassword, signUpEmailPassword, signInWithGoogle } = useAuth();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(type === "sign-up" && { fullName: "" })
    },
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);

    if (!values.email || !values.password) {
      setStatus({ type: "error", text: "Please fill in all fields" });
      setIsLoading(false);
      return;
    }

    const email = values.email;
    const password = values.password;

    setStatus({ type: "loading", text: type === "sign-up" ? "Creating account..." : "Signing in..." });

    if (type === "sign-up") {
      const { error } = await signUpEmailPassword(email, password, values.fullName);

      if (error) {
        setStatus({ type: "error", text: error.message });
      } else {
        setStatus({ type: "success", text: "Check your inbox to confirm your account." });
      }
    } else {
      const { error } = await signInEmailPassword(email, password);

      if (error) {
        setStatus({ type: "error", text: error.message });
      } else {
        setStatus({ type: "success", text: "Signed in successfully!" });
        router.push("/");
        router.refresh();
      }
    }
    setIsLoading(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form relative">
          <h1 className="form-title">{type === "sign-in" ? "Sign In" : "Sign Up"}</h1>
          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="shad-form-label">Full Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" className="shad-input" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" className="shad-input" {...field} />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your password" type="password" className="shad-input" {...field} />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
          <div className="relative">
            <Button type="submit" className="form-submit-button w-full" disabled={isLoading}>
              {type === "sign-in" ? "Sign In" : "Sign Up"}
              {isLoading && (
                <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className="ml-2 animate-spin" />
              )}
            </Button>
            {type === "sign-in" && (
              <Button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setStatus({ type: "error", text: error.message });
                  }
                  setIsLoading(false);
                }}
                disabled={isLoading}
                className="w-full mt-2 bg-slate-600 hover:bg-slate-700"
              >
                {isLoading ? (
                  <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className="ml-2 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign In with Google
                  </>
                )}
              </Button>
            )}
            {status.text && (
              <div
                role="status"
                aria-live="polite"
                className={`absolute inset-x-0 -bottom-2 z-10 translate-y-full rounded-lg px-4 py-2 text-sm font-medium${status.type === "loading"
                  ? "bg-blue-500/20 text-blue-300"
                  : status.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : status.type === "error"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
              >
                {status.type === "loading" && (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {status.text}
                  </span>
                )}
                {status.type === "success" && (
                  <span className="inline-flex items-center gap-2">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {status.text}
                  </span>
                )}
                {status.type === "error" && (
                  <span className="inline-flex items-center gap-2">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {status.text}
                  </span>
                )}
                {status.type === "idle" && status.text}
              </div>
            )}
          </div>

          <div className="body-2 flex justify-center">
            <p>{type === "sign-in" ? "Don't have an account?" : "Already have an account?"}</p>
            <Link className="ml-1 font-medium text-brand" href={type === "sign-in" ? "/sign-up" : "/sign-in"}>{type === "sign-in" ? "Sign Up" : "Sign In"}</Link>
          </div>
        </form>
      </Form>
    </>
  );
};

export default AuthForm;