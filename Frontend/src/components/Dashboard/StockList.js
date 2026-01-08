import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StockList.css';

const StockList = ({ stocks }) => {

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (!stocks || stocks.length === 0) {
    return (
      <div className="stock-list-empty">
        <p>No stocks in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <div className="stock-list">
      <h2>Your Holdings</h2>
      <div className="stock-table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg Price</th>
              <th>LTP</th>
              <th>Investment</th>
              <th>Current Value</th>
              <th>Gain/Loss</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isGain = stock.gainLoss >= 0;
              
              // Calculate percentage based on total investment for this specific stock
              const investment = stock.quantity * stock.purchasePrice;
              const percentage = investment > 0 ? (stock.gainLoss / investment) * 100 : 0;

              return (
                <tr key={stock.stockId || stock.symbol}>
                  <td className="symbol-cell">
                    <strong>{stock.symbol}</strong>
                  </td>
                  <td>{stock.quantity}</td>
                  <td>{formatCurrency(stock.purchasePrice)}</td>
                  <td>{formatCurrency(stock.currentPrice)}</td>
                  <td>{formatCurrency(investment)}</td>
                  <td>{formatCurrency(stock.quantity * stock.currentPrice)}</td>
                  <td className={isGain ? 'gain' : 'loss'}>
                    <div className="gain-loss-cell">
                      {isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>
                        {formatCurrency(stock.gainLoss)}
                        <small>{formatPercentage(percentage)}</small>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockList;