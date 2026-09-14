"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cached singleton - one browser client per tab, shared by AuthContext and any
// client component that needs it.
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
    if (client) {
        return client;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // Mirrors the guard in server-client.ts: fail with a readable message at the
    // call site instead of letting `undefined` reach the SDK as a URL/key.
    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        );
    }

    client = createBrowserClient(supabaseUrl, supabasePublishableKey);
    return client;
}
