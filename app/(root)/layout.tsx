import React from "react";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import MobileNavigation from "@/components/MobileNavigation";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return redirect("/sign-in");

  return (
    <main className='flex h-screen'>
      <Sidebar {...user} />

      <section className="flex h-full flex-1 flex-col">
        {/* <MobileNavigation {...user} /> */}
        <Header userId={user.id} accountId={user.id} />

        <div className='main-content'>
          {children}
        </div>
      </section>
      <Toaster />
    </main>
  );
};

export default Layout;