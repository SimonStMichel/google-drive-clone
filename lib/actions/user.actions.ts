"use server";

import { createSupabaseServerClient } from "../supabase/server-client";
import { avatarPlaceholderUrl } from "@/constants";

export async function getCurrentUser() {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
        $id: user.id,
        email: user.email!,
        fullName: (user.user_metadata?.full_name as string | undefined) ?? user.email!,
        avatar: (user.user_metadata?.avatar_url as string | undefined) ?? avatarPlaceholderUrl,
        accountId: user.id,
    };
}
