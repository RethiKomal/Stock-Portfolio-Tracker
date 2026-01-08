import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]); // This holds Current Holdings
  const [portfolio, setPortfolio] = useState(null); // This holds Summary Card Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // 1. AXIOS INTERCEPTOR
  // Attaches the token to every request automatically
  // -----------------------------------------------------------------
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Initial Auth Check on App Load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // -----------------------------------------------------------------
  // 2. AUTH ACTIONS
  // -----------------------------------------------------------------
  const login = async (credentials) => {
    try {
      setLoading(true);

      // 1. CALCULATE TOKEN (Do not save yet - prevents Race Condition)
      const basicAuthToken = 'Basic ' + window.btoa(credentials.email + ":" + credentials.password);
      
      // 2. CALL API 
      // We pass the credentials in the body. The Interceptor won't attach the header yet 
      // because we haven't saved it to localStorage.
      const response = await axios.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      const userData = response.data;

      // 3. SUCCESS? NOW SAVE DATA
      localStorage.setItem('token', basicAuthToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setError(null);
      return response.data;

    } catch (err) {
      // Login failed? Clean up.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', registrationData);
      
      // Save user data (Note: User usually needs to login again to get the Token)
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setStocks([]);
    setPortfolio(null);
  };

  // -----------------------------------------------------------------
  // 3. DATA FETCHING
  // -----------------------------------------------------------------
  
  // Fetches Aggregated Holdings (for the "Your Holdings" list)
  const fetchStocks = async () => {
    try {
      const response = await axios.get('/api/stocks');
      setStocks(response.data);
      setError(null);
    } catch (err) {
      console.error("Fetch Stocks Error:", err);
    }
  };

  // Fetches Portfolio Summary (for the Dashboard Cards)
  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/api/portfolio/summary');
      setPortfolio(response.data);
      
      // The summary endpoint also returns 'stocks', so we can update both
      if (response.data && response.data.stocks) {
        setStocks(response.data.stocks);
      }
      setError(null);
    } catch (err) {
      console.warn("Fetch Portfolio Error:", err);
      // Auto logout on 401 (Unauthorized)
      if (err.response && err.response.status === 401) {
          logout();
      }
    }
  };

  // -----------------------------------------------------------------
  // 4. TRANSACTION ACTIONS
  // -----------------------------------------------------------------

  // BUY STOCK (Creates a BUY Record)
  const addStock = async (stockData) => {
    try {
      const response = await axios.post('/api/stocks', stockData);
      await fetchPortfolio(); // Refresh global state
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
      throw err;
    }
  };

  // SELL STOCK (Creates a SELL Record)
  const sellStockBySymbol = async (sellData) => {
    try {
      // sellData: { symbol, quantity, sellPrice }
      const response = await axios.post('/api/stocks/sell-by-symbol', sellData);
      await fetchPortfolio(); // Refresh global state
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sell stock');
      throw err;
    }
  };

  // UPDATE TRANSACTION (Edit History)
  const updateStock = async (stockId, stockData) => {
    try {
      if (!stockId) throw new Error("Missing Stock ID for update");
      
      const response = await axios.put(`/api/stocks/${stockId}`, stockData);
      
      // THIS IS CRITICAL: It refreshes the "Your Holdings" and "Portfolio Summary"
      await fetchPortfolio(); 
      
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
      throw err;
    }
  };

  // DELETE TRANSACTION (Remove from History)
  const deleteStock = async (stockId) => {
    try {
      await axios.delete(`/api/stocks/${stockId}`);
      await fetchPortfolio(); // Refresh global state
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete stock');
      throw err;
    }
  };

  // UPDATE USER PROFILE
  const updateUserProfile = async (userId, userData) => {
    try {
      const response = await axios.put(`/api/auth/profile/${userId}`, userData);
      // Update local state and storage
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // DELETE ACCOUNT
  const deleteAccount = async (userId) => {
    try {
      await axios.delete(`/api/auth/profile/${userId}`);
      logout(); // Log them out immediately
    } catch (err) {
      throw err;
    }
  };

  const value = {
    user,
    stocks,
    portfolio,
    loading,
    error,
    login,
    register,
    logout,
    fetchStocks,
    fetchPortfolio,
    addStock,
    sellStockBySymbol,
    updateStock,
    deleteStock,
    setError,
    updateUserProfile,
    deleteAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};