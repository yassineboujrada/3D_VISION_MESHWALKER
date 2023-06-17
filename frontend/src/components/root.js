import Navbar from './Navbar/Navbar';
import { Outlet,useNavigate } from "react-router-dom";
import React, { useEffect } from 'react';

export default function Root() {
    const redirect = useNavigate();
    useEffect(() => {
        if(window.location.href === "http://localhost:3000/") {
            redirect("/home");
        }
    }, [])

    return (
        <div className='container'>
            <Navbar />
            <Outlet />
        </div>
    );
}