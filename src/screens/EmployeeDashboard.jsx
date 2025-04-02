import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import api, { saveDraftTimesheet, uploadTimesheet } from '../api';
import Logo from "../assets/Logo.png";
import DraftDataDisplay from '../components/DraftDataDisplay';

const EmployeeDashboard = ({ setIsLoggedIn }) => {
    const [days, setDays] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showPickers, setShowPickers] = useState({
        date: false,
        timeIn: false,
        timeOut: false,
        lunch: false
    });
    const [loading, setLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [accessToken, setAccessToken] = useState('');
    const [file, setFile] = useState(null);
    const [uploadedDates, setUploadedDates] = useState([]);
    const [draftData, setDraftData] = useState([]);
    const navigate = useNavigate();

    // Generate time slots (30-minute intervals from 8 AM to 8 PM)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
                slots.push(timeString);
            }
        }
        return slots;
    };
    const TIME_SLOTS = generateTimeSlots();

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        fetchUploadedDates();
        fetchDraftData();
        setAccessToken(token);
    }, []);

    useEffect(() => {
        if (currentDate && isDateDisabled(currentDate)) {
            findAvailableDate();
        }
    }, [uploadedDates]);


    const fetchDraftData = async () => {
        setDraftLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const response = await api.getAllDraftData(token);
            if (response.success) {
                setDraftData(response.data || []);
            } else {
                if (response.status === 401) {
                    handleSessionExpired();
                } else {
                    toast.error(response.message || 'Failed to fetch draft data');
                }
            }
        } catch (error) {
            console.error('Error fetching draft data:', error);
            toast.error('Error fetching draft data');
        } finally {
            setDraftLoading(false);
        }
    };



    const fetchUploadedDates = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await api.getUploadedDates(token)
            if (response.success) {
                setUploadedDates(response?.data || []);
            } else {
                if (response.status === 401) {
                    handleSessionExpired();
                } else {
                    toast.error(response.message || 'Failed to fetch uploaded dates', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching uploaded dates:', error);
        } finally {
            setLoading(false);
        }
    };

    const isDateDisabled = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        // Disable future dates and already uploaded dates
        return dateString > today || uploadedDates.includes(dateString);
    };

    const findAvailableDate = () => {
        // Find the nearest available date
        const today = new Date().toISOString().split('T')[0];
        if (!isDateDisabled(today)) {
            setCurrentDate(today);
            return;
        }

        // Find the first available date before today
        let date = new Date(today);
        let found = false;
        for (let i = 0; i < 30; i++) { // Check up to 30 days back
            date.setDate(date.getDate() - 1);
            const dateStr = date.toISOString().split('T')[0];
            if (!isDateDisabled(dateStr)) {
                setCurrentDate(dateStr);
                found = true;
                break;
            }
        }
        if (!found) {
            toast.error("No available dates to select");
        }
    };

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        if (isDateDisabled(selectedDate)) {
            toast.error("This date has already been submitted..");
            return;
        }
        setCurrentDate(selectedDate);
    };

    const handleDataChange = (field, value) => {
        setDays(prev => ({
            ...prev,
            [currentDate]: {
                ...prev[currentDate],
                [field]: value,
            },
        }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.log(selectedFile, '---===');
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
                setFile(selectedFile);
                toast.success('File selected successfully');
            } else {
                toast.error('Please select a PDF or image file');
            }
        }
    };

    const saveAsDraft = async () => {
        if (!currentDate ||
            !days[currentDate]?.timeIn || !days[currentDate]?.timeOut || !days[currentDate]?.hours) {
            toast.error('All fields are required for the current date!', { position: "top-center" });
            return;
        }

        setDraftLoading(true);
        try {
            const formData = new FormData();
            formData.append(`[${currentDate}][time_in]`, days[currentDate].timeIn);
            formData.append(`[${currentDate}][time_out]`, days[currentDate].timeOut);
            formData.append(`[${currentDate}][lunch_timeout]`, days[currentDate].lunch || 0);
            formData.append(`[${currentDate}][total_hours]`,
                formatHoursMinutes(days[currentDate]?.hours, days[currentDate]?.minutes));
            formData.append('date', currentDate);
            if (file) {
                formData.append('image_file', file);
            }

            const response = await saveDraftTimesheet(formData, accessToken);

            if (response.success) {
                toast.success(`Draft saved for ${currentDate}`, { position: "top-center" });
                setFile(null);
                setDays({});
                fetchUploadedDates();
                fetchDraftData();

                // Advance date if not today
                const today = new Date().toISOString().split('T')[0];
                if (currentDate !== today) {
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    setCurrentDate(nextDate.toISOString().split('T')[0]);
                }
            } else {
                if (response.status === 401) {
                    handleSessionExpired();
                } else {
                    toast.error(response.message || 'Failed to save draft', { position: "top-center" });
                }
            }
        } catch (error) {
            toast.error('Error saving draft', { position: "top-center" });
        } finally {
            setDraftLoading(false);
        }
    };

    const formatHoursMinutes = (hours, minutes) => {
        return `${hours || 0}:${(minutes || 0).toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!days[currentDate]?.timeIn && !days[currentDate]?.timeOut && !days[currentDate]?.hours && !file) {
            toast.error('At least one field is required', { position: "top-center" });
            return;
        }
        if (!currentDate) {
            toast.error('Date is required', { position: "top-center" })
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(days).forEach(([date, data]) => {
                formData.append(`[${date}][time_in]`, data.timeIn);
                formData.append(`[${date}][time_out]`, data.timeOut);
                formData.append(`[${date}][lunch_timeout]`, data.lunch || 0);
                formData.append(`[${date}][total_hours]`,
                    formatHoursMinutes(data?.hours, data?.minutes));
            });
            formData.append('date', currentDate);

            if (file) {
                formData.append('image_file', file);
            }

            const response = await uploadTimesheet(formData, accessToken);
            if (response.success) {
                toast.success('Timesheet submitted successfully!', { position: "top-center" });
                setDays({});
                setFile(null);
                // Refresh uploaded dates after submission
                fetchUploadedDates();
                fetchDraftData();
            } else {
                if (response.status === 401) {
                    handleSessionExpired();
                } else {
                    toast.error(response.message || 'Submission failed', { position: "top-center" });
                }
            }
        } catch (error) {
            toast.error('Error submitting timesheet', { position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    const handleSessionExpired = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        toast.error('Session expired. Please login again', {
            position: "top-center",
            autoClose: 3000,
        });
        navigate('/login');
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        toast.info('Logged out successfully', {
            position: "top-center",
            autoClose: 2000,
        });
        setTimeout(() => navigate('/login'), 2000);
    };

    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekendSubmission = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <img src={Logo} alt="Logo" className="h-10" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Employee Timesheet Entry</h1>

                        {/* Date Picker */}
                        <div className="mb-6 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input
                                type="date"
                                value={currentDate}
                                onChange={handleDateChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Time In Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time In</label>
                                <select
                                    value={days[currentDate]?.timeIn || ''}
                                    onChange={(e) => handleDataChange('timeIn', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Time In</option>
                                    {TIME_SLOTS.map((time, index) => (
                                        <option key={index} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Time Out Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time Out</label>
                                <select
                                    value={days[currentDate]?.timeOut || ''}
                                    onChange={(e) => handleDataChange('timeOut', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Time Out</option>
                                    {TIME_SLOTS.map((time, index) => (
                                        <option key={index} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Lunch Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Break</label>
                                <select
                                    value={days[currentDate]?.lunch || ''}
                                    onChange={(e) => handleDataChange('lunch', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Duration</option>
                                    <option value="0">0 min</option>
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                </select>
                            </div>

                            {/* Total Hours - Modified with proper hours and minutes inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Hours</label>
                                    <input
                                        type="number"
                                        value={days[currentDate]?.hours || ''}
                                        onChange={(e) => {
                                            // Only allow whole numbers between 0-24
                                            const value = Math.min(24, Math.max(0, parseInt(e.target.value) || 0));
                                            handleDataChange('hours', value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Hours"
                                        min="0"
                                        max="24"
                                        step="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minutes</label>
                                    <select
                                        value={days[currentDate]?.minutes || '0'}
                                        onChange={(e) => handleDataChange('minutes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(min => (
                                            <option key={min} value={min}>{min.toString().padStart(2, '0')} min</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Timesheet (PDF or Image)</label>
                            <div className="mt-1 flex items-center">
                                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                                    Choose File
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="sr-only"
                                    />
                                </label>
                                <span className="ml-4 text-sm text-gray-600 truncate max-w-xs">
                                    {file ? file.name : 'No file selected'}
                                </span>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="ml-2 text-sm text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            {file && (
                                <div className="mt-3">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="h-40 object-contain border rounded"
                                        />
                                    ) : (
                                        <div className="flex items-center p-3 bg-gray-50 rounded border">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="ml-2 text-sm text-gray-600">{file.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={saveAsDraft}
                                disabled={draftLoading}
                                className="flex-1 px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
                            >

                                Save as Draft
                            </button>

                            {/* {isWeekendSubmission && ( */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : 'Submit Timesheet'}
                            </button>
                            {/* )} */}
                        </div>
                    </div>
                </div>
                <DraftDataDisplay
                    draftData={draftData}
                    loading={draftLoading}
                    onRefresh={fetchDraftData}
                />
            </main>
        </div>
    );
};

export default EmployeeDashboard;