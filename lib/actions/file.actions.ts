"use server";

import { createAdminClient } from "../supabase/server-client";
import { supabaseConfig } from "../supabase/config";
import { getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";
import { hasFileAccess } from "./file-access";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

// PostgREST's code for ".single() matched zero (or more than one) rows" - used
// below to mean "not found, or found but not yours" without a separate fetch.
const NO_ROW_MATCHED = "PGRST116";

// Fetches a single file row by id, used by the two actions (copyFile,
// removeMyAccess) that need more than an ownership check on their own row -
// copyFile needs the original's metadata, removeMyAccess needs the current
// shared_with array. rename/share/delete fold their ownership check directly
// into the mutation's own query filter instead (see below), so they don't need this.
const fetchFileRow = async <T>(
  supabase: ReturnType<typeof createAdminClient>,
  fileId: string,
  columns: string
): Promise<T> => {
  const { data, error } = await supabase.from("files").select(columns).eq("id", fileId).single();
  if (error) throw error;
  return data as unknown as T;
};

// Maps a raw DB row (snake_case) to the shape expected across the UI.
// `url` is a short-lived signed URL generated at read time (never persisted).
// `viewerId` (the acting/viewing user's id) drives `isSharedWithMe`.
const mapFileRecord = (item: Record<string, unknown>, signedUrl?: string, viewerId?: string) => ({
  ...item,
  url: signedUrl ?? (item.url as string | undefined) ?? "",
  $id: item.id,
  bucketFileId: item.bucket_file_id,
  accountId: item.account_id ?? item.owner,
  $createdAt: item.created_at,
  $updatedAt: item.updated_at,
  isSharedWithMe: viewerId ? item.owner !== viewerId : false,
});

// Generates a signed URL for a single stored object (best-effort).
const signOne = async (
  supabase: ReturnType<typeof createAdminClient>,
  bucketFileId: string
) => {
  const { data } = await supabase.storage
    .from(supabaseConfig.bucket)
    .createSignedUrl(bucketFileId, SIGNED_URL_TTL);
  return data?.signedUrl;
};

export const uploadFile = async ({ file, ownerId, accountId, path }: UploadFileProps) => {
  const supabase = createAdminClient();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { name, extension, type } = getFileType(file.name);
    const bucketFileId = crypto.randomUUID();

    const { error: uploadError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .upload(bucketFileId, fileBuffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const fileDocument = {
      type,
      name,
      extension,
      size: fileBuffer.byteLength,
      owner: ownerId,
      account_id: accountId,
      shared_with: [],
      bucket_file_id: bucketFileId,
    };

    const { data: newFile, error: insertError } = await supabase
      .from("files")
      .insert([fileDocument])
      .select("*")
      .single();

    if (insertError) {
      await supabase.storage.from(supabaseConfig.bucket).remove([bucketFileId]);
      handleError(insertError, "Failed to create file document");
    }

    revalidatePath(path);
    return parseStringify(mapFileRecord(newFile, await signOne(supabase, bucketFileId), ownerId));
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

const createQueries = (
  supabase: ReturnType<typeof createAdminClient>,
  currentUser: { $id: string; email: string },
  types: string[],
  searchText: string,
  sort: string,
  limit?: number
) => {
  const [sortField, sortDir] = sort.split("-");
  const sortBy = sortField === "$createdAt" ? "created_at" : sortField;
  const ascending = sortDir === "asc";

  // Files the user owns OR that are shared with their email address.
  // shared_with is stored lowercased on write, so match on the lowercased email.
  const sharedEmail = currentUser.email.toLowerCase();
  let query = supabase
    .from("files")
    .select("*")
    .or(`owner.eq.${currentUser.$id},shared_with.cs.{"${sharedEmail}"}`);

  if (types.length > 0) query = query.in("type", types);
  if (searchText) query = query.ilike("name", `%${searchText}%`);
  if (limit) query = query.limit(limit);

  return query.order(sortBy, { ascending });
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();
    const { data, error } = await createQueries(
      supabase,
      currentUser,
      types,
      searchText,
      sort,
      limit
    );

    if (error) throw error;

    const rows = data ?? [];

    // Batch-generate signed URLs for thumbnails / inline preview.
    const signedByPath: Record<string, string> = {};
    if (rows.length > 0) {
      const { data: signed } = await supabase.storage
        .from(supabaseConfig.bucket)
        .createSignedUrls(
          rows.map((r) => r.bucket_file_id),
          SIGNED_URL_TTL
        );
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) signedByPath[s.path] = s.signedUrl;
      });
    }

    return parseStringify({
      documents: rows.map((r) => mapFileRecord(r, signedByPath[r.bucket_file_id], currentUser.$id)),
      total: rows.length,
    });
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({ fileId, name, path }: RenameFileProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();

    // Ownership is enforced by the `.eq("owner", ...)` filter itself: a non-owner's
    // fileId simply matches zero rows, which `.single()` reports as PGRST116.
    const { data: updatedFile, error } = await supabase
      .from("files")
      .update({ name })
      .eq("id", fileId)
      .eq("owner", currentUser.$id)
      .select("*")
      .single();

    if (error) {
      if (error.code === NO_ROW_MATCHED) throw new Error("Only the file owner can rename this file");
      throw error;
    }

    revalidatePath(path);
    return parseStringify(mapFileRecord(updatedFile, undefined, currentUser.$id));
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({ file, emails, path }: UpdateFileUsersProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();

    // Sharing a file with its own owner is a no-op - drop it rather than storing it.
    // Computed from `currentUser.email` (server-authoritative), not a client guess,
    // so the caller can reliably tell the user this happened via `selfShareBlocked`.
    // Recipients are normalised here rather than trusting the caller to have done
    // it: reads match `shared_with` against a lowercased email (see createQueries
    // and hasFileAccess), so a stored `User@Example.com` would be invisible to the
    // very person it was shared with. Blanks and duplicates go too.
    const ownerEmail = currentUser.email.toLowerCase();
    const normalisedEmails = Array.from(
      new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))
    );
    const filteredEmails = normalisedEmails.filter((e) => e !== ownerEmail);
    const selfShareBlocked = filteredEmails.length !== normalisedEmails.length;

    // Ownership enforced via the `.eq("owner", ...)` filter, not a separate fetch -
    // never trusts the client-supplied `file.owner`.
    const { data: updatedFile, error } = await supabase
      .from("files")
      .update({ shared_with: filteredEmails })
      .eq("id", file.$id)
      .eq("owner", currentUser.$id)
      .select("*")
      .single();

    if (error) {
      if (error.code === NO_ROW_MATCHED) throw new Error("Only the file owner can share this file");
      throw error;
    }

    revalidatePath(path);
    return parseStringify({
      ...mapFileRecord(updatedFile, undefined, currentUser.$id),
      selfShareBlocked,
    });
  } catch (error) {
    handleError(error, "Failed to update users list");
  }
};

