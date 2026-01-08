package com.test.controller;

import com.test.client.FinnhubClient;
import com.test.model.Stock;
import com.test.model.User;
import com.test.repository.StockRepository;
import com.test.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioSummaryController {

    @Autowired private StockRepository stockRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FinnhubClient finnhubClient;
    
    @Value("${finnhub.api.key}")
    private String apiKey;

    @GetMapping("/summary")
    public Map<String, Object> getPortfolioSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Stock> allTransactions = new ArrayList<>(stockRepository.findByUserId(user.getUserId()));

        double totalCurrentValue = 0.0;
        double totalCurrentInvestment = 0.0;
        double totalRealizedPnL = 0.0;
        
        Map<String, Double> symbolValueMap = new HashMap<>();
        List<Stock> aggregatedHoldings = new ArrayList<>();

        Map<String, List<Stock>> grouped = allTransactions.stream()
                .collect(Collectors.groupingBy(Stock::getSymbol));

        for (Map.Entry<String, List<Stock>> entry : grouped.entrySet()) {
            String symbol = entry.getKey();
            List<Stock> trades = entry.getValue();
            
            // Sort Oldest -> Newest
            trades.sort(Comparator.comparingLong(s -> s.getTimestamp() != null ? s.getTimestamp() : 0));

            int netQuantity = 0;
            double totalCostBasis = 0.0;

            for (Stock t : trades) {
                if ("BUY".equalsIgnoreCase(t.getType())) {
                    netQuantity += t.getQuantity();
                    totalCostBasis += (t.getQuantity() * t.getPurchasePrice());
                } else if ("SELL".equalsIgnoreCase(t.getType())) {
                    // Accumulate Realized Profit for the separate card
                    totalRealizedPnL += t.getGainLoss();

                    if (netQuantity > 0) {
                        double avgCost = totalCostBasis / netQuantity;
                        netQuantity -= t.getQuantity();
                        totalCostBasis -= (t.getQuantity() * avgCost);
                    }
                }
            }

            if (netQuantity > 0) {
                double currentPrice = 0.0;
                try {
                    Map<String, Object> quote = finnhubClient.getQuote(symbol, apiKey);
                    if (quote != null && quote.get("c") != null) {
                        currentPrice = Double.parseDouble(quote.get("c").toString());
                    } else {
                        currentPrice = trades.get(trades.size()-1).getPurchasePrice();
                    }
                } catch (Exception e) {
                    currentPrice = 0.0;
                }

                double currentValue = netQuantity * currentPrice;
                totalCurrentValue += currentValue;
                totalCurrentInvestment += totalCostBasis;
                symbolValueMap.put(symbol, currentValue);

                Stock holding = new Stock();
                holding.setSymbol(symbol);
                holding.setQuantity(netQuantity);
                holding.setCurrentPrice(currentPrice);
                holding.setPurchasePrice(totalCostBasis / netQuantity); 
                holding.setGainLoss(currentValue - totalCostBasis); 
                holding.setStockId(UUID.randomUUID().toString()); 
                
                aggregatedHoldings.add(holding);
            }
        }

        // --- FIX IS HERE ---
        // "Total Gain/Loss" now represents ONLY Unrealized (Active) Gain
        double totalUnrealizedPnL = totalCurrentValue - totalCurrentInvestment;
        
        // This makes the main card match the "Your Holdings" table exactly
        double totalGainLoss = totalUnrealizedPnL; 
        
        double totalGainLossPercentage = (totalCurrentInvestment > 0) 
                ? (totalGainLoss / totalCurrentInvestment) * 100 
                : 0.0;

        Map<String, Object> response = new HashMap<>();
        response.put("totalPortfolioValue", totalCurrentValue);
        response.put("totalInvestment", totalCurrentInvestment);
        
        // This will now show only the gain/loss of stocks you currently hold
        response.put("totalGainLoss", totalGainLoss);
        response.put("totalGainLossPercentage", totalGainLossPercentage);
        
        // This separate key handles the "Booked Profit" card
        response.put("realizedGain", totalRealizedPnL); 
        
        response.put("stocks", aggregatedHoldings); 
        response.put("topHoldings", calculateSortedHoldings(symbolValueMap, totalCurrentValue));

        return response;
    }

    private Map<String, Double> calculateSortedHoldings(Map<String, Double> holdings, double totalValue) {
        Map<String, Double> percentages = new HashMap<>();
        if (totalValue == 0) return percentages;

        for (Map.Entry<String, Double> entry : holdings.entrySet()) {
            percentages.put(entry.getKey(), (entry.getValue() / totalValue) * 100);
        }

        return percentages.entrySet()
            .stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .collect(Collectors.toMap(
                Map.Entry::getKey, 
                Map.Entry::getValue, 
                (e1, e2) -> e1, 
                LinkedHashMap::new
            ));
    }
}