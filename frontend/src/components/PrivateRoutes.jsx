import { Navigate, Outlet } from "react-router-dom";
import React from 'react';

const PrivateRoutes = () => {
  const auth = JSON.parse(localStorage.getItem("Auth"));
  return auth ? <Outlet context={auth} /> : <Navigate to="/login" />;
};

export default PrivateRoutes;