import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import Logo from "../assets/Logo.png";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

const ResetPassword = () => {
    // const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // For password field
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password field
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    console.log(token)

    const validateInputs = () => {
        if (!password || !confirmPassword) {
            toast.error('All fields are required!', {
                position: "top-center",
                autoClose: 3000,
            });
            return false;
        }

        // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        //     toast.error('Invalid email format!', {
        //         position: "top-center",
        //         autoClose: 3000,
        //     });
        //     return false;
        // }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters!', {
                position: "top-center",
                autoClose: 3000,
            });
            return false;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match!', {
                position: "top-center",
                autoClose: 3000,
            });
            return false;
        }

        return true;
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;
        setLoading(true);
        // const formattedEmail = email.toLowerCase().trim();
        try {
            const response = await api.resetPassword(password, token,confirmPassword);
            if (response.success) {
                toast.success('Reset Password Successful! Please login.', {
                    position: "top-center",
                    autoClose: 2000,
                    onClose: () => navigate('/login')
                });
                // setEmail('');
                setPassword('');
                setConfirmPassword('');
            } else {
                toast.error(response.message || 'Reset Password failed', {
                    position: "top-center",
                    autoClose: 3000,
                });
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.', {
                position: "top-center",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-center">
                    <img src={Logo} alt="Logo" className="h-16 mb-4" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800">Reset Password</h2>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                    {/* <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div> */}

                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                minLength="8"
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

                    <div className="relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            New Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? (
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
                                Resetting password...
                            </span>
                        ) : 'Reset Password'}
                    </button>
                </form>


            </div>
        </div>
    );
};

export default ResetPassword;