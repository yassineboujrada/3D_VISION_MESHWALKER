import React from 'react'
import '../../assets/css/navbar.css';
import logo from '../../assets/images/logo.jpg'
import { NavLink } from 'react-router-dom'

export default function Navbar () {
  return (
    <aside>
        <br /><br />
            <div className='top'>
                <div className="logo">
                    <img src={logo} alt="logo"/>
                    <h2 style={{"color":"var(--color-info-light)"}}>3D<span style={{"color":"#ff9800"}}> VISION</span></h2>
                </div>
                <div className="close" id="close-btn">
                    <span className="material-symbols-outlined">
                    </span>
                </div>
            </div>

            <div className="sidebar">
                <NavLink to="/home">
                    <span className="material-icons-sharp">grid_view</span>
                    <h3>Home</h3>
                </NavLink>

                <NavLink to="/aboutus">
                    <span className="material-icons-sharp">person_outline</span>
                    <h3>Qui sommes nous ?</h3>
                </NavLink>

                <NavLink to="/contact">
                    <span className="material-icons-sharp">receipt_long</span>
                    <h3>Contact</h3>
                </NavLink>

                {/* <NavLink to="/products">
                    <span className="material-icons-sharp">inventory</span>
                    <h3>Products</h3>
                </NavLink> */}

                <NavLink to="/setting">
                    <span className="material-icons-sharp">settings</span>
                    <h3>Settings</h3>
                </NavLink>

                <NavLink to="/logout" >
                    <span className="material-icons-sharp">logout</span>
                    <h3>Logout</h3>
                </NavLink>
            </div>

        </aside>
  )
}
