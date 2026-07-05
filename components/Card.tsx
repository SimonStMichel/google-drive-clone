"use client";

import Link from "next/link";

import { convertFileSize } from "@/lib/utils";

import Thumbnail from "./Thumbnail";
import ActionDropdown from "./ActionDropdown";
import FormattedDateTime from "./FormattedDateTime";

const Card = ({ file }: { file: SupabaseFile }) => {
  return (
    <Link href={file.url || `/api/download/${file.$id}`} target="_blank" rel="noopener noreferrer" className="file-card">
      <div className="flex justify-between">
        <Thumbnail type={file.type} extension={file.extension} url={file.url} className="!size-20" imageClassName="!size-11" />
        <div className="flex flex-col items-end justify-between">
          <ActionDropdown file={file} />
          <p className="body-1">{convertFileSize(file.size)}</p>
        </div>
      </div>
      {file.isSharedWithMe && <span className="shared-badge">Shared with you</span>}
      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        <FormattedDateTime date={file.$createdAt} className="body-2 text-light-100" />
      </div>
    </Link>
  );
};

export default Card;
