import { useState, useEffect, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import OrderDetail from "./pages/OrderDetail";

import ProductDetail from "./pages/ProductDetail";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/AboutPage.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import Record from "./pages/Record.jsx";
import Cart from "./pages/Cart.jsx";
// import PublicRoute from "./pages/PublicRoute.jsx";
import NotFound from "./pages/notfound.jsx";

// import Worker from "./components/WorkerPage.jsx";
// import ProtectedRoute from "./components/ProtectRoute.jsx";
// import OTPVerification from "./components/OTPVerification.jsx";
import "./App.css";
import Contact from "./pages/ContactPage.jsx";
import Product from "./pages/ProductPage.jsx";
import Payment from "./pages/payment.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CustomerPage from "./pages/AdminCustomerPage.jsx";
import AdminCompanyInfo from "./pages/AdminCompanyInfo";
import "./Css/Theme.css";
import "./Css/PremiumTheme.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    // const token = localStorage.getItem("token");
    setIsAuthenticating(false);
  }, []);

  if (isAuthenticating) {
    return <div>Loading...</div>; // Or a Loading component
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes - Redirect to /worker if already logged in */}
        <Route
          path='/login'
          element={
            // <PublicRoute>
            <Login />
            // </PublicRoute>
          }
        />
        <Route
          path='/register'
          element={
            // <PublicRoute>
            <Register />
            // </PublicRoute>
          }
        />
        <Route path="/order/:id" element={<OrderDetail />} />
        <Route path="/admin/company-info" element={<AdminCompanyInfo />} />


        <Route
          path='/notfound'
          element={
            // <PublicRoute>
            <NotFound />
            // </PublicRoute>
          }
        />
        <Route
          path='/home'
          element={
            // <PublicRoute>
            <Home />
            // </PublicRoute>
          }
        />
        <Route
          path='/about'
          element={
            // <PublicRoute>
            <About />
            // </PublicRoute>
          }
        />

        <Route
          path='/contact'
          element={
            // <PublicRoute>
            <Contact />
            // </PublicRoute>
          }
        />

        <Route
          path='/product'
          element={
            // <PublicRoute>
            <Product />
            // </PublicRoute>
          }
        />
        <Route path='/product/:id' element={<ProductDetail />} />
        <Route
          path='/addproduct'
          element={
            // <PublicRoute>
            <AddProduct />
            // </PublicRoute>
          }
        />

        <Route
          path='/record'
          element={
            // <PublicRoute>
            <Record />
            // </PublicRoute>
          }
        />

        <Route
          path='/payment'
          element={
            // <PublicRoute>
            <Payment />
            // </PublicRoute>
          }
        />
        <Route
          path='/track'
          element={
            // <PublicRoute>
            <TrackOrder />
            // </PublicRoute>
          }
        />
        <Route path='/track/:id' element={<TrackOrder />} />


  <Route
          path='/customer'
          element={
            // <PublicRoute>
            <CustomerPage />
            // </PublicRoute>
          }
        />
        <Route
          path='/order'
          element={
            // <PublicRoute>
            <AdminOrders />
            // </PublicRoute>
          }
        />
          <Route
          path='/dashboard'
          element={
            // <PublicRoute>
            <AdminDashboard/>
            // </PublicRoute>
          }
        />



        <Route
          path='/cart'
          element={
            // <PublicRoute>
            <Cart/>
            // </PublicRoute>
          }
        />

        {/* Fallback Redirects */}
        <Route path='/' element={<Navigate to='/home' replace />} />
        <Route path='*' element={<Navigate to='/notfound' replace />} />
      </Routes>
    </Router>
  );
}

export default App;
