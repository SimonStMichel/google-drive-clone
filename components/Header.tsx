"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

import Search from "./Search";
import { Button } from "./ui/button";
import FileUploader from "./FileUploader";
interface Props {
  userId: string,
  accountId: string
}

const Header = ({ userId, accountId }: Props) => {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className='header'>
      <Search />
      <div className="header-wrapper">
        <FileUploader ownerId={userId} accountId={accountId} />
        <Button onClick={handleSignOut} type="button" className="sign-out-button">
          <Image src="/assets/icons/logout.svg" alt="logout" width={24} height={24} className='w-6' />
        </Button>
      </div>
    </header>
  );
};

export default Header;