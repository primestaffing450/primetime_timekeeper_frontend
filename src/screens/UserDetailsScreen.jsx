import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { deleteUploadedTimesheet } from '../api';

const UserDetailScreen = ({ setIsLoggedIn }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [weeks, setWeeks] = useState([]);
    const [deletingWeekId, setDeletingWeekId] = useState(null);

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

    const handleDeleteWeek = (weekId) => {
        toast.info(
            <div>
                <p>Are you sure you want to delete this weekly timesheet? This action cannot be undone.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss();
                            setDeletingWeekId(weekId);
                            try {
                                const token = localStorage.getItem('userToken');
                                if (!token) {
                                    toast.error('Please login to access this page', {
                                        position: "top-center",
                                        autoClose: 3000,
                                    });
                                    setDeletingWeekId(null);
                                    return;
                                }
                                const response = await deleteUploadedTimesheet(weekId, token);
                                if (response.success) {
                                    toast.success('Weekly timesheet deleted successfully', {
                                        position: "top-center",
                                        autoClose: 3000,
                                    });
                                    setWeeks((prev) => prev.filter(week => week.week_id !== weekId));
                                } else {
                                    if (response.status === 401) {
                                        localStorage.clear();
                                        setIsLoggedIn(false);
                                        toast.error('Session expired. Please login again', {
                                            position: "top-center",
                                            autoClose: 3000,
                                        });
                                    } else {
                                        toast.error(response.message || 'Failed to delete weekly timesheet', {
                                            position: "top-center",
                                            autoClose: 3000,
                                        });
                                    }
                                }
                            } catch (error) {
                                toast.error('Failed to delete weekly timesheet. Please try again.', {
                                    position: "top-center",
                                    autoClose: 3000,
                                });
                            } finally {
                                setDeletingWeekId(null);
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeButton: false,
            }
        );
    };

    const renderWeekCard = (week) => (
        <div
            key={week.week_id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full mx-auto"
        >
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {new Date(week.week_start).toISOString().slice(0, 10)} -
                            {new Date(week.week_end).toISOString().slice(0, 10)}
                        </h3>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate(`/weekly-summaries/${week.week_id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                            View Details
                        </button>
                        <button
                            onClick={() => handleDeleteWeek(week.week_id)}
                            disabled={deletingWeekId === week.week_id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center"
                        >
                            {deletingWeekId === week.week_id ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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