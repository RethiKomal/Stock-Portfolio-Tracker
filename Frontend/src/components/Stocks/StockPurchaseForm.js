import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar } from 'lucide-react';
import axios from 'axios'; // Import Axios for price fetch
import './StockPurchaseForm.css';

const StockPurchaseForm = ({ stock, onClose, onSuccess }) => {
  const { addStock, updateStock } = useApp();
  
  const isEditMode = !!stock;
  const isSellRecord = stock?.type === 'SELL';

  const [formData, setFormData] = useState({
    symbol: '',
    companyName: '',
    quantity: '',
    purchasePrice: '',
    tradeDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false); // New loading state for price
  const [error, setError] = useState('');

  useEffect(() => {
    if (stock) {
      setFormData({
        symbol: stock.symbol || '',
        companyName: stock.companyName || '',
        quantity: stock.quantity || '',
        purchasePrice: stock.purchasePrice || '', 
        tradeDate: stock.tradeDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [stock]);

  const handleChange = (e) => {
    const { name, value } = e.target;    
    // --- FIX: If the field is 'symbol', force uppercase ---
    const finalValue = name === 'symbol' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  // --- RESTORED: Auto-fetch Price Function ---
  const handleSymbolBlur = async () => {
    // Only fetch if adding new stock and symbol exists
    if (isEditMode || !formData.symbol) return;

    try {
      setFetchingPrice(true);
      setError('');
      
      // 1. Fetch Price
      const priceRes = await axios.get(`/api/stocks/price/${formData.symbol}`);
      const price = priceRes.data;

      // 2. Update Form
      setFormData(prev => ({
        ...prev,
        purchasePrice: price,
        // Optional: If you had an endpoint for name, you'd fetch it here.
        // For now, we auto-fill company name with Symbol if API doesn't give name
        companyName: prev.companyName || formData.symbol.toUpperCase()
      }));

    } catch (err) {
      // Don't block user, just warn
      console.warn("Could not fetch live price");
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await updateStock(stock.stockId, {
          ...formData,
          type: stock.type, 
          currentPrice: stock.currentPrice 
        });
      } else {
        await addStock(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to save stock');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = (Number(formData.quantity) * Number(formData.purchasePrice)) || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditMode ? `Edit ${isSellRecord ? 'Transaction' : 'Stock'}` : 'Add New Stock'}</h2>
          <button onClick={onClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Stock Symbol *</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                onBlur={handleSymbolBlur} // Triggers fetch
                placeholder="e.g. AAPL"
                required
                disabled={isEditMode} 
                style={{textTransform: 'uppercase'}}
              />
              {fetchingPrice && <span className="input-loader">Fetching price...</span>}
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Apple Inc"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0.01"
                step="any"
                required
              />
            </div>
            <div className="form-group">
              <label>{isSellRecord ? 'Selling Price' : 'Purchase Price'} (₹) *</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                min="0.01"
                step="any"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{isSellRecord ? 'Transaction Date' : 'Purchase Date'} *</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                name="tradeDate"
                value={formData.tradeDate}
                onChange={handleChange}
                required
                className="date-input"
              />
              <Calendar className="calendar-icon" size={20} />
            </div>
          </div>

          <div className="total-investment-banner">
            <span>{isSellRecord ? 'Total Sale Value' : 'Total Investment'}</span>
            <strong>₹{totalValue.toFixed(2)}</strong>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : (isEditMode ? 'Update Stock' : 'Add Stock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockPurchaseForm;