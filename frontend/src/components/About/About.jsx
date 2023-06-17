import React from 'react'
import '../../assets/css/about.css'
import logo from '../../assets/images/logo.jpg';
import schema from '../../assets/images/schema_aboutus.png'
export default function About () {
  return (
    <>
        <main>
            <div className="aboutus-holder"><br />
                <h1>Qui sommes nous :</h1><br />
                <div className='description-holder'>
                    <div className='description'>
                        <h2>
                        Nous sommes 3D SMART FACTORY
                        </h2><br /><br />
                        <p>aidant les jeunes entrepreneurs à concrétiser leurs idées avec un impact positif sur l'économie et la société. Notre mission est de les guider de la recherche à la production, nécessitant une planification minutieuse, une analyse du marché et un soutien. Nous donnons la priorité à la création d'entreprises ayant un impact social positif significatif, pas seulement un gain économique.</p>
                        <img src={schema} alt="schema"/>
                    </div>
                    <div className='logo'>
                        <img src={logo} alt="logo"/>
                    </div>
                </div>
            </div>
        </main>
      </>
  )
}