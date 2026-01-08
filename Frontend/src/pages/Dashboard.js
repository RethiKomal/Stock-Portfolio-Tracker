import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogOut, Plus, TrendingUp, History, LayoutDashboard, BarChart2 } from 'lucide-react';

// Components
import PortfolioSummary from '../components/Dashboard/PortfolioSummary';
import StockList from '../components/Dashboard/StockList';
import TradeBook from '../components/Dashboard/TradeBook'; 
import StockPurchaseForm from '../components/Stocks/StockPurchaseForm';
import Analytics from './Analytics'; // Ensure this file exists

import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, fetchPortfolio, portfolio } = useApp();
  
  // UI State
  const [showAddStock, setShowAddStock] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  
  // View Switcher State: 'portfolio', 'history', or 'analytics'
  const [currentView, setCurrentView] = useState('portfolio');

  useEffect(() => {
    const loadData = async () => {
      setIsDashboardLoading(true);
      await fetchPortfolio();
      setIsDashboardLoading(false);
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStockAdded = async () => {
    setShowAddStock(false);
    await fetchPortfolio();
  };

  return (
    <div className="dashboard">
      {/* --- NAVIGATION BAR --- */}
      <nav className="dashboard-nav">
        {/* Left: Brand */}
        <div className="nav-brand">
          <TrendingUp size={32} />
          <span>StockTracker</span>
        </div>

        {/* Center: View Switcher Buttons */}
        <div className="nav-links">
            <button 
                onClick={() => setCurrentView('portfolio')}
                className={`nav-item ${currentView === 'portfolio' ? 'active' : ''}`}
            >
                <LayoutDashboard size={20} />
                <span>Portfolio</span>
            </button>
            
            <button 
                onClick={() => setCurrentView('history')}
                className={`nav-item ${currentView === 'history' ? 'active' : ''}`}
            >
                <History size={20} />
                <span>Trade Book</span>
            </button>

            <button 
                onClick={() => setCurrentView('analytics')}
                className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            >
                <BarChart2 size={20} />
                <span>Analytics</span>
            </button>
        </div>

        {/* Right: User Profile */}
        <div className="nav-user">
          <div 
            onClick={() => navigate('/profile')} 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <img 
                src="https://tse3.mm.bing.net/th/id/OIP.YUggaE09mu25UYFxl-BLjQAAAA?w=171&h=197&c=7&r=0&o=7&pid=1.7&rm=3" 
                alt="User" 
                style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}}
            />
            <span className="username">{user?.username || 'User'}</span>
          </div>
          
          <button onClick={handleLogout} className="btn-logout" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="dashboard-content">
        
        {/* Only show standard Header for Portfolio/TradeBook. Analytics has its own header. */}
        {currentView !== 'analytics' && (
            <div className="dashboard-header">
            <h1>{currentView === 'portfolio' ? 'My Portfolio' : 'Transaction History'}</h1>
            
            {/* Only show "Add Stock" button in Portfolio view */}
            {currentView === 'portfolio' && (
                <button onClick={() => setShowAddStock(true)} className="btn-add-stock">
                    <Plus size={20} />
                    Add Stock
                </button>
            )}
            </div>
        )}

        {/* --- VIEW SWITCHER LOGIC --- */}
        {currentView === 'portfolio' ? (
             isDashboardLoading ? (
                <div className="loading-state">Loading your portfolio...</div>
              ) : (
                <>
                  <PortfolioSummary portfolio={portfolio} />
                  <StockList 
                      stocks={portfolio?.stocks || []} 
                      onUpdate={fetchPortfolio} 
                  />
                </>
              )
        ) : currentView === 'history' ? (
            <TradeBook />
        ) : (
            // Render Analytics Component
            <Analytics />
        )}
      </div>

      {showAddStock && (
        <StockPurchaseForm
          onClose={() => setShowAddStock(false)}
          onSuccess={handleStockAdded}
        />
      )}
    </div>
  );
};

export default Dashboard;