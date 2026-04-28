"use client";

import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Image from "next/image";
import Link from "next/link";

import { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
// import OtpModal from "./OTPModal";

type FormType = "sign-in" | "sign-up";

type StatusType = "idle" | "loading" | "success" | "error";

interface StatusMessage {
  type: StatusType;
  text: string;
}

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    password: z.string().min(8).max(50)
  });
};

const AuthForm = ({ type, user }: { type: FormType, user: User | null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({ type: "idle", text: "" });
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const initAuth = async () => {
      // Check initial session
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      // setIsInitializing(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };

  }, [supabase]);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (!values.email || !values.password) {
      setStatus({ type: "error", text: "Please fill in all fields" });
      return;
    }

    const email = values.email;
    const password = values.password;

    setStatus({ type: "loading", text: type === "sign-up" ? "Creating account..." : "Signing in..." });

    if (type === "sign-up") {
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setStatus({ type: "error", text: error.message });
      } else {
        setStatus({ type: "success", text: "Check your inbox to confirm your account." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setStatus({ type: "error", text: error.message });
      } else {
        setStatus({ type: "success", text: "Signed in successfully!" });
        redirect("/");
      }
    }

  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">{type === "sign-in" ? "Sign In" : "Sign Up"}</h1>
          {/* {type === "sign-up" && (<FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" className="shad-input" {...field} />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />)} */}
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
          <Button type="submit" className="form-submit-button" disabled={isLoading}>
            {type === "sign-in" ? "Sign In" : "Sign Up"}
            {isLoading && (
              <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className="ml-2 animate-spin" />
            )}
          </Button>

          {status.text && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-medium ${status.type === "loading"
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

          <div className="body-2 flex justify-center">
            <p>{type === "sign-in" ? "Don't have an account?" : "Already have an account?"}</p>
            <Link className="ml-1 font-medium text-brand" href={type === "sign-in" ? "/sign-up" : "/sign-in"}>{type === "sign-in" ? "Sign Up" : "Sign In"}</Link>
          </div>
        </form>
      </Form>

      {/* {accountId && <OtpModal email={form.getValues("email")} accountId={accountId} />} */}
    </>
  );
};

export default AuthForm;