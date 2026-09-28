import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If user is already logged in, redirect to worker page
  if (token) {
    return <Navigate to='/home' replace />;
  }

  // Otherwise, render the public component
  return children;
};

export default PublicRoute;
