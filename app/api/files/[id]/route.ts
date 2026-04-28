"use server";

import { NextRequest } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/supabase/server-client";
import { supabaseConfig } from "@/lib/supabase/config";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: fileId } = await context.params;

    let user;
    try {
        const supabase = await createSessionClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error;
        user = data.user;
    } catch {
        return new Response("Unauthorized", { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: fileDoc, error: fetchError } = await supabaseAdmin
        .from("files")
        .select("*")
        .eq("id", fileId)
        .single();

    if (fetchError || !fileDoc) {
        return new Response("File not found", { status: 404 });
    }

    const isOwner = fileDoc.owner === user.id;
    const isSharedUser = Array.isArray(fileDoc.users) && fileDoc.users.includes(user.email);

    if (!isOwner && !isSharedUser) {
        return new Response("Forbidden", { status: 403 });
    }

    const { data: metadata } = await supabaseAdmin.storage.from(supabaseConfig.bucket).getMetadata(fileDoc.bucketFileId);
    const { data: fileStream, error: downloadError } = await supabaseAdmin.storage
        .from(supabaseConfig.bucket)
        .download(fileDoc.bucketFileId);

    if (downloadError || !fileStream) {
        return new Response("File not found", { status: 404 });
    }

    return new Response(fileStream, {
        headers: {
            "Content-Type": metadata?.data?.contentType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${fileDoc.name}.${fileDoc.extension}"`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=0",
        },
    });
}

