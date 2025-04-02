import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import logo from "../assets/Logo.png";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

const LoginScreen = ({ setIsLoggedIn, setRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility
    const navigate = useNavigate();

    const validateInputs = () => {
        if (!email || !password) {
            toast.error('All fields are required!', {
                position: "top-center",
                autoClose: 3000,
            });
            return false;
        }
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;
        setLoading(true);

         // Convert email to lowercase before sending
    const formattedEmail = email.toLowerCase().trim();

        try {
            const response = await api.login(formattedEmail, password);
            if (response.success) {
                toast.success('Logged in successfully!', {
                    position: "top-center",
                    autoClose: 2000,
                });
                localStorage.setItem('userToken', response?.data?.access_token);
                localStorage.setItem('role', response?.data?.user_data?.role);
                setRole(response?.data?.user_data?.role);
                setIsLoggedIn(true);
                setEmail('');
                setPassword('');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                toast.error(response.message || 'Login failed', {
                    position: "top-center",
                    autoClose: 3000,
                });
            }
        } catch (error) {
            console.log(error, "--");
            toast.error('Something went wrong. Please try again.', {
                position: "top-center",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        toast.info('Password reset feature coming soon!', {
            position: "top-center",
            autoClose: 3000,
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="h-16 mb-4"
                    />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email or Username
                        </label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <FaEyeSlash className="h-5 w-5" />
                                ) : (
                                    <FaEye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </span>
                        ) : 'Login'}
                    </button>
                </form>

                <div className="flex justify-between text-sm">
                    <button
                        onClick={() => navigate('/register')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Create Account
                    </button>
                    <button
                        onClick={handleForgotPassword}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Forgot Password?
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;