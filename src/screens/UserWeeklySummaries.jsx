import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { UpdateTimesheet } from '../api';
const apiUrl = import.meta.env.VITE_REACT_API_URL;

const UserWeeklySummaries = ({ setIsLoggedIn }) => {
    const { weekId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingDay, setEditingDay] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Generate time slots (10-minute intervals for 24 hours)
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

    const convertTo12Hour = (time24) => {
        if (!time24 || typeof time24 !== 'string') return '';
        if (time24.includes('AM') || time24.includes('PM')) {
            return time24;
        }
        
        const [hours, minutes] = time24.split(':');
        if (!hours || !minutes) return '';
        
        const hour = parseInt(hours);
        if (isNaN(hour)) return '';
        
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };
    
    const convertTo24Hour = (time12) => {
        if (!time12 || typeof time12 !== 'string') return '';
        
        // If already in 24-hour format, return as is
        if (!time12.includes('AM') && !time12.includes('PM')) {
            return time12;
        }
        
        const parts = time12.trim().split(' ');
        if (parts.length !== 2) return '';
        
        const [time, modifier] = parts;
        const timeParts = time.split(':');
        if (timeParts.length !== 2) return '';
        
        let [hours, minutes] = timeParts;
        hours = parseInt(hours);
        
        if (isNaN(hours) || hours < 1 || hours > 12) return '';
        
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const downloadImage = (imageIndex = selectedImageIndex) => {
        try {
            const images = Array.isArray(data?.image) ? data.image : [data?.image].filter(Boolean);
            if (images.length === 0) {
                toast.error('No images available to download.', {
                    position: "top-center",
                    autoClose: 3000,
                });
                return;
            }
            
            const imageToDownload = images[imageIndex] || images[0];
            const imageUrl = `${apiUrl}/${imageToDownload}`;
            const weekStart = new Date(data?.week_data?.week_start).toISOString().slice(0, 10);
            const weekEnd = new Date(data?.week_data?.week_end).toISOString().slice(0, 10);
            const filename = `timesheet_${weekStart}_to_${weekEnd}${images.length > 1 ? `_${imageIndex + 1}` : ''}.png`;
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = filename;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed. Please try again.', {
                position: "top-center",
                autoClose: 3000,
            });
        }
    };

    const handleEdit = (dayIndex) => {
        const day = data.week_data.days[dayIndex];
        setEditingDay(dayIndex);
        
        // Use the same approach as EmployeeDashboard - store values in 12-hour format directly
        console.log('Editing day:', dayIndex);
        console.log('Original time_in:', day.time_in);
        console.log('Original time_out:', day.time_out);
        
        setEditedValues({
            time_in: day.time_in || '',
            time_out: day.time_out || '',
            lunch_timeout: day.lunch_timeout || '',
            total_hours: day.total_hours || ''
        });
    };

    const handleSave = async (dayIndex) => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                toast.error('Please login to save changes', {
                    position: "top-center",
                    autoClose: 3000,
                });
                return;
            }

            const currentDay = data.week_data.days[dayIndex];
            const formattedDate = new Date(currentDay.date).toISOString().slice(0, 10);

            const payload = {
                date: formattedDate,
                time_in: editedValues.time_in,
                time_out: editedValues.time_out,
                lunch_timeout: parseInt(editedValues.lunch_timeout) ,
                total_hours:parseFloat(editedValues.total_hours)
            };

            console.log('Update Timesheet Payload:', payload);

            const response = await UpdateTimesheet(weekId, payload, token);
            if (response.success) {
                const updatedData = { ...data };
                updatedData.week_data.days[dayIndex] = {
                    ...updatedData.week_data.days[dayIndex],
                    time_in: editedValues.time_in,
                    time_out: editedValues.time_out,
                    lunch_timeout: editedValues.lunch_timeout,
                    total_hours: editedValues.total_hours
                };
                setData(updatedData);
                setEditingDay(null);
                toast.success('Timesheet updated successfully', {
                    position: "top-center",
                    autoClose: 3000,
                });
            } else {
                if (response.status === 401) {
                    localStorage.clear();
                    setIsLoggedIn(false);
                    toast.error('Session expired. Please login again', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                } else {
                    toast.error('Failed to update timesheet', {
                        position: "top-center",
                        autoClose: 3000,
                    });
                }
            }
        } catch (error) {
            toast.error('An error occurred while saving changes', {
                position: "top-center",
                autoClose: 3000,
            });
        }
    };

    const handleCancel = () => {
        setEditingDay(null);
        setEditedValues({});
    };

    const handleInputChange = (field, value) => {
        console.log(`Input changed - ${field}:`, value);
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Debug: Log editedValues changes
    useEffect(() => {
        if (editingDay !== null && editedValues) {
            console.log('Current editedValues:', editedValues);
            console.log('Time In:', editedValues.time_in);
            console.log('Time Out:', editedValues.time_out);
        }
    }, [editedValues, editingDay]);

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
                console.log(response);
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
                    {/* Images Section - Single image display with numbered tabs */}
                    <div className="w-full bg-gray-100 overflow-hidden">
                        {(() => {
                            const images = Array.isArray(data?.image) ? data.image : [data?.image].filter(Boolean);
                            
                            if (images.length === 0) {
                                return (
                                    <div className="flex items-center justify-center h-64 text-gray-500">
                                        <p>No timesheet images available</p>
                                    </div>
                                );
                            }
                            
                            const currentImage = images[selectedImageIndex] || images[0];
                            
                            return (
                                <div className="p-4">
                                    {/* Single Image Display */}
                                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
                                        <img
                                            src={`${apiUrl}/${currentImage}`}
                                            alt={`Weekly timesheet ${selectedImageIndex + 1}`}
                                            className="w-full max-h-96 mx-auto block cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => downloadImage()}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="hidden items-center justify-center h-64 text-gray-500 bg-gray-100">
                                            <p>Image {selectedImageIndex + 1} not available</p>
                                        </div>
                                    </div>
                                    
                                    {/* Image Navigation Buttons */}
                                    {images.length > 1 && (
                                        <div className="flex justify-center items-center space-x-2 mb-4">
                                            {images.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                                        selectedImageIndex === index
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                             <button
                                            onClick={() => downloadImage()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                        >
                                            Download Image {selectedImageIndex + 1}
                                        </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Week Info Section */}
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {new Date(data?.week_data?.week_start).toISOString().slice(0, 10)} - {new Date(data?.week_data?.week_end).toISOString().slice(0, 10)}
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
                                    <div className={`px-4 py-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <h3 className="font-medium text-gray-800">
                                            {new Date(day.date).toISOString().slice(0, 10)}
                                        </h3>
                                        {editingDay === index ? (
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => handleSave(index)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(index)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-500">Time In</span>
                                                {editingDay === index ? (
                                                    <select
                                                        value={editedValues.time_in || ''}
                                                        onChange={(e) => {
                                                            console.log('Time in changed:', e.target.value);
                                                            handleInputChange('time_in', e.target.value);
                                                        }}
                                                        className="text-sm font-medium border rounded px-2 py-1 w-40"
                                                    >
                                                        <option value="">Select Time In</option>
                                                        {TIME_SLOTS.map((time, idx) => (
                                                            <option key={idx} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-medium">{day.time_in || 'N/A'}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-500">Time Out</span>
                                                {editingDay === index ? (
                                                    <select
                                                        value={editedValues.time_out || ''}
                                                        onChange={(e) => {
                                                            console.log('Time out changed:', e.target.value);
                                                            handleInputChange('time_out', e.target.value);
                                                        }}
                                                        className="text-sm font-medium border rounded px-2 py-1 w-40"
                                                    >
                                                        <option value="">Select Time Out</option>
                                                        {TIME_SLOTS.map((time, idx) => (
                                                            <option key={idx} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-medium">{day.time_out || 'N/A'}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-500">Lunch Break</span>
                                                {editingDay === index ? (
                                                    <select
                                                        value={editedValues.lunch_timeout}
                                                        onChange={(e) => handleInputChange('lunch_timeout', e.target.value)}
                                                        className="text-sm font-medium border rounded px-2 py-1 w-40"
                                                    >
                                                        <option value="">Select Duration</option>
                                                        <option value="0">0 min</option>
                                                        <option value="15">15 min</option>
                                                        <option value="30">30 min</option>
                                                        <option value="45">45 min</option>
                                                        <option value="60">60 min</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-medium">
                                                        {day.lunch_timeout ? `${day.lunch_timeout} mins` : 'N/A'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Column 2 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Total Hours</span>
                                                {editingDay === index ? (
                                                    <input
                                                        type="number"
                                                        value={editedValues.total_hours}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '') {
                                                                handleInputChange('total_hours', '');
                                                                return;
                                                            }
                                                            const numValue = parseFloat(value);
                                                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
                                                                const roundedValue = Math.round(numValue * 100) / 100;
                                                                handleInputChange('total_hours', roundedValue.toString());
                                                            }
                                                        }}
                                                        className="text-sm font-medium border rounded px-2 py-1 w-20"
                                                        placeholder="8.50"
                                                        min="0"
                                                        max="24"
                                                        step="0.01"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium">{day.total_hours || 'N/A'}</span>
                                                )}
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