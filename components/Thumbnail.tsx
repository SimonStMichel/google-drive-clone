"use client";

import Image from "next/image";

import { getFileIcon, cn } from "@/lib/utils";

interface Props {
    type: string;
    extension: string;
    url?: string;
    imageClassName?: string;
    className?: string;
}

const Thumbnail = ({ type, extension, url = "", imageClassName, className }: Props) => {
    // Fall back to the file-type icon when there's no usable image URL
    // (e.g. a signed URL failed to generate), so next/image never gets an empty src.
    const isImage = type === "image" && extension !== "svg" && !!url;
    return (
        <figure className={cn("thumbnail", className)}>
            <Image src={isImage ? url : getFileIcon(extension, type)} alt="thumbnail" width={100} height={100} className={cn("size-8 object-contain", imageClassName, isImage && "thumbnail-image")} />
        </figure>
    );
};

export default Thumbnail;