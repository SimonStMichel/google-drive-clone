"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";

import { InputFile } from "node-appwrite/file";
import { ID, Query, Models, Permission, Role } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

interface UploadFileProps {
    file: File;
    ownerId: string;
    accountId: string;
    path: string;
}

/**
 * Handles errors by logging them to the console and throwing them.
 * 
 * @param {unknown} error - The error object to handle
 * @param {string} message - A descriptive message about the error context
 * @throws {unknown} Re-throws the original error
 */
const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

/**
 * Uploads a file to Appwrite storage and creates a corresponding database document.
 * Automatically handles file type detection and URL construction.
 * Cleans up storage if database document creation fails.
 * 
 * @param {File} file - The file object to upload
 * @param {string} ownerId - The ID of the file owner
 * @param {string} accountId - The account ID associated with the file
 * @param {string} path - The path to revalidate after upload
 * @returns {Promise<any>} The created file document with metadata
 * @throws {Error} If upload or document creation fails
 */
export const uploadFile = async ({ file, ownerId, accountId, path }: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file, file.name);

        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
            [
                Permission.read(Role.user(accountId)),   // uploader
                Permission.update(Role.user(accountId)),
                Permission.delete(Role.user(accountId))
            ]);

        const { name, extension, type } = getFileType(bucketFile.name);

        const fileDocument = {
            type,
            name,
            url: constructFileUrl(bucketFile.$id),
            extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId,
            users: [],
            bucketFileId: bucketFile.$id
        };

        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            ID.unique(),
            fileDocument,
        ).catch(async (error: unknown) => {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);

            handleError(error, "Failed to create file document");
        });

        revalidatePath(path);

        return parseStringify(newFile);
    } catch (error) {
        handleError(error, "Failed to upload file");
    }
};

/**
 * Creates Appwrite queries for filtering and sorting files.
 * Builds queries for file ownership and shared access, with optional filtering by type, name, and sort order.
 * 
 * @param {Models.Document} currentUser - The current user document
 * @param {string[]} types - Array of file types to filter by
 * @param {string} searchText - Text to search in file names
 * @param {string} sort - Sort key and order in format "key-order" (e.g., "$createdAt-desc")
 * @param {number} [limit] - Optional maximum number of results
 * @returns {Query[]} Array of Appwrite Query objects
 */
const createQueries = (currentUser: Models.Document, types: string[], searchText: string, sort: string, limit?: number) => {
    const queries = [
        Query.or([
            Query.equal("owner", [currentUser.$id]),
            Query.contains("users", [currentUser.email])
        ])
    ];

    if (types.length > 0) queries.push(Query.equal("type", types));
    if (searchText) queries.push(Query.contains("name", searchText));
    if (limit) queries.push(Query.limit(limit));

    const [sortBy, orderBy] = sort.split("-");
    queries.push(orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy));

    return queries;
};

/**
 * Retrieves files for the current user based on filter criteria.
 * Returns files owned by the user or shared with them.
 * 
 * @param {FileType[]} types - Array of file types to filter by (document, image, video, audio, other)
 * @param {string} [searchText] - Optional text to search in file names
 * @param {string} [sort] - Optional sort key and order (default: "$createdAt-desc")
 * @param {number} [limit] - Optional maximum number of files to retrieve
 * @returns {Promise<any>} Object containing array of file documents and metadata
 * @throws {Error} If user not found or database query fails
 */
export const getFiles = async ({ types = [], searchText = "", sort = "$createdAt-desc", limit }: GetFilesProps) => {
    const { databases } = await createAdminClient();

    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types, searchText, sort, limit);

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries
        );

        return parseStringify(files);

    } catch (error) {
        handleError(error, "Failed to get files");
    }
};

/**
 * Renames an existing file in the database.
 * Updates the file document and revalidates the specified path.
 * 
 * @param {string} fileId - The ID of the file to rename
 * @param {string} name - The new name for the file
 * @param {string} path - The path to revalidate after rename
 * @returns {Promise<any>} The updated file document
 * @throws {Error} If update fails
 */
export const renameFile = async ({ fileId, name, path }: RenameFileProps) => {
    const { databases } = await createAdminClient();

    try {
        const newName = `${name}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
};

/**
 * Updates the list of users with whom a file is shared.
 * Replaces the entire users list with the provided email addresses.
 * 
 * @param {string} fileId - The ID of the file to update
 * @param {string[]} emails - Array of email addresses to share the file with
 * @param {string} path - The path to revalidate after update
 * @returns {Promise<any>} The updated file document
 * @throws {Error} If update fails
 */
export const updateFileUsers = async ({ fileId, emails, path }: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    try {
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                users: emails,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to update users list");
    }
};

/**
 * Deletes a file from both the database and storage.
 * Removes the file document from the database and the actual file from storage.
 * 
 * @param {string} fileId - The ID of the file document to delete
 * @param {string} bucketFileId - The ID of the file in storage bucket
 * @param {string} path - The path to revalidate after deletion
 * @returns {Promise<{status: string}>} Object with status indicating success
 * @throws {Error} If deletion fails
 */
export const deleteFile = async ({ fileId, bucketFileId, path }: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    try {
        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
        );

        if (deletedFile) {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
        }

        revalidatePath(path);
        return parseStringify({ status: "success" });
    } catch (error) {
        handleError(error, "Failed to update users list");
    }
};

/**
 * Calculates total storage space used by the current user across all file types.
 * Returns detailed breakdown of space used by document, image, video, audio, and other file types.
 * 
 * @returns {Promise<any>} Object containing:
 *   - image: { size, latestDate }
 *   - document: { size, latestDate }
 *   - video: { size, latestDate }
 *   - audio: { size, latestDate }
 *   - other: { size, latestDate }
 *   - used: Total bytes used
 *   - all: Total available bytes (2GB)
 * @throws {Error} If user not authenticated or database query fails
 */
export async function getTotalSpaceUsed() {
    try {
        const { databases } = await createSessionClient();
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User is not authenticated.");

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            [Query.equal("owner", [currentUser.$id])],
        );

        const totalSpace = {
            image: { size: 0, latestDate: "" },
            document: { size: 0, latestDate: "" },
            video: { size: 0, latestDate: "" },
            audio: { size: 0, latestDate: "" },
            other: { size: 0, latestDate: "" },
            used: 0,
            all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
            const fileType = file.type as FileType;
            totalSpace[fileType].size += file.size;
            totalSpace.used += file.size;

            if (
                !totalSpace[fileType].latestDate ||
                new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
            ) {
                totalSpace[fileType].latestDate = file.$updatedAt;
            }
        });

        return parseStringify(totalSpace);
    } catch (error) {
        handleError(error, "Error calculating total space used:, ");
    }
}