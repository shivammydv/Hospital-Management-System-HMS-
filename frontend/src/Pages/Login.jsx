import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, Navigate } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patient");

  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      toast.error("Please fill all required fields!");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email!");
      return;
    }

    try {
      await axios
        .post(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/v1/user/login`,
          { email, password, confirmPassword: password, role },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .then((res) => {
          toast.success(res.data.message);
          setIsAuthenticated(true);
          setUser(res.data.user);
          navigateTo("/");
          setEmail("");
          setPassword("");
          setRole("Patient");
        })
        .catch((error) => {
          const errorMsg = error.response?.data?.message || "Login failed!";
          toast.error(errorMsg);
        });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Login failed!";
      toast.error(errorMsg);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <div className="container form-component login-form">
        <h2>Login
        </h2>
        <p>Please Login To Continue</p>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Role fixed to Patient (no selection) */}
          <div
            style={{
              gap: "10px",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <p style={{ marginBottom: 0 }}>Not Registered?</p>
            <Link
              to={"/register"}
              style={{ textDecoration: "none", color: "#271776ca" }}
            >
              Register Now
            </Link>
          </div>
          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
      <div className="login-bubble bubble1"></div>
      <div className="login-bubble bubble2"></div>
      <div className="login-bubble bubble3"></div>
      <div className="login-bubble bubble4"></div>
    </>
  );
};

export default Login;
