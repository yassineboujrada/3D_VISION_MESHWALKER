import Navbar from './Navbar/Navbar';
import { Outlet } from "react-router-dom";
import React from 'react';

export default function Root() {
    return (
        <div className='container'>
            <Navbar />
            <Outlet />
        </div>
    );
}