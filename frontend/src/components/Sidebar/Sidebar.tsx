import React, { useState } from 'react'
import { MdMicrowave } from 'react-icons/md'
import { RiToolsLine } from 'react-icons/ri'
import { NavLink } from 'react-router-dom'
import { isMobile } from '../../utils'
import './index.css'


function MenuItem({ children, href }: { children: React.ReactNode, href: string }) {
    return (
    
        <NavLink
                to={href}
                className={({ isActive, isPending }) =>{
                        return 'my-3 sm:my-4 transition-all ease-in-out duration-200 w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] grid content-center justify-center hover:bg-neutral-700 rounded-xl cursor-pointer border-solid border-white border-2 ' + (isActive ? '' : 'border-transparent')
                    }}
                >
                <div className='pointer-events-none text-white'>
                    {children}
                </div>
        </NavLink>
    )
}

export default function Sidebar() {
    return (
        <>
            <div
                className="xs:w-screen sm:h-screen border-t-[1px] sm:border-t-0 sm:border-r-[1px] border-neutral-600 bg-neutral-800 z-100">
                <div className="flex flex-col justify-center">
                    <div id="logo" className="hidden sm:grid content-center justify-center p-3 border-b-[1px]  border-neutral-600 border-solid">
                        <NavLink to={'/'}>
                            <div className="w-[55px] mx-auto">
                                <img className="w-full h-full" src="/favicon.svg" alt="" />
                            </div>
                        </NavLink>
                    </div>
                    <div id="main-menu" className='sm:mt-5 flex sm:flex-col items-center justify-around sm:justify-center'>

                        <MenuItem href='/wgfmu'>
                            <MdMicrowave size={isMobile() ? 20 : 25} />
                        </MenuItem>
                        <MenuItem href='/wgfmu2'>
                            <RiToolsLine size={isMobile() ? 20 : 25} />
                        </MenuItem>
                    </div>

                </div>
            </div>
        </>
    )
}

// export default function Sidebar() {
//     return (
//         <>Hola</>
//     )
// }