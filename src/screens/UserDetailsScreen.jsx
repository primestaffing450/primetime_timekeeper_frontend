import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

const UserDetailScreen = ({ setIsLoggedIn }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [weeks, setWeeks] = useState([]);

    useEffect(() => {
        fetchUserDetails();
    }, [selectedMonth, selectedYear]);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                toast.error('Please login to access this page', {
                    position: "top-center",
                    autoClose: 3000,
                });
                return;
            }

            const response = await api.getUserById(userId, token, selectedMonth, selectedYear);
            if (response.success) {
                setUser(response.data?.user_info);
                setWeeks(response?.data?.weekly_summaries || []);
            } else {
                if (response.status === 401) {
                    localStorage.clear();
                    setIsLoggedIn(false);
                    toast.error('Session expired. Please login again', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                } else {
                    toast.error(response.message || 'Failed to fetch user data', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                }
            }
        } catch (e) {
            toast.error('Failed to fetch user data. Please try again.', {
                position: "top-center",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const renderWeekCard = (week) => (
        <div key={week.week_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                            {new Date(week.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h3>
                    </div>
                    <button
                        onClick={() => navigate(`/weekly-summaries/${week.week_id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                        View Details
                    </button>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                    <span>Week ID: {week.week_id}</span>
                    <span>Total Hours: {week.total_hours || 'N/A'}</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="text-sm text-gray-500">
                        User ID: {userId}
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Reports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month}>
                                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* User Profile Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{user?.full_name}</h1>
                                <div className="flex items-center space-x-4 mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {user?.role}
                                    </span>
                                    <span className="text-sm text-gray-500">{user?.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Summaries Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Weekly Reports</h2>
                        <span className="text-sm text-gray-500">
                            Showing {weeks.length} {weeks.length === 1 ? 'report' : 'reports'}
                        </span>
                    </div>

                    {weeks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {weeks.map(renderWeekCard)}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">No reports found</h3>
                            <p className="mt-1 text-gray-500">Try selecting a different month or year</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailScreen;