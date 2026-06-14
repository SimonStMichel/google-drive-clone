"use server";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server-client";
import { supabaseConfig } from "@/lib/supabase/config";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage.from(supabaseConfig.bucket).download(fileId);

    if (error || !data) {
        return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(data, {
        headers: {
            "Content-Disposition": "attachment",
            "Content-Type": data.type || "application/octet-stream",
        },
    });
}
