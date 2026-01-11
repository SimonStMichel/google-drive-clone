"use client";

import React from 'react';

import Sidebar from '@/components/Sidebar';
import MobileNavigation from '@/components/MobileNavigation';
import Header from '@/components/Header';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex h-screen'>
        <Sidebar/>

        <section className="flex h-full flex-1 flex-col">
            <MobileNavigation/>
            <Header/>

            <div className='main-content'>
                { children }
            </div>
        </section>
    </div>
  )
}

export default Layout