import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, BarChart3, Zap } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-brand">
          <TrendingUp size={32} />
          <span>StockTracker</span>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary">
            Get Started
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>Manage Your Stock Portfolio<br />with Confidence</h1>
          <p>Track your investments, monitor performance, and make informed decisions with our powerful portfolio management tool.</p>
          <button onClick={() => navigate('/register')} className="btn-cta">
            Start Tracking Now
          </button>
        </div>
        <div className="hero-image">
          <div className="chart-illustration">
            <BarChart3 size={200} color="#667eea" />
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose StockTracker?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Zap size={48} color="#667eea" />
            <h3>Real-Time Tracking</h3>
            <p>Monitor your portfolio performance with live stock prices and instant updates.</p>
          </div>
          <div className="feature-card">
            <Shield size={48} color="#667eea" />
            <h3>Secure & Reliable</h3>
            <p>Your data is encrypted and stored securely in AWS DynamoDB.</p>
          </div>
          <div className="feature-card">
            <BarChart3 size={48} color="#667eea" />
            <h3>Advanced Analytics</h3>
            <p>Gain insights with detailed portfolio analytics and performance metrics.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 StockTracker. Built with React & Spring Boot.</p>
      </footer>
    </div>
  );
};

export default LandingPage;