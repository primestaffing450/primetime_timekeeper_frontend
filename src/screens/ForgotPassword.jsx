import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import logo from "../assets/Logo.png";

const ForgotPassword = ({ setIsLoggedIn, setRole }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateInputs = () => {
        if (!email) {
            toast.error('Email are required!', {
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
            const response = await api.forgotPassword(formattedEmail);
            if (response.success) {
                toast.success('reset password link sent your email successfully!', {
                    position: "top-center",
                    autoClose: 2000,
                });
                setEmail('');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                toast.error(response.message || 'Reset Password failed', {
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
                                Sending...
                            </span>
                        ) : 'Send password reset email'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;