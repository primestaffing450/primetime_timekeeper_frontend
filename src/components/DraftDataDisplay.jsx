import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { deleteDraftByDate } from '../api';

const DraftDataDisplay = ({ draftData, loading, onRefresh, accessToken }) => {
  const [deletingDates, setDeletingDates] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dateToDelete, setDateToDelete] = useState(null);

  const handleDeleteClick = (date) => {
    setDateToDelete(date);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dateToDelete) return;

    setDeletingDates(prev => new Set([...prev, dateToDelete]));
    
    try {
      const response = await deleteDraftByDate(dateToDelete, accessToken);
      
      if (response.success) {
        toast.success(`Draft for ${dateToDelete} deleted successfully`, {
          position: "top-center",
          autoClose: 3000,
        });
        onRefresh(); // Refresh the draft data
      } else {
        toast.error(response.message || 'Failed to delete draft', {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error('Error deleting draft', {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setDeletingDates(prev => {
        const newSet = new Set(prev);
        newSet.delete(dateToDelete);
        return newSet;
      });
      setShowDeleteModal(false);
      setDateToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDateToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!draftData || draftData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No draft data available.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Saved Drafts</h2>
        <button 
          onClick={onRefresh}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Wrapper div for horizontal scrolling on mobile */}
      <div className="overflow-x-auto">
        <div className="bg-white shadow rounded-lg inline-block min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Time In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Time Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Lunch Break</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Total Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {draftData.map((draft, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">{draft.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">{draft.time_in || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">{draft.time_out || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                    {draft.lunch_timeout ? `${draft.lunch_timeout} min` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">{draft.total_hours || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                    <button
                      onClick={() => handleDeleteClick(draft.date)}
                      disabled={deletingDates.has(draft.date)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingDates.has(draft.date) ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-96 shadow-2xl rounded-md bg-white/95 backdrop-blur-md">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Draft</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the draft for <strong>{dateToDelete}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deletingDates.has(dateToDelete)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingDates.has(dateToDelete)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deletingDates.has(dateToDelete) ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : 'Delete Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftDataDisplay;