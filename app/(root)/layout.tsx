import React from 'react';

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/actions/user.actions';

import Sidebar from '@/components/Sidebar';
import MobileNavigation from '@/components/MobileNavigation';
import Header from '@/components/Header';

const Layout = async ({ children }: { children: React.ReactNode }) => {

  const currentUser = await getCurrentUser();

  if(!currentUser) return redirect("/sign-in");

  return (
    <div className='flex h-screen'>
        <Sidebar {...currentUser}/>

        <section className="flex h-full flex-1 flex-col">
            <MobileNavigation {...currentUser}/>
            <Header/>

            <div className='main-content'>
                { children }
            </div>
        </section>
    </div>
  )
}

export default Layout