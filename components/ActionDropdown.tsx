"use client";

import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { actionsDropdownItems } from "@/constants";
import { renameFile, deleteFile, updateFileUsers, copyFile, removeMyAccess } from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FileDetails, ShareInput } from "./ActionsModalContent";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const ActionDropdown = ({ file }: { file: SupabaseFile }) => {
    const path = usePathname();
    const { toast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);
    const [name, setName] = useState(file.name);
    const [isLoading, setIsLoading] = useState(false);
    const [emails, setEmails] = useState<string[]>([]);

    const visibleItems = actionsDropdownItems.filter((item) => {
        if (item.visibility === "owner") return !file.isSharedWithMe;
        if (item.visibility === "shared") return file.isSharedWithMe;
        return true;
    });

    const closeAllModals = () => {
        setIsModalOpen(false);
        setIsDropdownOpen(false);
        setAction(null);
        setName(file.name);
        setEmails([]);
    };

    const showErrorToast = (error: unknown, fallback: string) => {
        toast({
            description: (
                <p className="body-2 text-white">{error instanceof Error ? error.message : fallback}</p>
            ),
            className: "error-toast",
        });
    };

    const handleAction = async () => {
        if (!action) return;

        setIsLoading(true);

        const actions: Record<string, () => Promise<unknown>> = {
            rename: () => renameFile({ fileId: file.$id, name, path }),
            share: () => handleAddUser(),
            delete: () => deleteFile({ fileId: file.$id, path }),
            removeAccess: () => removeMyAccess({ fileId: file.$id, path }),
        };

        try {
            const handler = actions[action.value];
            const success = handler ? await handler() : false;

            if (success) closeAllModals();
        } catch (error) {
            showErrorToast(error, "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async () => {
        // Merge newly typed emails into the existing share list (dedupe, drop blanks).
        // The server strips the owner's own email (sharing with yourself is a no-op)
        // and reports back whether it did, via `selfShareBlocked` - driving the toast
        // off that server-authoritative flag instead of a client-side email guess.
        const newEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
        const merged = Array.from(new Set([...(file.shared_with ?? []), ...newEmails]));

        const result = await updateFileUsers({ file, emails: merged, path });

        if (result?.selfShareBlocked) {
            toast({
                description: (
                    <p className="body-2 text-white">You already have access - no need to share with yourself</p>
                ),
                className: "error-toast",
            });
        }

        return result;
    };

    const handleCopy = async () => {
        setIsLoading(true);

        try {
            await copyFile({ fileId: file.$id, path });
            setIsDropdownOpen(false);
            toast({
                description: <p className="body-2 text-white">Saved a copy to your files</p>,
            });
        } catch (error) {
            setIsDropdownOpen(false);
            showErrorToast(error, "Could not save a copy");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUser = async (email: string) => {
        const updatedEmails = file.shared_with.filter((e) => e !== email);
        const success = await updateFileUsers({ file, emails: updatedEmails, path });
        if (success) closeAllModals();
    };

    const renderDialogContent = () => {
        if (!action) return null;

        const { value, label } = action;

        return (
            <DialogContent className="shad-dialog button">
                <DialogHeader className="flex flex-col gap-3">
                    <DialogTitle className="text-center text-light-100">{label}</DialogTitle>
                    {value === "rename" && <Input type="text" className="!rounded-[8px] text-light-100" value={name} onChange={(e) => setName(e.target.value)} />}
                    {value === "share" && <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser} />}
                    {value === "details" && <FileDetails file={file} />}
                    {value === "delete" && (
                        <p className="delete-confirmation">Are you sure you want to delete{" "}<span className="delete-file-name">{file.name}</span>?</p>
                    )}
                    {value === "removeAccess" && (
                        <p className="delete-confirmation">Remove your access to{" "}<span className="delete-file-name">{file.name}</span>? You&apos;ll need to be shared with again to see it.</p>
                    )}
                </DialogHeader>
                {["rename", "delete", "share", "removeAccess"].includes(value) && (
                    <DialogFooter className="flex flex-col gap-3 md:flex-row">
                        <Button onClick={closeAllModals} className="modal-cancel-button">Cancel</Button>
                        <Button onClick={handleAction} className="modal-submit-button">
                            <p>{label}</p>
                            {isLoading && (
                                <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className="animate-spin" />
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        );
    };

    return (
        // Both call sites (Card, and the dashboard's recent-files list) render this
        // inside the file's own <Link>. Radix portals the menu and the dialog to the
        // document body, so clicks in them never reach that anchor in the DOM - but
        // React still replays them up the component tree, which would fire the Link's
        // handler and navigate away mid-rename. stopPropagation here cuts that off
        // while leaving the Download item's own anchor free to navigate.
        <div onClick={(e) => e.stopPropagation()}>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                {/* The trigger, unlike the portalled content, really is inside the
                    anchor - so it also has to suppress the browser's own navigation. */}
                <DropdownMenuTrigger
                    className="shad-no-focus"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Image src="/assets/icons/dots.svg" alt="dots" width={34} height={34} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel className="max-w-[200px] truncate">
                        {file.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {visibleItems.map((actionItem) => (
                        <DropdownMenuItem key={actionItem.value} className="shad-dropdown-item" onClick={() => {
                            if (actionItem.value === "copy") {
                                handleCopy();
                                return;
                            }
                            setAction(actionItem);
                            if (["rename", "share", "delete", "details", "removeAccess"].includes(actionItem.value)) {
                                setIsModalOpen(true);
                            }
                        }}>
                            {actionItem.value === "download" ? (
                                <Link href={`/api/download/${file.$id}`} download={`${file.name}.${file.extension}`} className="flex items-center gap-2">
                                    <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                                    {actionItem.label}
                                </Link>
                            ) : actionItem.value === "copy" ? (
                                <div className="flex items-center gap-2">
                                    <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                                    {actionItem.label}
                                    {isLoading && (
                                        <Image src="/assets/icons/loader.svg" alt="loader" width={16} height={16} className="animate-spin" />
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                                    {actionItem.label}
                                </div>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>
        </div>
    );
};

export default ActionDropdown;
