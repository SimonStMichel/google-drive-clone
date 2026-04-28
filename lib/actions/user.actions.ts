"use server";

import { createClient } from "../supabase/server-client";
// import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// import { avatarPlaceholderUrl } from "@/constants";

export const createAccountEmailPassword = async ({ fullName, email, password }: { fullName: string; email: string, password: string }) => {
    const { data, error: supabaseError } = await supabase
        .auth()
        .register({ email, password });

    if (supabaseError) {
        handleError(supabaseError, supabaseError.message);
    }

    const { userId } = data;

    console.log("User ID : " + userId);

    // Check if user already has a document
    const { data: userDoc, error: dbError } = await supabase
        .from("userDocuments")
        .select("*")
        .eq("userId", userId);

    if (dbError) {
        handleError(dbError, "Error checking user document");
        return;
    }

    if (userDoc) {
        handleError(userDoc, "User already has a document");
        return;
    }

    // If no document exists, proceed to create one
    const { user } = await supabase
        .from("userDocuments")
        .insert({
            userId,
            fullName
        });
    // 1. Verify if user exists
    // 2. If he does, sign him in
    // 3. If he doesn't, create account
    return userId;
};

export const signInUserEmailPassword = async ({ email, password }: { email: string, password: string }) => {
    console.log(email);
    console.log(password);
    // 1. Verify if user exists
    // 2. If he does, sign him in
    // 3. If password is wrong, indicate so.
    // 4. If he doesn't, create account
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

const existingUser = (email: string) => {

};

const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    throw error;
};

// export const sendEmailOTP = async ({ email }: { email: string }) => {
//     const supabase = createAdminClient();
//     const { data, error } = await supabase.auth.signInWithOtp({
//         email,
//         type: "email",
//     });

//     if (error) {
//         handleError(error, "Failed to send email OTP");
//     }

//     return data.user?.id ?? email;

// export const verifySecret = async ({ accountId, password }: { accountId: string; password: string }) => {
//     try {
//         const user = await getUserByAccountId(accountId);
//         if (!user) throw new Error("User not found");

//         const supabase = createAdminClient();
//         const { data, error } = await supabase.auth.verifyOtp({
//             email: user.email,
//             token: password,
//             type: "email",
//         });

//         if (error || !data.session) {
//             throw error ?? new Error("OTP verification failed");
//         }

//         (await cookies()).set("appwrite-session", data.session.access_token, {
//             path: "/",
//             httpOnly: true,
//             sameSite: "strict",
//             secure: true,
//         });

//         return parseStringify({ sessionId: data.session.access_token });
//     } catch (error) {
//         handleError(error, "Failed to verify OTP");
//     }
// };