// Lets a non-owner recipient drop themselves from `shared_with` without needing the
// owner to do it. Only removes the caller's own email - never touches other recipients.
export const removeMyAccess = async ({ fileId, path }: RemoveMyAccessProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();

    const existing = await fetchFileRow<Pick<SupabaseFile, "owner" | "shared_with">>(
      supabase,
      fileId,
      "owner, shared_with"
    );

    if (existing.owner === currentUser.$id) {
      throw new Error("Owners cannot remove their own access - delete the file instead");
    }

    const email = currentUser.email.toLowerCase();
    if (!Array.isArray(existing.shared_with) || !existing.shared_with.includes(email)) {
      throw new Error("You do not have access to this file");
    }

    const { error } = await supabase
      .from("files")
      .update({ shared_with: existing.shared_with.filter((e: string) => e !== email) })
      .eq("id", fileId);
    if (error) throw error;

    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to remove access");
  }
};

export const deleteFile = async ({ fileId, path }: DeleteFileProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();

    // Delete-with-ownership-filter, returning the deleted row's bucket_file_id -
    // one round trip instead of fetch-then-delete, and still never trusts a
    // client-supplied bucket path.
    const { data: deletedFile, error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)
      .eq("owner", currentUser.$id)
      .select("bucket_file_id")
      .single();

    if (deleteError) {
      if (deleteError.code === NO_ROW_MATCHED) throw new Error("Only the file owner can delete this file");
      throw deleteError;
    }

    const { error: storageError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .remove([deletedFile.bucket_file_id]);
    if (storageError) throw storageError;

    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete file");
  }
};

export const copyFile = async ({ fileId, path }: CopyFileProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const supabase = createAdminClient();

    const original = await fetchFileRow<
      Pick<SupabaseFile, "owner" | "shared_with" | "bucket_file_id" | "type" | "name" | "extension" | "size">
    >(supabase, fileId, "*");

    // Same "does this user have access" rule the download route uses.
    if (!hasFileAccess(original, { id: currentUser.$id, email: currentUser.email })) {
      throw new Error("You do not have access to this file");
    }

    const newBucketFileId = crypto.randomUUID();

    const { error: copyError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .copy(original.bucket_file_id, newBucketFileId);
    if (copyError) throw copyError;

    const fileDocument = {
      type: original.type,
      name: `Copy of ${original.name}`,
      extension: original.extension,
      size: original.size,
      owner: currentUser.$id,
      account_id: currentUser.accountId,
      shared_with: [],
      bucket_file_id: newBucketFileId,
    };

    const { data: newFile, error: insertError } = await supabase
      .from("files")
      .insert([fileDocument])
      .select("*")
      .single();

    if (insertError) {
      await supabase.storage.from(supabaseConfig.bucket).remove([newBucketFileId]);
      return handleError(insertError, "Failed to save file copy");
    }

    revalidatePath(path);
    return parseStringify(
      mapFileRecord(newFile, await signOne(supabase, newBucketFileId), currentUser.$id)
    );
  } catch (error) {
    handleError(error, "Failed to save a copy of file");
  }
};

export async function getTotalSpaceUsed() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const { data: files, error } = await createAdminClient()
      .from("files")
      .select("type, size, updated_at")
      .eq("owner", currentUser.$id);

    if (error) throw error;

    const totalSpace = {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024,
    };

    (files ?? []).forEach((file) => {
      const fileType = file.type as FileType;
      totalSpace[fileType].size += file.size;
      totalSpace.used += file.size;

      if (
        !totalSpace[fileType].latestDate ||
        new Date(file.updated_at) > new Date(totalSpace[fileType].latestDate)
      ) {
        totalSpace[fileType].latestDate = file.updated_at;
      }
    });

    return parseStringify(totalSpace);
  } catch (error) {
    handleError(error, "Error calculating total space used");
  }
}
