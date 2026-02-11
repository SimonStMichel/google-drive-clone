"use server";

import { appwriteConfig } from "../appwrite/config";
import { createAdminClient, createSessionClient } from "../appwrite";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

import { redirect } from "next/navigation";

import { avatarPlaceholderUrl } from "@/constants";

/**
 * Retrieves a user from the database by their email address.
 * 
 * @param {string} email - The email address of the user to retrieve
 * @returns {Promise<any | null>} The user if found, or null if no user exists with that email
 */
const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
    );

    return result.total > 0 ? result.documents[0] : null;
};

/**
 * Handles errors by logging them to the console and throwing them.
 * 
 * @param {unknown} error - The error object to handle
 * @param {string} message - Message about the error context
 * @throws {unknown} Re-throws the original error
 */
const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

/**
 * Sends an OTP (One-Time Password) to the specified email address.
 * Uses Appwrite's email token generation to create a secure OTP.
 * 
 * @param {string} email - The email address to send the OTP to
 * @returns {Promise<string>} The unique user ID associated with the OTP session
 * @throws {Error} If OTP generation fails
 */
export const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email);

        return session.userId;
    } catch (error) {
        handleError(error, "Failed to send email OTP");
    }
};

/**
 * Creates a new user account with the provided name and email.
 * Sends an OTP to verify the email and stores the user document in the database.
 * If the user already exists, only updates the verification status.
 * 
 * @param {string} fullName - The full name of the user
 * @param {string} email - The email address of the user
 * @returns {Promise<{accountId: string}>} An object containing the account ID
 * @throws {Error} If OTP generation fails or database operation fails
 */
export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
    const existingUser = await getUserByEmail(email);

    const accountId = await sendEmailOTP({ email });
    if (!accountId) throw new Error("Failed to send an OTP");

    if (!existingUser) {
        const { databases } = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: avatarPlaceholderUrl,
                accountId,
            },
        );
    }

    return parseStringify({ accountId });
};

/**
 * Verifies the OTP and creates an authenticated session for the user.
 * Sets a secure HTTP-only cookie containing the session token.
 * 
 * @param {string} accountId - The unique account ID from the OTP creation
 * @param {string} password - The OTP code that was sent to the user's email
 * @returns {Promise<{sessionId: string}>} An object containing the session ID
 * @throws {Error} If OTP verification fails
 */
export const verifySecret = async ({ accountId, password }: { accountId: string; password: string }) => {
    try {
        const { account } = await createAdminClient();

        const session = await account.createSession(accountId, password);

        (await cookies()).set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify({ sessionId: session.$id });
    } catch (error) {
        handleError(error, "Failed to verify OTP");
    }
};

/**
 * Retrieves the currently authenticated user's profile information.
 * Uses the session cookie to identify and fetch the user's data.
 * 
 * @returns {Promise<any | null>} The current user's document data if authenticated, or null if not found
 * @throws {void} Silently catches errors and returns null on failure
 */
export const getCurrentUser = async () => {
    try {
        const { databases, account } = await createSessionClient();

        const result = await account.get();

        const user = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.equal("accountId", result.$id)],
        );

        if (user.total <= 0) return null;

        return parseStringify(user.documents[0]);
    } catch (error) {
        console.log(error);
    }
};

/**
 * Signs out the current user by deleting their session and clearing cookies.
 * Redirects the user to the sign-in page after logout.
 * 
 * @returns {Promise<void>} No return value; redirects on completion
 * @throws {Error} If session deletion fails
 */
export const signOutUser = async () => {
    const { account } = await createSessionClient();

    try {
        await account.deleteSession("current");
        (await cookies()).delete("apprwite-session");
    } catch (error) {
        handleError(error, "Failed to sign out user");
    } finally {
        redirect("/sign-in");
    }
};

/**
 * Signs in an existing user by sending an OTP to their email address.
 * Verifies the user exists before sending the OTP.
 * 
 * @param {string} email - The email address of the user to sign in
 * @returns {Promise<{accountId: string}>} An object containing the user's account ID
 * @throws {Error} If user not found or OTP sending fails
 */
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
