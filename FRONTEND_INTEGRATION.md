// Frontend Integration Examples
// Add these to your React/Vue/JavaScript frontend

/* ===========================
   API SERVICE (api.ts enhanced)
=========================== */

const API_URL = "http://localhost:5000";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Set token in localStorage
const setToken = (token) => localStorage.setItem("token", token);

// Clear token on logout
const clearToken = () => localStorage.removeItem("token");

// Helper function to make authenticated requests
const makeAuthRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  if (!token && endpoint !== "/register" && endpoint !== "/login") {
    throw new Error("Not authenticated. Please login first.");
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    clearToken();
    window.location.href = "/login"; // Redirect to login
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};

/* ===========================
   AUTHENTICATION FUNCTIONS
=========================== */

export const authAPI = {
  // Register new user
  register: async (name, email, password) => {
    const data = await makeAuthRequest("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data.user;
  },

  // Login user
  login: async (email, password) => {
    const data = await makeAuthRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data.user;
  },

  // Logout (just clear token)
  logout: () => {
    clearToken();
  },

  // Check if user is logged in
  isLoggedIn: () => !!getToken(),
};

/* ===========================
   ANALYSIS FUNCTIONS
=========================== */

export const analysisAPI = {
  // Analyze statement (requires auth)
  analyze: async (prompt, fileName = "statement") => {
    return makeAuthRequest("/analyze", {
      method: "POST",
      body: JSON.stringify({ prompt, fileName }),
    });
  },

  // Get all user's statements (requires auth)
  getHistory: async () => {
    return makeAuthRequest("/history", {
      method: "GET",
    });
  },

  // Get single statement (requires auth)
  getStatement: async (statementId) => {
    return makeAuthRequest(`/history/${statementId}`, {
      method: "GET",
    });
  },

  // Chat with AI (requires auth)
  chat: async (message, history = []) => {
    return makeAuthRequest("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });
  },
};

/* ===========================
   REACT HOOKS EXAMPLES
=========================== */

import { useState, useEffect } from "react";

// useAuth hook - manage authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      // You can verify token by calling a protected endpoint
      // or just trust localStorage for now
    }
  }, []);

  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.register(name, email, password);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.login(email, password);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    isLoggedIn: authAPI.isLoggedIn(),
  };
};

// useAnalysis hook - manage analysis state
export const useAnalysis = () => {
  const [statements, setStatements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (prompt, fileName) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.analyze(prompt, fileName);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analysisAPI.getHistory();
      setStatements(data.statements || []);
      return data.statements;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatement = async (statementId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analysisAPI.getStatement(statementId);
      return data.statement;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    statements,
    isLoading,
    error,
    analyze,
    fetchHistory,
    fetchStatement,
  };
};

/* ===========================
   REACT COMPONENT EXAMPLES
=========================== */

// LoginComponent.jsx
export const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

// AnalyzeComponent.jsx - Upload & analyze statement
export const AnalyzeComponent = () => {
  const [prompt, setPrompt] = useState("");
  const [fileName, setFileName] = useState("statement");
  const { analyze, isLoading, error } = useAnalysis();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    try {
      const result = await analyze(prompt, fileName);
      console.log("Analysis result:", result);
      // Show result to user
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  return (
    <form onSubmit={handleAnalyze}>
      <input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="File name"
      />
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your bank statement CSV here..."
        rows={10}
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Analyzing..." : "Analyze"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

// HistoryComponent.jsx - Show user's past analyses
export const HistoryComponent = () => {
  const { statements, isLoading, fetchHistory } = useAnalysis();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div>
      <h2>Your Analysis History</h2>
      {isLoading && <p>Loading...</p>}
      {statements.map((statement) => (
        <div key={statement._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
          <h3>{statement.fileName}</h3>
          <p>{statement.aiResponse?.result?.substring(0, 200)}...</p>
          <small>{new Date(statement.createdAt).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
};

/* ===========================
   PROTECTED ROUTE (React Router)
=========================== */

import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Usage in App.jsx:
// <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

/* ===========================
   COMPLETE APP FLOW (App.tsx)
=========================== */

export const App = () => {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <div>
      {isLoggedIn ? (
        <>
          <nav>
            <h1>Welcome, {user?.name}!</h1>
            <button onClick={logout}>Logout</button>
          </nav>
          <Dashboard />
        </>
      ) : (
        <LoginComponent />
      )}
    </div>
  );
};

/* ===========================
   ERROR HANDLING BEST PRACTICES
=========================== */

export const handleAPIError = (error) => {
  if (error.message === "Not authenticated") {
    // Redirect to login
    window.location.href = "/login";
  } else if (error.message.includes("401")) {
    // Token expired
    localStorage.removeItem("token");
    window.location.href = "/login";
  } else if (error.message.includes("400")) {
    // Bad request - show to user
    return error.message;
  } else if (error.message.includes("500")) {
    // Server error
    return "Server error. Please try again later.";
  }
  return error.message;
};

/* ===========================
   LOCAL STORAGE HELPERS
=========================== */

export const storageAPI = {
  // Save analysis locally before submitting
  saveDraft: (key, data) => {
    localStorage.setItem(`draft_${key}`, JSON.stringify(data));
  },

  // Retrieve draft
  getDraft: (key) => {
    const item = localStorage.getItem(`draft_${key}`);
    return item ? JSON.parse(item) : null;
  },

  // Clear draft
  clearDraft: (key) => {
    localStorage.removeItem(`draft_${key}`);
  },

  // Save user preferences
  savePreferences: (prefs) => {
    localStorage.setItem("user_prefs", JSON.stringify(prefs));
  },

  // Get preferences
  getPreferences: () => {
    const item = localStorage.getItem("user_prefs");
    return item ? JSON.parse(item) : {};
  },
};
