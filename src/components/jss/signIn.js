
import React, { useState } from "react";
import "../css/signin.css";
import axios from "axios"
import API_URL from "./backend_Url";
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const navigate=useNavigate()
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");

    // Login fields
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // Signup fields
    const [signupData, setSignupData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Handle login inputs
    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value,
        });
    };

    // Handle signup inputs
    const handleSignupChange = (e) => {
        setSignupData({
            ...signupData,
            [e.target.name]: e.target.value,
        });

        setError("");
    };

    // LOGIN FUNCTION
    const login = async (e) => {
        e.preventDefault();

        setError("");

        console.log("LOGIN DATA:");
        console.log(JSON.stringify(loginData, null, 2));
           try {
            await axios.post(
                `${API_URL}/LogIn`,
                loginData,
                {
                    withCredentials: true
                }
            );

            navigate("/Home")

        } catch (error) {
            console.log("STATUS:", error.response?.status);
           
            const errmsg=error.response.data.errors[0].msg

            setError(errmsg)
         

        }
    };

    // SIGNUP FUNCTION
    const signup = async (e) => {
        e.preventDefault();

        if (signupData.password !== signupData.confirmPassword) {
            setError("Password and confirm password do not match!");
            return;
        }

        setError("");

        const dataToSend = {
            first_name: signupData.first_name,
            last_name: signupData.last_name,
            email: signupData.email,
            password: signupData.password,
        };
       
        try {
            await axios.post(
                `${API_URL}/SignUp`,
                dataToSend,
                {
                    withCredentials: true
                }
            );

            navigate("/Home")

        } catch (error) {
            console.log("STATUS:", error.response?.status);
           
            const errmsg=error.response.data.errors[0].msg
            setError(errmsg)
         

        }

    };

    // Switch between Login and Signup
    const switchMode = (signupMode) => {
        setIsSignup(signupMode);
        setError("");
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                {/* Blue Slider */}
                <div
                    className={`auth-slider ${isSignup ? "signup-active" : ""}`}
                >
                    <div className="slider-content">
                        <h2>{isSignup ? "Welcome Back!" : "Hello!"}</h2>

                        <p>
                            {isSignup
                                ? "Already have an account?"
                                : "Don't have an account?"}
                        </p>

                        <button
                            type="button"
                            onClick={() => switchMode(!isSignup)}
                        >
                            {isSignup ? "LOGIN" : "SIGN UP"}
                        </button>
                    </div>
                </div>

                {/* Forms Container */}
                <div className="forms-container">

                    {/* LOGIN FORM */}
                    <div
                        className={`form login-form ${isSignup ? "form-hidden" : ""
                            }`}
                    >
                         {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}
                        <h1>Login</h1>
                        <p className="form-subtitle">
                            Login to your account
                        </p>

                        <form onSubmit={login}>

                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required
                            />

                            <button type="submit" className="submit-btn">
                                LOGIN
                            </button>
                           

                        </form>

                        <p className="mobile-switch">
                            Don't have an account?
                            <span onClick={() => switchMode(true)}>
                                Sign Up
                            </span>
                        </p>
                    </div>



                    {/* SIGNUP FORM */}
                    <div
                        className={`form signup-form ${!isSignup ? "form-hidden" : ""
                            }`}
                    >
                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}
                        <h1>Sign Up</h1>
                        <p className="form-subtitle">
                            Create your account
                        </p>

                        <form onSubmit={signup}>

                            <div className="name-fields">

                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={signupData.first_name}
                                    onChange={handleSignupChange}
                                    required
                                />

                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={signupData.last_name}
                                    onChange={handleSignupChange}
                                    required
                                />

                            </div>

                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={signupData.email}
                                onChange={handleSignupChange}
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={signupData.password}
                                onChange={handleSignupChange}
                                required
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={signupData.confirmPassword}
                                onChange={handleSignupChange}
                                required
                            />



                            <button type="submit" className="submit-btn">
                                SIGN UP
                            </button>

                        </form>

                        <p className="mobile-switch">
                            Already have an account?
                            <span onClick={() => switchMode(false)}>
                                Login
                            </span>
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Auth;

