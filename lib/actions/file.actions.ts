"use server";

import { createAdminClient } from "../supabase/server-client";
import { supabaseConfig } from "../supabase/config";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

// Maps a raw DB row (snake_case) to the shape expected across the UI
const mapFileRecord = (item: Record<string, unknown>) => ({
  ...item,
  $id: item.id,
  bucketFileId: item.bucket_file_id,
  accountId: item.account_id,
  $createdAt: item.created_at,
  $updatedAt: item.updated_at,
});

export const uploadFile = async ({ file, ownerId, accountId, path }: UploadFileProps) => {
  const supabase = createAdminClient();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { name, extension, type } = getFileType(file.name);
    const bucketFileId = `${accountId}-${crypto.randomUUID()}-${name}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .upload(bucketFileId, fileBuffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const fileDocument = {
      type,
      name,
      url: constructFileUrl(bucketFileId),
      extension,
      size: fileBuffer.byteLength,
      owner: ownerId,
      account_id: accountId,
      users: [],
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
    return parseStringify(mapFileRecord(newFile));
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

const createQueries = (
  currentUser: { $id: string; email: string },
  types: string[],
  searchText: string,
  sort: string,
  limit?: number
) => {
  const [sortField, sortDir] = sort.split("-");
  const sortBy = sortField === "$createdAt" ? "created_at" : sortField;
  const ascending = sortDir === "asc";

  let query = createAdminClient()
    .from("files")
    .select("*")
    .or(`owner.eq.${currentUser.$id},users.cs.{${currentUser.$id}}`);

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

    const query = createQueries(currentUser, types, searchText, sort, limit);
    const { data, error } = await query;

    if (error) throw error;

    return parseStringify({
      documents: (data ?? []).map(mapFileRecord),
      total: data?.length ?? 0,
    });
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({ fileId, name, path }: RenameFileProps) => {
  try {
    const { data: updatedFile, error } = await createAdminClient()
      .from("files")
      .update({ name })
      .eq("id", fileId)
      .select("*")
      .single();

    if (error) throw error;

    revalidatePath(path);
    return parseStringify(mapFileRecord(updatedFile));
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({ file, emails, path }: UpdateFileUsersProps) => {
  try {
    const { data: updatedFile, error } = await createAdminClient()
      .from("files")
      .update({ users: emails })
      .eq("id", file.$id)
      .select("*")
      .single();

    if (error) throw error;

    revalidatePath(path);
    return parseStringify(mapFileRecord(updatedFile));
  } catch (error) {
    handleError(error, "Failed to update users list");
  }
};

export const deleteFile = async ({ fileId, bucketFileId, path }: DeleteFileProps) => {
  try {
    const supabase = createAdminClient();

    const { error: deleteError } = await supabase.from("files").delete().eq("id", fileId);
    if (deleteError) throw deleteError;

    const { error: storageError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .remove([bucketFileId]);
    if (storageError) throw storageError;

    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete file");
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
