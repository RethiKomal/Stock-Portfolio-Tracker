import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, PieChart as PieIcon, BrainCircuit } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const { stocks } = useApp(); 
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [news, setNews] = useState({ positive: [], negative: [] });
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

  useEffect(() => {
    if (stocks.length > 0 && !selectedSymbol) {
      setSelectedSymbol(stocks[0].symbol);
    }
  }, [stocks]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchChartData(selectedSymbol);
      fetchAiNews(selectedSymbol);
    }
  }, [selectedSymbol]);

  const fetchChartData = async (symbol) => {
    setLoadingChart(true);
    try {
      const res = await axios.get(`/api/analytics/chart/${symbol}`);
      setChartData(res.data);
    } catch (err) {
      console.error("Chart Error", err);
    } finally {
      setLoadingChart(false);
    }
  };

  // --- MODIFIED: AI Fetch with "Next Day" Caching Logic ---
  const fetchAiNews = async (symbol) => {
    setLoadingNews(true);
    const cacheKey = `ai_cache_${symbol}`;
    const today = new Date().toDateString(); // e.g. "Fri Nov 28 2025"

    // 1. CHECK CACHE
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      
      // If the cached date matches today's date, use it!
      if (parsedCache.date === today) {
        console.log(`Using cached AI data for ${symbol}`);
        setNews(parsedCache.data);
        setLoadingNews(false);
        return; // EXIT FUNCTION EARLY
      }
    }

    // 2. FETCH FROM API (If no cache or cache is old)
    try {
      console.log(`Fetching FRESH AI data for ${symbol}`);
      const res = await axios.get(`/api/analytics/news/${symbol}`);
      const parsed = typeof res.data === 'object' ? res.data : JSON.parse(res.data);
      
      setNews(parsed);

      // 3. SAVE TO CACHE (With Today's Date)
      const cacheObject = {
        date: today,
        data: parsed
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheObject));

    } catch (err) {
      console.error("AI News Error", err);
      setNews({ positive: [], negative: [] });
    } finally {
      setLoadingNews(false);
    }
  };

  const pieData = stocks.map(s => ({
    name: s.symbol,
    value: s.quantity * s.currentPrice
  }));

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics & AI Insights</h1>
        <p style={{color:'#64748b'}}>Deep dive into your portfolio performance</p>
        
        <div className="ticker-selector">
          {stocks.map(s => (
            <button 
              key={s.symbol}
              className={`ticker-btn ${selectedSymbol === s.symbol ? 'active' : ''}`}
              onClick={() => setSelectedSymbol(s.symbol)}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        
        {/* LEFT COL: Price Chart & News */}
        <div className="left-col" style={{display:'flex', flexDirection:'column', gap:'24px'}}>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>{selectedSymbol} Performance</h3>
                <span style={{fontSize:'0.9rem', color:'#64748b'}}>Last 30 Days Trend</span>
              </div>
              <Activity color="#6366f1" />
            </div>

            <div style={{ height: 350, width: '100%' }}>
              {loadingChart ? (
                <div className="loading-skeleton">Loading Market Data...</div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{fontSize: 12, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#94a3b8',
                    background: '#f8fafc',
                    borderRadius: '8px'
                }}>
                    <Activity size={48} style={{opacity: 0.2, marginBottom: '10px'}} />
                    <p>No chart data available for {selectedSymbol}</p>
                    <small>Try a major ticker like AAPL or NFLX</small>
                </div>
              )}
            </div>
          </div>

          <div className="news-card">
            <div className="chart-header">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <BrainCircuit color="#ec4899" />
                <h3>AI Analysis for {selectedSymbol}</h3>
              </div>
            </div>

            {loadingNews ? (
                <div className="loading-skeleton">Analyzing Market Sentiment...</div>
            ) : (
                <div className="news-grid">
                    <div className="news-column">
                        <h4 style={{color: '#16a34a'}}><TrendingUp size={18}/> Bullish Signals</h4>
                        {news.positive?.map((item, i) => (
                            <div key={i} className="news-item positive">{item}</div>
                        ))}
                    </div>
                    <div className="news-column">
                        <h4 style={{color: '#dc2626'}}><TrendingDown size={18}/> Bearish Risks</h4>
                        {news.negative?.map((item, i) => (
                            <div key={i} className="news-item negative">{item}</div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: Allocation */}
        <div className="right-col">
          <div className="pie-card">
            <h3><PieIcon size={20} style={{verticalAlign:'bottom', marginRight:'8px'}}/> Allocation</h3>
            <div style={{ height: 300, width: '100%', marginTop:'20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${val.toFixed(2)}`}/>
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{textAlign:'center', marginTop:'20px', color:'#64748b', fontSize:'0.9rem'}}>
               Your portfolio distribution based on current market value.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;