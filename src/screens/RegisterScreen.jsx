import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import Logo from "../assets/Logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterScreen = () => {
  const [FirstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    if (
      !FirstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      toast.error("All fields are required!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    if (FirstName.length < 2 || lastName.length < 2) {
      toast.error("First and last name must be at least 2 characters!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(FirstName) || !nameRegex.test(lastName)) {
      toast.error("First and last name must contain only alphabets!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    if (username.length < 2) {
      toast.error("Username must be at least 2 characters!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    const formattedEmail = email.toLowerCase().trim();
    const formattedUsername = username.toLowerCase().trim();
    try {
      const response = await api.register(
        formattedUsername,
        formattedEmail,
        password,
        FirstName,
        lastName
      );
      if (response.success) {
        toast.success("Registration Successful! Please login.", {
          position: "top-center",
          autoClose: 2000,
          onClose: () => navigate("/login"),
        });
        // setFullName('');
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.message || "Registration failed", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <img src={Logo} alt="Logo" className="h-16 mb-4" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="firstname"
              className="block text-sm font-medium text-gray-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstname"
              type="text"
              value={FirstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="lastname"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastname"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email <span className="text-red-500">*</span>
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

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                minLength="8"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </span>
            ) : (
              "GET STARTED"
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
