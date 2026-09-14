import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnvironmentVariables() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        );
    }

    return { supabaseUrl, supabasePublishableKey };
}

export async function createSupabaseServerClient() {
    const { supabaseUrl, supabasePublishableKey } = getEnvironmentVariables();
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabasePublishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Called from a Server Component - cookie writes are a no-op
                }
            },
        },
    });
}

// Session-scoped server client (cookie-aware, used in API routes)
export async function createSessionClient() {
    return createSupabaseServerClient();
}

// Service-role client for privileged server operations (never sent to browser).
// NOTE: the secret key MUST NOT be prefixed with NEXT_PUBLIC_ - that would inline
// it into the client bundle and let anyone bypass RLS.
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY"
        );
    }

    return createClient(supabaseUrl, supabaseSecretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
