"use server";

import { createAdminClient } from "../supabase";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { avatarPlaceholderUrl } from "@/constants";

const getUserByEmail = async (email: string) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1)
        .single();

    if (error) throw error;

    return data;
};

const getUserByAccountId = async (accountId: string) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("accountId", accountId)
        .limit(1)
        .single();

    if (error) throw error;

    return data;
};

const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    throw error;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        type: "email",
    });

    if (error) {
        handleError(error, "Failed to send email OTP");
    }

    return data.user?.id ?? email;
};

export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
    const existingUser = await getUserByEmail(email);

    const accountId = existingUser?.accountId ?? (await sendEmailOTP({ email }));
    if (!existingUser) {
        const supabase = createAdminClient();
        const { error } = await supabase.from("users").insert([
            {
                accountId,
                fullName,
                email,
                avatar: avatarPlaceholderUrl,
                createdAt: new Date().toISOString(),
            },
        ]);

        if (error) handleError(error, "Failed to create user document");
    }

    return parseStringify({ accountId });
};

export const verifySecret = async ({ accountId, password }: { accountId: string; password: string }) => {
    try {
        const user = await getUserByAccountId(accountId);
        if (!user) throw new Error("User not found");

        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.verifyOtp({
            email: user.email,
            token: password,
            type: "email",
        });

        if (error || !data.session) {
            throw error ?? new Error("OTP verification failed");
        }

        (await cookies()).set("appwrite-session", data.session.access_token, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify({ sessionId: data.session.access_token });
    } catch (error) {
        handleError(error, "Failed to verify OTP");
    }
};

export const getCurrentUser = async () => {
    try {
        const session = (await cookies()).get("appwrite-session");
        if (!session?.value) return null;

        const supabase = createAdminClient();
        supabase.auth.setAuth(session.value);

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) return null;

        const { data: user, error: userError } = await createAdminClient()
            .from("users")
            .select("*")
            .eq("accountId", data.user.id)
            .limit(1)
            .single();

        if (userError || !user) return null;

        return parseStringify({ ...user, $id: user.id });
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const signOutUser = async () => {
    try {
        const session = (await cookies()).get("appwrite-session");
        if (session?.value) {
            const supabase = createAdminClient();
            supabase.auth.setAuth(session.value);
            await supabase.auth.signOut();
        }

        (await cookies()).delete("appwrite-session");
    } catch (error) {
        handleError(error, "Failed to sign out user");
    } finally {
        redirect("/sign-in");
    }
};

export const signInUser = async ({ email }: { email: string }) => {
    try {
        const existingUser = await getUserByEmail(email);

        if (!existingUser) throw new Error("user not found.");

        await sendEmailOTP({ email });

        return { accountId: existingUser.accountId };
    } catch (error) {
        handleError(error, "Failed to sign in user");
        throw error;
    }
};
