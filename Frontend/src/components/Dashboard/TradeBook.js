import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownLeft, ArrowUpRight, History, Trash2, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext'; // 1. Import Context
import StockPurchaseForm from '../Stocks/StockPurchaseForm';
import './StockList.css';

const TradeBook = () => {
  // 2. Grab fetchPortfolio from context
  const { fetchPortfolio } = useApp(); 
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/stocks/history');
      setTrades(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch history", err);
      setError("Could not load trade history.");
      setLoading(false);
    }
  };

  const handleDelete = async (stockId) => {
    if(!window.confirm("Delete this record? Your portfolio holdings will be recalculated.")) return;
    
    try {
        await axios.delete(`/api/stocks/${stockId}`);
        
        // 3. REFRESH BOTH LISTS
        await fetchHistory();    // Refreshes this table
        await fetchPortfolio();  // Refreshes the Dashboard cards & Holdings list!
        
    } catch(err) {
        alert("Failed to delete transaction");
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
  };

  const handleEditSuccess = async () => {
    setEditingTrade(null);
    // 3. REFRESH BOTH LISTS ON EDIT TOO
    await fetchHistory();
    await fetchPortfolio(); 
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(Number(timestamp)).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  if (loading) return <div className="loading-state">Loading Trade Book...</div>;
  if (error) return <div className="error-message" style={{padding:'20px'}}>{error}</div>;

  return (
    <>
      <div className="stock-list">
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
          <History size={24} color="#64748b"/>
          <h2 style={{margin:0}}>Trade Book (Ledger)</h2>
        </div>

        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Execution Price</th>
                <th>Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const isBuy = trade.type === 'BUY';
                const totalValue = trade.quantity * trade.purchasePrice;
                
                return (
                  <tr key={trade.stockId}>
                    <td>{formatDate(trade.timestamp)}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: isBuy ? '#dcfce7' : '#fee2e2',
                        color: isBuy ? '#166534' : '#991b1b'
                      }}>
                        {isBuy ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                        {trade.type}
                      </span>
                    </td>
                    <td style={{fontWeight:'bold'}}>{trade.symbol}</td>
                    <td>{trade.quantity}</td>
                    <td>{formatCurrency(trade.purchasePrice)}</td>
                    <td style={{fontWeight:'bold'}}>{formatCurrency(totalValue)}</td>

                    <td>
                      <div className="action-buttons">
                        <button 
                            onClick={() => handleEdit(trade)}
                            className="btn-icon edit" 
                            title="Edit Transaction"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(trade.stockId)}
                            className="btn-icon delete" 
                            title="Delete Transaction"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {trades.length === 0 && (
                  <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color: '#64748b'}}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTrade && (
        <StockPurchaseForm 
          stock={editingTrade} 
          onClose={() => setEditingTrade(null)} 
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default TradeBook;