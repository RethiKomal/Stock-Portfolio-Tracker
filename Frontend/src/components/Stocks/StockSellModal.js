import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import './StockPurchaseForm.css'; 

const StockSellModal = ({ stock, onClose, onSuccess }) => {
  // Grab the new function from context
  const { sellStock, sellStockBySymbol } = useApp();
  
  const [quantity, setQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(stock.currentPrice || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // stock.purchasePrice might not exist if it's an Aggregate view (Top Holdings)
  // So we only show Realized P/L if we have a specific purchase price.
  const isAggregate = stock.isAggregate === true;

  const totalSaleValue = quantity * sellPrice;
  
  // Only calculate PnL if not aggregate (or if you calculate avg cost in PortfolioSummary)
  const originalCost = isAggregate ? 0 : quantity * stock.purchasePrice;
  const realizedPnL = totalSaleValue - originalCost;
  const isProfit = realizedPnL >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (quantity > stock.quantity) {
      setError(`You only own ${stock.quantity} shares.`);
      return;
    }

    try {
      setLoading(true);
      
      if (isAggregate) {
        // CALL THE NEW ENDPOINT
        await sellStockBySymbol({
            symbol: stock.symbol,
            quantity: Number(quantity),
            sellPrice: Number(sellPrice)
        });
      } else {
        // OLD LOGIC (Keep this for the bottom table if you kept the buttons there)
        await sellStock({
            stockId: stock.stockId,
            quantity: Number(quantity),
            sellPrice: Number(sellPrice)
        });
      }

      onSuccess();
    } catch (err) {
      setError('Failed to process sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Sell {stock.symbol}</h2>
          <button onClick={onClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Quantity to Sell (Total Owned: {stock.quantity})</label>
            <input
              type="number"
              min="1"
              max={stock.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Selling Price (Per Share)</label>
            <input
              type="number"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              required
            />
          </div>

          <div className="summary-box" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Total Sale Value:</span>
              <strong>₹{totalSaleValue.toFixed(2)}</strong>
            </div>
            
            {/* Only show Profit/Loss if we know the specific cost basis */}
            {!isAggregate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: isProfit ? 'green' : 'red' }}>
                <span>Realized {isProfit ? 'Profit' : 'Loss'}:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isProfit ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    <strong>₹{Math.abs(realizedPnL).toFixed(2)}</strong>
                </span>
                </div>
            )}
            
            {isAggregate && (
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                    * Selling oldest shares first (FIFO)
                </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading} style={{ backgroundColor: '#dc3545' }}>
              {loading ? 'Processing...' : 'Confirm Sell'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockSellModal;