"use server";

import { NextRequest } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/supabase/server-client";
import { supabaseConfig } from "@/lib/supabase/config";

export async function GET(_req: NextRequest, context: { params: Promise<{ name: string }> }) {
    const { name: fullName } = await context.params;

    let user;
    try {
        const supabase = await createSessionClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error;
        user = data.user;
    } catch {
        return new Response("Unauthorized", { status: 401 });
    }

    const dotIndex = fullName.lastIndexOf(".");
    const name = dotIndex !== -1 ? fullName.slice(0, dotIndex) : fullName;
    const extension = dotIndex !== -1 ? fullName.slice(dotIndex + 1) : "";

    const supabaseAdmin = createAdminClient();

    let query = supabaseAdmin.from("files").select("*").eq("name", name);
    if (extension) query = query.eq("extension", extension);

    const { data: fileDocs, error: fetchError } = await query;

    if (fetchError || !fileDocs?.length) {
        return new Response("File not found", { status: 404 });
    }

    const fileDoc = fileDocs.find(
        (f) => f.owner === user.id || (Array.isArray(f.shared_with) && f.shared_with.includes(user.email))
    );

    if (!fileDoc) {
        return new Response("Forbidden", { status: 403 });
    }

    const { data: fileStream, error: downloadError } = await supabaseAdmin.storage
        .from(supabaseConfig.bucket)
        .download(fileDoc.bucket_file_id);

    if (downloadError || !fileStream) {
        return new Response("File not found", { status: 404 });
    }

    return new Response(fileStream, {
        headers: {
            "Content-Type": fileStream.type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${fullName}"`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=0",
        },
    });
}
