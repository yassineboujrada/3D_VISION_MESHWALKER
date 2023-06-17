import React from 'react';
import Home from './components/Home/Home';
import PrivateRoutes from './components/PrivateRoutes';
import Root from './components/root';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from './components/About/About';
import ObjViewer from './components/Home/ObjViewer';
import Contact from './components/Contact/Contact';
import Setting from './components/Setting/Setting';
import MainLogin from './components/Login/MainLogin';
import Register from './components/Login/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/login" element={<MainLogin />} />
      <Route path="/SignIn" element={<Register />} />
        <Route element={<PrivateRoutes />}>
            <Route path="/" element={<Root />}>
                <Route path="home" element={<Home />} />
                <Route path="home/fileUploaded" element={<ObjViewer />} />
                <Route path="aboutus" element={<About />} />
                <Route path="contactUs" element={<Contact />} />
                <Route path="setting" element={<Setting />} />
            </Route>
        </Route>
        <Route path="*" element={<h1>mmmmm</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
