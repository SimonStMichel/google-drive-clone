export const navItems = [
    {
        name: "Dashboard",
        icon: "/assets/icons/dashboard.svg",
        url: "/"
    },
    {
        name: "Documents",
        icon: "/assets/icons/documents.svg",
        url: "/documents"
    },
    {
        name: "Images",
        icon: "/assets/icons/images.svg",
        url: "/images"
    },
    {
        name: "Media",
        icon: "/assets/icons/video.svg",
        url: "/media"
    },
    {
        name: "Others",
        icon: "/assets/icons/others.svg",
        url: "/others"
    },
];

export const actionsDropdownItems: ActionType[] = [
    {
        label: "Rename",
        icon: "/assets/icons/edit.svg",
        value: "rename",
        visibility: "owner"
    },
    {
        label: "Details",
        icon: "/assets/icons/info.svg",
        value: "details"
    },
    {
        label: "Share",
        icon: "/assets/icons/share.svg",
        value: "share",
        visibility: "owner"
    },
    {
        label: "Download",
        icon: "/assets/icons/download.svg",
        value: "download"
    },
    {
        label: "Save a Copy",
        icon: "/assets/icons/copy.svg",
        value: "copy",
        visibility: "shared"
    },
    {
        label: "Remove Access",
        icon: "/assets/icons/remove.svg",
        value: "removeAccess",
        visibility: "shared"
    },
    {
        label: "Delete",
        icon: "/assets/icons/delete.svg",
        value: "delete",
        visibility: "owner"
    },
];

export const sortTypes = [
    {
        label: "Date created (newest)",
        value: "$createdAt-desc",
    },
    {
        label: "Date created (oldest)",
        value: "$createdAt-asc",
    },
    {
        label: "Name (A-Z)",
        value: "name-asc",
    },
    {
        label: "Name (Z-A)",
        value: "name-desc",
    },
    {
        label: "Size (highest)",
        value: "size-desc",
    },
    {
        label: "Size (lowest)",
        value: "size-asc",
    },
];

export const avatarPlaceholderUrl = "/assets/images/avatar.png";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB