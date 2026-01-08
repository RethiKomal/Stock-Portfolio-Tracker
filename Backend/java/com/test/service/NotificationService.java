package com.test.service;
 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.test.model.Stock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
 
import java.util.HashMap;
import java.util.Map;
 
/**
* Best-effort notification sender to API Gateway -> Lambda (SES).
* Logs and swallows exceptions so main flow (DB writes) does not fail.
*/
@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
 
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
 
    @Value("${trade.notification.url}")
    private String tradeNotificationUrl;
 
    public NotificationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
 
    public void notifyTrade(Stock trade, String email) {
        if (trade == null || email == null || email.isBlank() || tradeNotificationUrl == null || tradeNotificationUrl.isBlank()) {
            logger.debug("Notification skipped: missing trade/email/url");
            return;
        }
 
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("email", email);
            payload.put("symbol", trade.getSymbol());
            payload.put("type", trade.getType());
            payload.put("quantity", trade.getQuantity());
            payload.put("purchasePrice", trade.getPurchasePrice());
            payload.put("currentPrice", trade.getCurrentPrice());
            payload.put("gainLoss", trade.getGainLoss());
            payload.put("tradeDate", trade.getTradeDate());
            payload.put("timestamp", trade.getTimestamp());
            payload.put("userId", trade.getUserId());
 
            String json = objectMapper.writeValueAsString(payload);
 
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> req = new HttpEntity<>(json, headers);
 
            ResponseEntity<String> resp = restTemplate.exchange(tradeNotificationUrl, HttpMethod.POST, req, String.class);
 
            if (!resp.getStatusCode().is2xxSuccessful()) {
                logger.warn("Trade notification returned non-2xx: {} body={}", resp.getStatusCodeValue(), resp.getBody());
            } else {
                logger.info("Trade notification sent successfully. status={}, body={}", resp.getStatusCodeValue(), resp.getBody());
            }
        } catch (Exception e) {
            logger.error("Failed to send trade notification: {}", e.getMessage(), e);
        }
    }
}