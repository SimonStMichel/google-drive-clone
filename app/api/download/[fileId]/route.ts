"use server";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { supabaseConfig } from "@/lib/supabase/config";

export async function GET(
    _req: Request,
    { params }: { params: { fileId: string } }
) {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage.from(supabaseConfig.bucket).download(params.fileId);

    if (error || !data) {
        return new NextResponse("File not found", { status: 404 });
    }

    const { data: metadata } = await supabase.storage.from(supabaseConfig.bucket).getMetadata(params.fileId);

    return new NextResponse(data, {
        headers: {
            "Content-Disposition": "attachment",
            "Content-Type": metadata?.data?.contentType || "application/octet-stream",
        },
    });
}
