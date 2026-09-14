import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";
    if (tokenHash && type) {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
        });
        if (!error) {
            // redirect user to specified redirect URL or root of app
            redirect(next);
        }
    }
    // verification failed - send the user back to sign in
    redirect("/sign-in");
}