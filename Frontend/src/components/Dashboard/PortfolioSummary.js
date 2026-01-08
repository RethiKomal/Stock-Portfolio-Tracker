import React, { useState } from 'react';
import { DollarSign, PieChart, TrendingUp, Wallet, CheckCircle } from 'lucide-react';
import StockSellModal from '../Stocks/StockSellModal';
import './PortfolioSummary.css';

const PortfolioSummary = ({ portfolio }) => {
  const [sellingSymbol, setSellingSymbol] = useState(null);

  if (!portfolio) return null;

  // Extract the new 'realizedGain' field
  const { 
    totalPortfolioValue, 
    totalInvestment, 
    totalGainLoss, 
    totalGainLossPercentage, 
    realizedGain, 
    topHoldings, 
    stocks 
  } = portfolio;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  const handleSellClick = (symbol) => {
    const relevantStocks = stocks.filter(s => s.symbol === symbol);
    const totalQty = relevantStocks.reduce((acc, curr) => acc + curr.quantity, 0);
    const currentPrice = relevantStocks.length > 0 ? relevantStocks[0].currentPrice : 0;

    setSellingSymbol({
      symbol: symbol,
      quantity: totalQty,
      currentPrice: currentPrice,
      isAggregate: true 
    });
  };

  return (
    <>
      <div className="portfolio-summary">
        {/* Cards Section */}
        <div className="summary-cards">
          
          {/* 1. Portfolio Value */}
          <div className="card value-card">
            <div className="card-icon">
              <Wallet size={24} color="white" />
            </div>
            <div>
              <h3>Portfolio Value</h3>
              <p className="amount">{formatCurrency(totalPortfolioValue)}</p>
            </div>
          </div>

          {/* 2. Investment */}
          <div className="card">
            <div className="card-icon">
              <PieChart size={24} />
            </div>
            <div>
              <h3>Total Investment</h3>
              <p className="amount">{formatCurrency(totalInvestment)}</p>
            </div>
          </div>

          {/* 3. Total P&L (Unrealized + Realized) */}
          <div className="card">
            <div className="card-icon" style={{ 
                backgroundColor: totalGainLoss >= 0 ? '#dcfce7' : '#fee2e2', 
                color: totalGainLoss >= 0 ? '#166534' : '#991b1b' 
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3>Total Gain/Loss</h3>
              <p className={`amount ${totalGainLoss >= 0 ? 'gain' : 'loss'}`}>
                {formatCurrency(totalGainLoss)} 
                <span className="percentage">({totalGainLossPercentage.toFixed(2)}%)</span>
              </p>
            </div>
          </div>

          {/* 4. NEW CARD: Realized Gain */}
          <div className="card">
            <div className="card-icon" style={{ 
                backgroundColor: '#e0e7ff', 
                color: '#4f46e5' 
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3>Realized Gain</h3>
              <p className={`amount ${realizedGain >= 0 ? 'gain' : 'loss'}`}>
                {formatCurrency(realizedGain)}
              </p>
            </div>
          </div>

        </div>

        {/* Top Holdings Section */}
        <div className="top-holdings">
          <h3>Top Holdings</h3>
          <div className="holdings-list">
            {Object.entries(topHoldings).map(([symbol, percentage]) => (
              <div key={symbol} className="holding-item">
                <div className="holding-info">
                  <span className="symbol">{symbol}</span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="percentage-text">{percentage.toFixed(2)}%</span>
                  <button className="btn-sell-small" onClick={() => handleSellClick(symbol)}>Sell</button>
                </div>
              </div>
            ))}
            {Object.keys(topHoldings).length === 0 && (
                <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>No holdings to display.</p>
            )}
          </div>
        </div>
      </div>

      {sellingSymbol && (
        <StockSellModal
          stock={sellingSymbol}
          onClose={() => setSellingSymbol(null)}
          onSuccess={() => setSellingSymbol(null)}
        />
      )}
    </>
  );
};

export default PortfolioSummary;