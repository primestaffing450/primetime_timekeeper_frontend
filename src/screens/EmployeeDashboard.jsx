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
    const [files, setFiles] = useState([]);
    const [uploadedDates, setUploadedDates] = useState([]);
    const [draftData, setDraftData] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notes, setNotes] = useState('');
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
        const isFuture = dateString > today;
        const isUploaded = uploadedDates.includes(dateString);
        const isDraft = draftData.some(draft => draft.date === dateString);
        const result = isFuture || (isUploaded && !isDraft);
        
        return result;
    };

    const findAvailableDate = () => {
        const today = new Date().toISOString().split('T')[0];
        if (!isDateDisabled(today)) {
            setCurrentDate(today);
            return;
        }

        let date = new Date(today);
        let found = false;
        for (let i = 0; i < 30; i++) { 
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
        const selectedFiles = Array.from(e.target.files);
        console.log(selectedFiles, '---===');
        
        if (selectedFiles.length === 0) return;
        const maxFileSize = 10 * 1024 * 1024;
        const validFiles = [];
        const errors = [];
        
        selectedFiles.forEach(file => {
            if (!(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
                errors.push(`${file.name}: Invalid file type`);
            } else if (file.size > maxFileSize) {
                errors.push(`${file.name}: File too large (max 10MB)`);
            } else {
                validFiles.push(file);
            }
        });
        
        if (errors.length > 0) {
            toast.error(`File validation errors:\n${errors.join('\n')}`);
        }
        
        if (validFiles.length > 0) {
            const totalFiles = files.length + validFiles.length;
            if (totalFiles > 10) {
                toast.error('Maximum 10 files allowed');
                return;
            }
            setFiles(prevFiles => [...prevFiles, ...validFiles]);
            toast.success(`${validFiles.length} file(s) selected successfully`);
        }
        e.target.value = '';
    };

    const removeFile = (indexToRemove) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        toast.info('File removed');
    };

    const clearAllFiles = () => {
        setFiles([]);
        toast.info('All files cleared');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const saveAsDraft = async () => {
        if (!currentDate ||
            !days[currentDate]?.timeIn || !days[currentDate]?.timeOut || !days[currentDate]?.totalHours) {
            toast.error('All fields are required for the current date!', { position: "top-center" });
            return;
        }

        setDraftLoading(true);
        try {
            const formData = new FormData();
            formData.append(`[${currentDate}][time_in]`, days[currentDate].timeIn);
            formData.append(`[${currentDate}][time_out]`, days[currentDate].timeOut);
            formData.append(`[${currentDate}][lunch_timeout]`, days[currentDate].lunch || 0);

            formData.append(`[${currentDate}][night_shift]`, days[currentDate]?.nightShift || false);
            formData.append(`[${currentDate}][total_hours]`, parseFloat(days[currentDate]?.totalHours || 0).toFixed(2));
            formData.append('date', currentDate);
            files.forEach((file, index) => {
                formData.append(`image_files`, file);
            });
            
            formData.append(`[${currentDate}][notes]`, days[currentDate]?.notes || '');

            const response = await saveDraftTimesheet(formData, accessToken);

            if (response.success) {
                toast.success(`Draft saved for ${currentDate}`, { position: "top-center" });
                setFiles([]);
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



    const handleSubmit = async () => {
        if (!days[currentDate]?.timeIn || !days[currentDate]?.timeOut || !days[currentDate]?.totalHours || files.length === 0) {
            toast.error('All fields are required and at least one file must be uploaded', { position: "top-center" });
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
                formData.append(`[${date}][total_hours]`, parseFloat(data?.totalHours || 0).toFixed(2));
                formData.append(`[${date}][notes]`, data.notes || '');
                formData.append(`[${date}][night_shift]`, data.nightShift || false);
            });
            formData.append('date', currentDate);

            files.forEach((file, index) => {
                formData.append(`image_files`, file);
            });

            const response = await uploadTimesheet(formData, accessToken);
            if (response.success) {
                toast.success('Timesheet submitted successfully!', { position: "top-center" });
                setDays({});
                setFiles([]);
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

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            const response = await api.deleteAccount(accessToken);
            if (response.success) {
                localStorage.clear();
                setIsLoggedIn(false);
                toast.success('Account deleted successfully', {
                    position: "top-center",
                    autoClose: 3000,
                });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                if (response.status === 401) {
                    handleSessionExpired();
                } else {
                    toast.error(response.message || 'Failed to delete account', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                }
            }
        } catch (error) {
            toast.error('Error deleting account', {
                position: "top-center",
                autoClose: 3000,
            });
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
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
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-300 hover:border-red-400"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Account
                        </button>
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

                            {/* Total Hours - Decimal format */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Total Hours</label>
                                <input
                                    type="number"
                                    value={days[currentDate]?.totalHours || ''}
                                    onChange={(e) => {
                                        // Allow decimal values between 0-24 with up to 2 decimal places
                                        const value = e.target.value;
                                        if (value === '') {
                                            handleDataChange('totalHours', '');
                                            return;
                                        }
                                        const numValue = parseFloat(value);
                                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
                                            // Round to 2 decimal places
                                            const roundedValue = Math.round(numValue * 100) / 100;
                                            handleDataChange('totalHours', roundedValue.toString());
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="8.50"
                                    min="0"
                                    max="24"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Night Shift Checkbox*/}
                        <div className="mb-6">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox" 
                                    checked={days[currentDate]?.nightShift || false}
                                    onChange={(e) => handleDataChange('nightShift', e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Night Shift</span>
                            </label>    
                        </div> 

                        {/* File Upload */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Timesheet
                            </label>
                            <div className="mt-1 flex items-center">
                                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Choose Files
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="sr-only"
                                        multiple
                                    />
                                </label>
                                <span className="ml-4 text-sm text-gray-600 truncate max-w-xs">
                                    {files.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {files.map((file, index) => (
                                                <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                    {file.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        'No file selected'
                                    )}
                                </span>
                                {files.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearAllFiles}
                                        className="ml-2 text-sm text-red-500 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                                                         {files.length > 0 && (
                                 <div className="mt-3">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                         {files.map((file, index) => (
                                             <div key={index} className="relative bg-gray-50 rounded border p-3">
                                                 <div className="flex items-center justify-between mb-2">
                                                     <div className="flex-1 min-w-0">
                                                         <span className="text-sm text-gray-600 truncate block">{file.name}</span>
                                                         <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                                                     </div>
                                                     <button
                                                         type="button"
                                                         onClick={() => removeFile(index)}
                                                         className="text-red-500 hover:text-red-700 focus:outline-none ml-2"
                                                     >
                                                         <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                         </svg>
                                                     </button>
                                                 </div>
                                                 {file.type.startsWith('image/') ? (
                                                     <img
                                                         src={URL.createObjectURL(file)}
                                                         alt="Preview"
                                                         className="h-32 w-full object-contain border rounded"
                                                     />
                                                 ) : (
                                                     <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                                                         <div className="text-center">
                                                             <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                             </svg>
                                                             <span className="text-xs text-gray-500">PDF</span>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                        <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            value={days[currentDate]?.notes || ''}
                            onChange={(e) => handleDataChange('notes', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add any notes or comments here..."
                        ></textarea>
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
                    accessToken={accessToken}
                />
            </main>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-6 border w-96 shadow-2xl rounded-md bg-white/95 backdrop-blur-md">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Account</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                                </p>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {deleteLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </span>
                                    ) : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;