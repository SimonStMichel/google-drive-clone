import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function GET(
    _req: Request,
    { params }: { params: { fileId: string } }
) {
    const { storage } = await createAdminClient();

    const file = await storage.getFileDownload(
        appwriteConfig.bucketId,
        params.fileId
    );

    return new NextResponse(file, {
        headers: {
            "Content-Disposition": "attachment",
        },
    });
}
