/* eslint-disable no-unused-vars */

declare type FileType = "document" | "image" | "video" | "audio" | "other";

// Normalised file record returned by file actions (DB row + mapped convenience fields)
declare interface SupabaseFile {
  // Raw DB columns
  id: string;
  name: string;
  type: FileType;
  extension: string;
  size: number;
  url: string;
  bucket_file_id: string;
  account_id: string;
  owner: string;
  shared_with: string[];
  created_at: string;
  updated_at: string;
  // Mapped convenience fields added by mapFileRecord
  $id: string;
  bucketFileId: string;
  accountId: string;
  $createdAt: string;
  $updatedAt: string;
  isSharedWithMe: boolean;
}

declare interface ActionType {
  label: string;
  icon: string;
  value: string;
  visibility?: "owner" | "shared";
}

declare interface SearchParamProps {
  params?: Promise<SegmentParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

declare interface UploadFileProps {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
}
declare interface GetFilesProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  limit?: number;
}
declare interface RenameFileProps {
  fileId: string;
  name: string;
  path: string;
}
declare interface UpdateFileUsersProps {
  file: SupabaseFile;
  emails: string[];
  path: string;
}
declare interface DeleteFileProps {
  fileId: string;
  path: string;
}
declare interface CopyFileProps {
  fileId: string;
  path: string;
}
declare interface RemoveMyAccessProps {
  fileId: string;
  path: string;
}

declare interface FileUploaderProps {
  ownerId: string;
  accountId: string;
  className?: string;
}

declare interface MobileNavigationProps {
  ownerId: string;
  accountId: string;
  fullName: string;
  avatar: string;
  email: string;
}
declare interface SidebarProps {
  fullName: string;
  avatar: string;
  email: string;
}

declare interface ThumbnailProps {
  type: string;
  extension: string;
  url: string;
  className?: string;
  imageClassName?: string;
}

declare interface ShareInputProps {
  file: SupabaseFile;
  onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
  onRemove: (email: string) => void;
}
