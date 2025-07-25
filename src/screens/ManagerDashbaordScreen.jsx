import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import Logo from "../assets/Logo.png";

const ManagerDashboardScreen = ({ setIsLoggedIn }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getTokenAndFetchUsers();
  }, []);

  const getTokenAndFetchUsers = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        fetchUsers(token);
      } else {
        setError("User not authenticated");
        toast.error("Please login to access this page", {
          position: "top-center",
          autoClose: 3000,
        });
        setLoading(false);
      }
    } catch (e) {
      console.log("Error fetching token", e);
      setError("Failed to get access token");
      toast.error("Failed to authenticate", {
        position: "top-center",
        autoClose: 3000,
      });
      setLoading(false);
    }
  };

  const fetchUsers = async (token) => {
    if (!token) return;
    try {
      const response = await api.getUsers(token);
      if (response.success) {
        setUsers(response.data?.users);
      } else {
        if (response.status === 401) {
          localStorage.clear();
          setIsLoggedIn(false);
          toast.error("Session expired. Please login again", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          toast.error(response.message || "Failed to fetch users", {
            position: "top-center",
            autoClose: 3000,
          });
        }
        setError(response.message);
      }
    } catch (error) {
      toast.error("Network error occurred", {
        position: "top-center",
        autoClose: 3000,
      });
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchExportData = async (token) => {
    setLoading(true);
    try {
      const response = await api.exportExcelUsersData(token);
      if (response.success) {
        return response.data?.rows;
      } else {
        if (response.status === 401) {
          localStorage.clear();
          setIsLoggedIn(false);
          toast.error("Session expired. Please login again", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          throw new Error(response.message || "Failed to fetch export data");
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );
  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        toast.error("Please login to export data", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      toast.info(
        <div>
          <p>Are you sure you want to export the data to Excel?</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={async () => {
                toast.dismiss();
                try {
                  const exportData = await fetchExportData(token);
                  if (exportData) {
                    performExport(exportData);
                  }
                } catch (error) {
                  toast.error(error.message || "Failed to export data", {
                    position: "top-center",
                    autoClose: 3000,
                  });
                }
              }}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="px-3 py-1 bg-red-500 text-white rounded"
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
    } catch (error) {
      toast.error("Error preparing export", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const performExport = (exportData) => {
    if (!exportData || exportData.length === 0) {
      toast.warning("No data available to export", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const dataToExport = exportData.map((user) => {
      let localDateString = "N.A";
      let localTimeString = "N.A";

      if (user?.date_submitted) {
        const localDate = new Date(user.date_submitted);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        localDateString = `${year}-${month}-${day}`;
        const hours = String(localDate.getHours()).padStart(2, "0");
        const minutes = String(localDate.getMinutes()).padStart(2, "0");
        const seconds = String(localDate.getSeconds()).padStart(2, "0");
        localTimeString = `${hours}:${minutes}:${seconds}`;
      }

      return {
        "Date Submitted": localDateString,
        "Time Stamp": localTimeString,
        Name: user?.name || "N.A",
        Email: user?.email || "N.A",
        "Date Worked": user?.date_worked || "N.A",
        "Time In": user?.time_in || "N.A",
        "Time Out": user?.time_out || "N.A",
        Lunch: user?.lunch || "N.A",
        "Total Daily Hours": user?.total_daily_hours || "N.A",
        Notes: user?.notes || "N.A",
        "Approve/Reject": user?.approve_reject || "N.A",
        "AI Discrepancy Detected (Y/N)": user?.ai_Discrepancy_detected || "N.A",
        "Image Link": user?.image_path
          ? { t: "s", v: "View Image", l: { Target: user.image_path } }
          : "N.A",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileName = `UsersData_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);

    toast.success("Data exported successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const exportTimesheets = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        toast.error("Please login to export images", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      toast.info(
        <div>
          <p>Are you sure you want to export all timesheet images?</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={async () => {
                toast.dismiss();
                setLoading(true);
                try {
                  const exportData = await fetchExportData(token);
                  if (!exportData || exportData.length === 0) {
                    toast.warning("No data available to export", {
                      position: "top-center",
                      autoClose: 3000,
                    });
                    setLoading(false);
                    return;
                  }
                  // Group by user and week
                  const groupByWeek = {};
                  for (const user of exportData) {
                    if (!user?.image_path || !user?.date_worked) continue;
                    // Get the Monday of the week for date_worked
                    const date = new Date(user.date_worked);
                    const day = date.getDay();
                    const diffToMonday = (day === 0 ? -6 : 1) - day; // Sunday=0, Monday=1
                    const monday = new Date(date);
                    monday.setDate(date.getDate() + diffToMonday);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    const weekKey = `${monday.toISOString().slice(0, 10)}_to_${sunday.toISOString().slice(0, 10)}`;
                    const userKey = user.name + "_" + user.email;
                    if (!groupByWeek[userKey]) groupByWeek[userKey] = {};
                    if (!groupByWeek[userKey][weekKey]) {
                      groupByWeek[userKey][weekKey] = user;
                      groupByWeek[userKey][weekKey].weekRange = weekKey;
                    }
                  }
                  const zip = new JSZip();
                  let count = 0;
                  for (const userKey in groupByWeek) {
                    for (const weekKey in groupByWeek[userKey]) {
                      const user = groupByWeek[userKey][weekKey];
                      try {
                        const response = await fetch(user.image_path);
                        if (!response.ok) continue;
                        const blob = await response.blob();
                        const safe = (val) => (val ? String(val).replace(/[\\/:*?"<>| ]+/g, "_") : "NA");
                        const ext = user.image_path.split('.').pop().split(/\#|\?/)[0];
                        // Use week range in filename
                        const filename = `${safe(user.name)}_${safe(user.weekRange)}.${ext}`;
                        zip.file(filename, blob);
                        count++;
                      } catch (e) {}
                    }
                  }
                  if (count === 0) {
                    toast.warning("No images found to export", {
                      position: "top-center",
                      autoClose: 3000,
                    });
                    setLoading(false);
                    return;
                  }
                  const zipBlob = await zip.generateAsync({ type: "blob" });
                  saveAs(zipBlob, `TimesheetImages_${new Date().toISOString().slice(0, 10)}.zip`);
                  toast.success("Images exported as ZIP!", {
                    position: "top-center",
                    autoClose: 2000,
                  });
                } catch (error) {
                  toast.error(error.message || "Failed to export images", {
                    position: "top-center",
                    autoClose: 3000,
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="px-3 py-1 bg-red-500 text-white rounded"
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
    } catch (error) {
      toast.error("Error preparing export", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    toast.info("Logged out successfully", {
      position: "top-center",
      autoClose: 2000,
    });
    setTimeout(() => navigate("/login"), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-blue-600">Loading users data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={Logo} alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold text-gray-900">
              Manager Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Search and Export Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
          onClick={exportTimesheets}
          disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            {loading ? "Exporting..." : "Export Timesheets"}
            </button>
          <button
            onClick={exportToExcel}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {loading ? "Exporting..." : "Export to Excel"}
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {filteredUsers?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Full Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => navigate(`/user/${user._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No users found
              </h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboardScreen;
