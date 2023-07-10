import React from 'react';
import Home from './components/Home/Home';
import PrivateRoutes from './components/PrivateRoutes';
import Root from './components/root';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from './components/About/About';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PrivateRoutes />}>
            <Route path="/" element={<Root />}>
                <Route path="home" element={<Home />} />
                <Route path="aboutus" element={<About />} />
            </Route>
        </Route>
        <Route path="*" element={<h1>mmmmm</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
