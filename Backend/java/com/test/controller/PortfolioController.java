package com.test.controller;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import org.bouncycastle.asn1.x509.NoticeReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.test.client.FinnhubClient;
import com.test.model.Stock;
import com.test.model.User;
import com.test.repository.StockRepository;
import com.test.repository.UserRepository;
import com.test.service.NotificationService;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*")
@RestController
@RequestMapping("/api/stocks")
public class PortfolioController {

    @Autowired private StockRepository stockRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FinnhubClient finnhubClient;
    @Autowired private NotificationService notificationService;

    @Value("${finnhub.api.key}")
    private String apiKey;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ------------------------------------------------------------
    // 1. GET HISTORY (List of every single transaction)
    // ------------------------------------------------------------
    @GetMapping("/history")
    public List<Stock> getTradeHistory() {
        User user = getAuthenticatedUser();
        // Wrap in ArrayList to avoid sorting crash
        List<Stock> allTransactions = new ArrayList<>(stockRepository.findByUserId(user.getUserId()));
        
        // Sort Newest First
        allTransactions.sort((s1, s2) -> {
            long t1 = s1.getTimestamp() != null ? s1.getTimestamp() : 0;
            long t2 = s2.getTimestamp() != null ? s2.getTimestamp() : 0;
            return Long.compare(t2, t1);
        });
        
        return allTransactions;
    }

    // ------------------------------------------------------------
    // 2. CURRENT HOLDINGS (Aggregation Logic)
    // ------------------------------------------------------------
    @GetMapping
    public List<Stock> getMyStocks() {
        User user = getAuthenticatedUser();
        List<Stock> transactions = new ArrayList<>(stockRepository.findByUserId(user.getUserId()));

        // Group by Symbol (e.g., combine all AAPL records)
        Map<String, List<Stock>> grouped = transactions.stream()
            .collect(Collectors.groupingBy(Stock::getSymbol));

        List<Stock> currentHoldings = new ArrayList<>();

        for (Map.Entry<String, List<Stock>> entry : grouped.entrySet()) {
            String symbol = entry.getKey();
            List<Stock> trades = entry.getValue();

            int netQuantity = 0;
            double totalCostBasis = 0;

            // Sort Oldest -> Newest to calculate Average Cost properly
            trades.sort(Comparator.comparingLong(s -> s.getTimestamp() != null ? s.getTimestamp() : 0));

            for (Stock t : trades) {
                if ("BUY".equalsIgnoreCase(t.getType())) {
                    // BUY: Add to quantity
                    netQuantity += t.getQuantity();
                    totalCostBasis += (t.getQuantity() * t.getPurchasePrice());
                } else if ("SELL".equalsIgnoreCase(t.getType())) {
                    // SELL: Subtract from quantity
                    if (netQuantity > 0) {
                        double avgCost = totalCostBasis / netQuantity;
                        
                        // HERE IS THE LOGIC YOU ASKED FOR:
                        netQuantity -= t.getQuantity(); 
                        
                        // Reduce the cost basis proportionally
                        totalCostBasis -= (t.getQuantity() * avgCost);
                    }
                }
            }

            // Only add to the list if you still own shares (Quantity > 0)
            if (netQuantity > 0) {
                Stock holding = new Stock();
                holding.setSymbol(symbol);
                holding.setQuantity(netQuantity);
                // Weighted Average Purchase Price
                holding.setPurchasePrice(totalCostBasis / netQuantity); 
                holding.setStockId(UUID.randomUUID().toString()); // Temp ID for frontend
                
                // Get Live Price
                try {
                    Map<String, Object> quote = finnhubClient.getQuote(symbol, apiKey);
                    if (quote != null && quote.get("c") != null) {
                        holding.setCurrentPrice(Double.parseDouble(quote.get("c").toString()));
                    } else {
                        holding.setCurrentPrice(trades.get(trades.size()-1).getPurchasePrice());
                    }
                } catch (Exception e) {
                    holding.setCurrentPrice(holding.getPurchasePrice());
                }

                double totalValue = holding.getCurrentPrice() * netQuantity;
                holding.setGainLoss(totalValue - totalCostBasis);
                
                currentHoldings.add(holding);
            }
        }
        return currentHoldings;
    }

    // ------------------------------------------------------------
    // 3. BUY STOCK
    // ------------------------------------------------------------
    @PostMapping
    public Stock addStock(@RequestBody Stock stock) {
        User user = getAuthenticatedUser();
        stock.setUserId(user.getUserId());
        stock.setType("BUY");
        
        // --- FIX: Force Symbol to Uppercase ---
        if (stock.getSymbol() != null) {
            stock.setSymbol(stock.getSymbol().toUpperCase());
        }
        
        stock.setTimestamp(System.currentTimeMillis());

        if (stock.getTradeDate() == null) {
            stock.setTradeDate(LocalDate.now().toString());
        }

        // Fetch price if not provided
        if (stock.getPurchasePrice() == 0 || stock.getCurrentPrice() == 0) {
            try {
                // Use the uppercase symbol for API call
                Map<String, Object> quote = finnhubClient.getQuote(stock.getSymbol(), apiKey);
                if (quote != null && quote.get("c") != null) {
                    double price = Double.parseDouble(quote.get("c").toString());
                    if (stock.getPurchasePrice() == 0) stock.setPurchasePrice(price);
                    if (stock.getCurrentPrice() == 0) stock.setCurrentPrice(price);
                }
            } catch (Exception ignored) {}
        }

        stock.setGainLoss(0);
        Stock saved = stockRepository.save(stock);
        notificationService.notifyTrade(saved, user.getEmail());
        return saved;
    }
    

    // ------------------------------------------------------------
    // 4. SELL STOCK
    // ------------------------------------------------------------
    static class SellRequest {
        public String symbol;
        public int quantity;
        public double sellPrice;
    }
    
    @PostMapping("/sell-by-symbol")
    public ResponseEntity<?> sellStockBySymbol(@RequestBody SellRequest request) {
        User user = getAuthenticatedUser();
        
        // --- FIX: Force Symbol to Uppercase ---
        String upperSymbol = request.symbol.toUpperCase();
        
        List<Stock> transactions = new ArrayList<>(stockRepository.findByUserId(user.getUserId()));

        // Calculate Net Owned using upperSymbol
        int netOwned = transactions.stream()
                .filter(s -> s.getSymbol().equalsIgnoreCase(upperSymbol))
                .mapToInt(s -> "BUY".equalsIgnoreCase(s.getType()) ? s.getQuantity() : -s.getQuantity())
                .sum();

        if (netOwned < request.quantity) {
            return ResponseEntity.badRequest().body("Insufficient shares. You own " + netOwned);
        }

        // Create SELL Record
        Stock sellRecord = new Stock();
        sellRecord.setUserId(user.getUserId());
        sellRecord.setSymbol(upperSymbol); // Use Uppercase
        sellRecord.setType("SELL");
        sellRecord.setQuantity(request.quantity);
        sellRecord.setPurchasePrice(request.sellPrice); 
        sellRecord.setTimestamp(System.currentTimeMillis());
        sellRecord.setTradeDate(LocalDate.now().toString());

        double totalBuyCost = 0;
        int totalBuyQty = 0;
        for (Stock s : transactions) {
            if (s.getSymbol().equalsIgnoreCase(upperSymbol) && "BUY".equalsIgnoreCase(s.getType())) {
                totalBuyCost += (s.getQuantity() * s.getPurchasePrice());
                totalBuyQty += s.getQuantity();
            }
        }
        
        double avgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;
        double realizedPnL = (request.sellPrice - avgBuyPrice) * request.quantity;
        
        sellRecord.setGainLoss(realizedPnL);
      
        Stock saved = stockRepository.save(sellRecord);
        notificationService.notifyTrade(saved, user.getEmail());
        return ResponseEntity.ok("Sold " + request.quantity + " shares of " + request.symbol);
    }
 
    // ------------------------------------------------------------
    // 5. DELETE TRANSACTION
    // ------------------------------------------------------------
    @DeleteMapping("/{stockId}")
    public ResponseEntity<Void> deleteStock(@PathVariable String stockId) {
        if (stockRepository.existsById(stockId)) {
            stockRepository.deleteById(stockId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ------------------------------------------------------------
    // 6. LIVE PRICE
    // ------------------------------------------------------------
    @GetMapping("/price/{symbol}")
    public ResponseEntity<Double> getCurrentPrice(@PathVariable String symbol) {
        try {
            Map<String, Object> quote = finnhubClient.getQuote(symbol.toUpperCase(), apiKey);
            if (quote != null && quote.get("c") != null) {
                return ResponseEntity.ok(Double.parseDouble(quote.get("c").toString()));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    
 // ------------------------------------------------------------
    // 5. UPDATE TRANSACTION
    // ------------------------------------------------------------
 // ------------------------------------------------------------
    // 5. UPDATE TRANSACTION
    // ------------------------------------------------------------
    @PutMapping("/{stockId}")
    public ResponseEntity<Stock> updateStock(@PathVariable String stockId, @RequestBody Stock updated) {
        return stockRepository.findById(stockId)
                .map(existing -> {
                    if (!existing.getUserId().equals(getAuthenticatedUser().getUserId())) {
                        throw new RuntimeException("Unauthorized");
                    }

                    // 1. Update Basic Fields
                    existing.setSymbol(updated.getSymbol());
                    existing.setTradeDate(updated.getTradeDate());
                    
                    // 2. Logic depends on Transaction Type
                    if ("BUY".equalsIgnoreCase(existing.getType())) {
                        // --- UPDATING A BUY ---
                        existing.setQuantity(updated.getQuantity());
                        existing.setPurchasePrice(updated.getPurchasePrice());
                        
                        // Recalculate Unrealized PnL (Current Value - New Cost)
                        double totalValue = existing.getCurrentPrice() * existing.getQuantity();
                        double totalCost = existing.getPurchasePrice() * existing.getQuantity();
                        existing.setGainLoss(totalValue - totalCost);
                        
                    } else {
                        // --- UPDATING A SELL ---
                        // We must fetch ALL transactions to calculate the Average Buy Price correctly
                        // so we can determine the new Realized PnL.
                        
                        List<Stock> allStocks = stockRepository.findByUserId(existing.getUserId());
                        
                        double totalBuyCost = 0;
                        int totalBuyQty = 0;
                        
                        for(Stock s : allStocks) {
                            // Look for BUYs of the same symbol
                            // IMPORTANT: Exclude the current record if it was somehow a BUY before (rare case)
                            if(s.getSymbol().equalsIgnoreCase(existing.getSymbol()) 
                               && "BUY".equalsIgnoreCase(s.getType())) {
                                totalBuyCost += (s.getQuantity() * s.getPurchasePrice());
                                totalBuyQty += s.getQuantity();
                            }
                        }
                        
                        double avgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;
                        
                        // Update the Sell Record
                        existing.setQuantity(updated.getQuantity());
                        existing.setPurchasePrice(updated.getPurchasePrice()); // New Sell Price
                        
                        // Recalculate Profit: (New Sell Price - Avg Buy Price) * New Qty
                        double newRealizedPnL = (updated.getPurchasePrice() - avgBuyPrice) * updated.getQuantity();
                        existing.setGainLoss(newRealizedPnL);
                    }

                    return ResponseEntity.ok(stockRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}