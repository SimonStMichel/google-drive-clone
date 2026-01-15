"use client";

import React, { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface Props {
    ownerId: string;
    accountId: string;
    fullName: string;
    avatar: string;
    email: string;
}


const MobileNavigation = ({ ownerId, accountId, fullName, avatar, email }: Props) => {

  const [open, setOpen] = useState(false);
  const pathanme = usePathname();

  return (
    <header className="mobile-header">
      <Image src="/assets/icons/logo-full-brand.svg" alt="logo" width={120} height={52} className='h-auto'/>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Image src="/assets/icons/menu.svg" alt="search" width={30} height={30}/>
        </SheetTrigger>
        <SheetContent className="shad-sheet h-screen px-3">
            <SheetTitle>
              <div className="header-user">
                <Image src={avatar} alt="avatar" width={44} height={44} className='header-user-avatar'/>
                <div className="sm:hidden lg:block">
                  <p className="subtitle-2 capitalize">{ fullName }</p>
                  <p className="caption">{ email }</p>
                </div>
              </div>
              
            </SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re done.
            </SheetDescription>
          <div className="grid flex-1 auto-rows-min gap-6 px-4">
            <div className="grid gap-3">
              <Label htmlFor="sheet-demo-name">Name</Label>
              <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="sheet-demo-username">Username</Label>
              <Input id="sheet-demo-username" defaultValue="@peduarte" />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit">Save changes</Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default MobileNavigation;