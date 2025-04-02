import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
const apiUrl = import.meta.env.VITE_REACT_API_URL;

const UserWeeklySummaries = ({ setIsLoggedIn }) => {
    const { weekId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeeklyTimesheet = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    toast.error('Please login to access this page', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                    return;
                }

                const response = await api.getWeeklyTimesheet(weekId, token);
                if (response.success) {
                    setData(response.data);
                } else {
                    if (response.status === 401) {
                        localStorage.clear();
                        setIsLoggedIn(false);
                        toast.error('Session expired. Please login again', {
                            position: "top-center",
                            autoClose: 3000,
                        });
                    } else {
                        setError(response.message || 'Failed to fetch data');
                    }
                }
            } catch (err) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchWeeklyTimesheet();
    }, [weekId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500 text-lg">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to User Details
                    </button>
                    <div className="text-sm text-gray-500">
                        Week ID: {weekId}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    {/* Image Section - Fixed to show full width */}
                    <div className="w-full bg-gray-100 overflow-hidden">
                        <img
                            src={`${apiUrl}/${data?.image}`}
                            alt="Weekly timesheet"
                            className="w-full max-h-96  mx-auto block"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/800x400?text=Timesheet+Image+Not+Available';
                            }}
                        />
                    </div>

                    {/* Week Info Section */}
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {new Date(data?.week_data?.week_start).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })} - {new Date(data?.week_data?.week_end).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </h1>
                                <p className="text-gray-600">Weekly Timesheet Details</p>
                            </div>
                            {/* <div className={`mt-4 md:mt-0 px-4 py-2 rounded-full text-center ${data?.overall_validation_status
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                <span className="font-semibold">
                                    {data?.overall_validation_status ? 'Approved' : 'Pending Approval'}
                                </span>
                            </div> */}
                        </div>

                        {/* Daily Entries */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                Daily Entries
                            </h2>

                            {data?.week_data?.days.map((day, index) => (
                                <div key={index} className="border rounded-lg overflow-hidden">
                                    <div className={`px-4 py-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}>
                                        <h3 className="font-medium text-gray-800">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                        {/* Column 1 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Time In</span>
                                                <span className="text-sm font-medium">{day.time_in || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Time Out</span>
                                                <span className="text-sm font-medium">{day.time_out || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Lunch Break</span>
                                                <span className="text-sm font-medium">
                                                    {day.lunch_timeout ? `${day.lunch_timeout} mins` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column 2 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Total Hours</span>
                                                <span className="text-sm font-medium">{day.total_hours || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">AI VAlidation Status</span>
                                                <span className={`text-sm font-medium ${day?.ai_validation_info?.status === 'missing from image' ? 'text-red-500' : 'text-green-500'
                                                    }`}>
                                                    {day?.ai_validation_info?.status || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="flex justify-around gap-10">
                                                <span className="text-sm font-medium text-gray-500">Reason</span>
                                                <span className={`text-sm font-medium`}>
                                                    {day?.ai_validation_info?.reason || 'N/A'}
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserWeeklySummaries;