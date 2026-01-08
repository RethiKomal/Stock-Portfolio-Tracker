# 📈 Stock Portfolio Tracker

A full-stack application that helps users record stock trades, track holdings, analyze portfolio performance, and view AI-generated market summaries. The system combines a Spring Boot backend with a React frontend and integrates with external APIs for real-time insights.

## 🔍 Overview

The **Stock Portfolio Tracker** enables users to:

- Maintain a complete trade ledger with BUY/SELL transactions  
- View real-time holdings and portfolio summaries  
- Analyze historical price trends  
- Access AI-generated sentiment summaries for any stock  
- Manage trades through an intuitive and responsive UI  

## 🚀 Features

### 🧾 Portfolio Management
- Add, edit, or delete transactions  
- Ledger-based model for accurate realized & unrealized P/L  
- Automatic recalculation of averages when past trades change  

### 📊 Market Data & Analytics
- Historical price charts from **Finnhub API**  
- Price trend visualization (30-day window)  
- Automatic fallback data when external APIs fail  

### 🤖 AI-Based Insights
- Market summaries powered by **Gemini AI**  
- Clean text output suitable for UI rendering  

### 💻 Frontend Interface
- Secure login & protected routes  
- Trade entry modals with automatic price fetching  
- Portfolio dashboard with summaries and allocation charts  
- Analytics page with charts and sentiment analysis  

## 🛠️ Tech Stack

### **Backend**
- Java  
- Spring Boot  
- REST APIs  
- DynamoDB / MySQL  
- Finnhub API  
- Gemini AI API  

### **Frontend**
- React.js  
- Axios  
- React Router  
- Recharts  
- Bootstrap  

### **Additional**
- Authentication  
- CORS Configuration  
- Mock Data Generators  

## 📁 Project Structure

```
/backend
  ├── src/main/java/com/test
  │     ├── controller
  │     ├── service
  │     ├── client
  │     ├── config
  │     └── model
  └── resources

/frontend
  ├── src
  │     ├── components
  │     ├── pages
  │     ├── context
  │     └── utils
  └── public
```

## ⚙️ Setup & Installation

### **Backend**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### **Frontend**
```bash
cd frontend
npm install
npm start
```

## 🔑 Configuration

Create `application.properties` for the backend:

```
finnhub.api.key=YOUR_API_KEY
finnhub.api.url=https://finnhub.io/api/v1
gemini.api.key=YOUR_GEMINI_KEY
jwt.secret=YOUR_SECRET
```

## 📊 How the Portfolio Logic Works

- Transactions are retrieved and grouped by stock symbol  
- Net quantity is calculated as total buys minus total sells  
- Average cost is recomputed proportionally on trade edits  
- Realized P/L and unrealized P/L are derived from the full transaction history  
- Dashboard reflects the real-time state of the ledger  

## 🧩 Resilience & Error Handling

- Automatic fallback price data when Finnhub API fails  
- Cleaned AI output to avoid UI rendering issues  
- Graceful error returns to maintain frontend responsiveness  
- Strict JSON sanitization for Gemini AI responses  


