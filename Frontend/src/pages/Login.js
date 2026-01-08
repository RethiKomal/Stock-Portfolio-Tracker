import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TrendingUp, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, error, setError } = useApp();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="brand">
            <TrendingUp size={40} color="#667eea" />
            <h1>StockTracker</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Login to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-login">
            <LogIn size={20} />
            Login
          </button>

          <div className="form-footer">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="link-button"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
