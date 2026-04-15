"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

const createClientWithServiceRole = () =>
    createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
        auth: { persistSession: false, detectSessionInUrl: false },
    });

export const createAdminClient = () => createClientWithServiceRole();

export const createSessionClient = async () => {
    const session = (await cookies()).get("appwrite-session");

    if (!session || !session.value) throw new Error("No session");

    const client = createClientWithServiceRole();
    client.auth.setAuth(session.value);

    return client;
};