"use client";

import React from "react";

import { convertFileSize, formatDateTime } from "@/lib/utils";

import Image from "next/image";

import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";

import { Input } from "./ui/input";
import { Button } from "./ui/button";

const ImageThumbnail = ({ file }: { file: Models.Document }) => (
    <div className="file-details-thumbnail">
        <Thumbnail type={file.type} extension={file.extension} url={file.url} />
        <div className="flex flex-col">
            <p className="subtitle-2 mb-1 text-light-100">{file.name}</p>
            <FormattedDateTime date={file.$createdAt} className="caption" />
        </div>
    </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row">
        <p className="file-details-label text-left">{label}</p>
        <p className="file-details-value text-left text-light-200">{value}</p>
    </div>
);

const SharedUsersRow = ({ label, values }: { label: string; values: string[] }) => (
    <div className="flex flex-col sm:flex-row">
        <p className="file-details-label text-left">{label}</p>
        <div>
            {values.map((value) => (
                <p key={value} className="file-details-value text-left text-light-200">{value}</p>
            )
            )}
        </div>
    </div>
);

export const FileDetails = ({ file }: { file: Models.Document }) => {
    return (
        <>
            <ImageThumbnail file={file} />
            <div className="space-y-4 px-2 pt-2">
                <DetailRow label="Format :" value={file.extension} />
                <DetailRow label="Size :" value={convertFileSize(file.size)} />
                <DetailRow label="Owner: " value={file.owner.fullName} />
                <DetailRow label="Last edit :" value={formatDateTime(file.$updatedAt)} />
                {file.users.length > 0 && (
                    <SharedUsersRow label="Sharing to :" values={file.users} />
                )}
            </div>
        </>
    );
};

interface Props {
    file: Models.Document;
    onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
    onRemove: (email: string) => void;
}

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
    return (
        <>
            <ImageThumbnail file={file} />
            <div className="share-wrapper">
                <p className="subtitle-2 pl-1 text-light-100">Share file with other users</p>
                <Input type="email" placeholder="Enter" className="share-input-field" onChange={(e) => onInputChange(e.target.value.trim().split(","))} />
                <div className="pt-4">
                    <div className="">
                        <p className="subtitle-2 text-light-100">Shared with <span className="text-light-200">{file.users.length} user{file.users.length > 1 ? "s" : ""}</span></p>
                        <ul className="pt-2">
                            {file.users.map((email: string) => (
                                <li key={email} className="flex items-center justify-between gap-2">
                                    <p className="subtitle-2">{email}</p>
                                    <Button onClick={() => onRemove(email)} className="share-remove-user">
                                        <Image src="/assets/icons/remove.svg" alt="remove" width={24} height={24} className="remove-icon" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};