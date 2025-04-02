import React from 'react';

const DraftDataDisplay = ({ draftData, loading, onRefresh }) => {
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DraftDataDisplay;