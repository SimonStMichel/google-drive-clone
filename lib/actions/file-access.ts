// Shared "can this user read this file" rule, used by both the copyFile server
// action and the download route. Not a Server Action itself (no "use server"),
// so it can be a plain sync helper imported from either place.
export const hasFileAccess = (
  file: { owner: string; shared_with: string[] | null },
  user: { id: string; email?: string | null }
) => {
  const isOwner = file.owner === user.id;
  const email = user.email?.toLowerCase();
  const isShared = Array.isArray(file.shared_with) && !!email && file.shared_with.includes(email);
  return isOwner || isShared;
};
