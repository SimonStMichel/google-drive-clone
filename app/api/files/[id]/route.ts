"use server";

import { NextRequest } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: fileId } = await context.params;

    let user;
    try {
        const { account } = await createSessionClient();
        user = await account.get();
    } catch {
        return new Response("Unauthorized", { status: 401 });
    }

    const { databases, storage } = await createAdminClient();

    let fileDoc;
    try {
        fileDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId
        );
    } catch {
        return new Response("File not found", { status: 404 });
    }

    const isOwner = fileDoc.owner.accountId === user.$id;
    const isSharedUser = fileDoc.users.includes(user.email);

    if (!isOwner && !isSharedUser) {
        return new Response("Forbidden", { status: 403 });
    }

    const fileInfo = await storage.getFile(appwriteConfig.bucketId, fileDoc.bucketFileId);
    const fileStream = await storage.getFileDownload(appwriteConfig.bucketId, fileDoc.bucketFileId);

    return new Response(fileStream, {
        headers: {
            "Content-Type": fileInfo.mimeType,
            "Content-Disposition": `inline; filename="${fileInfo.name}"`,
            "Content-Length": fileInfo.sizeOriginal.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=0",
        },
    });
}

