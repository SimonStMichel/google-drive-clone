import { NextResponse } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/supabase/server-client";
import { supabaseConfig } from "@/lib/supabase/config";
import { hasFileAccess } from "@/lib/actions/file-access";

const DOWNLOAD_URL_TTL = 60; // seconds

// Authorized download: `fileId` is the file row id. We verify the session,
// check the caller owns or is shared on the file, then redirect to a
// short-lived signed URL that forces an attachment download.
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;

    let user;
    try {
        const supabase = await createSessionClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error;
        user = data.user;
    } catch {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const admin = createAdminClient();

    const { data: file, error } = await admin
        .from("files")
        .select("*")
        .eq("id", fileId)
        .single();

    if (error || !file) {
        return new NextResponse("File not found", { status: 404 });
    }

    if (!hasFileAccess(file, { id: user.id, email: user.email })) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const filename = file.extension ? `${file.name}.${file.extension}` : file.name;

    const { data: signed, error: signError } = await admin.storage
        .from(supabaseConfig.bucket)
        .createSignedUrl(file.bucket_file_id, DOWNLOAD_URL_TTL, { download: filename });

    if (signError || !signed?.signedUrl) {
        return new NextResponse("File not found", { status: 404 });
    }

    return NextResponse.redirect(signed.signedUrl);
}
