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
  // Separate flags so submitting one button doesn't show the other's spinner —
  // both still disable together to prevent firing both auth flows at once.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isBusy = isSubmitting || isGoogleLoading;
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setStatus({ type: "error", text: error.message });
    }
    setIsGoogleLoading(false);
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);

    if (!values.email || !values.password) {
      setStatus({ type: "error", text: "Please fill in all fields" });
      setIsSubmitting(false);
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
    setIsSubmitting(false);
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
          <div className="space-y-4">
            <Button type="submit" className="form-submit-button w-full" disabled={isBusy}>
              {type === "sign-in" ? "Sign In" : "Sign Up"}
              {isSubmitting && (
                <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className="ml-2 animate-spin" />
              )}
            </Button>

            {type === "sign-in" && (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-light-300" aria-hidden="true" />
                  <span className="caption uppercase tracking-wide text-light-200">or</span>
                  <span className="h-px flex-1 bg-light-300" aria-hidden="true" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="google-signin-button"
                >
                  {isGoogleLoading ? (
                    <Image src="/assets/icons/loader.svg" alt="" width={20} height={20} className="animate-spin" />
                  ) : (
                    <>
                      <svg className="size-[18px]" viewBox="0 0 18 18" aria-hidden="true">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </>
            )}

            <div className={`status-banner-wrapper${status.text ? " is-visible" : ""}`}>
              <div className="status-banner-inner">
                {status.text && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`status-banner status-banner--${status.type}`}
                  >
                    {status.type === "loading" && (
                      <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {status.type === "success" && (
                      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {status.type === "error" && (
                      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span>{status.text}</span>
                  </div>
                )}
              </div>
            </div>
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