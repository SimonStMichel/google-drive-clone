import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnvironnmentVariables() {
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
    const { supabaseUrl, supabasePublishableKey } = getEnvironnmentVariables();
    const cookieStore = await cookies();

    const allCookies = cookieStore.getAll();
    console.log("Server cookies:", allCookies.map(c => c.name));

    return createServerClient(supabaseUrl, supabasePublishableKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet, _headers) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch (error) {
                        console.log(error);
                    }
                },
            },
        }
    );
}