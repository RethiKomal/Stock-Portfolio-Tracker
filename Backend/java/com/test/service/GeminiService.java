package com.test.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // Use the URL from application.properties to ensure flexibility
    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getStockAnalysis(String symbol) {
    	String prompt =
    		    "Analyze the stock ticker '" + symbol + "'. " +
    		    "Respond with a valid JSON object only. " +
    		    "The JSON must contain exactly two keys: " +
    		    "\"positive\" (an array of exactly 3 medium sized strings) and " +
    		    "\"negative\" (an array of exactly 3 medium sized strings). " +
    		    "Each string must be concise and factual. " +
    		    "Do not include explanations, markdown, comments, or any text outside the JSON. " +
    		    "Return only the raw JSON object.";

        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String finalUrl = apiUrl + "?key=" + apiKey;
            ResponseEntity<Map> response = restTemplate.exchange(finalUrl, HttpMethod.POST, entity, Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null) return fallbackJson("Empty response");

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) return fallbackJson("No analysis candidates");

            Map<String, Object> contentRes = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentRes.get("parts");
            String rawText = (String) parts.get(0).get("text");

            return cleanJsonString(rawText);

        } catch (Exception e) {
            e.printStackTrace();
            return fallbackJson("AI Error: " + e.getMessage());
        }
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return fallbackJson("Null response");
        
        // Remove Markdown code blocks
        String cleaned = raw.replaceAll("```json", "").replaceAll("```", "").trim();
        
        // Ensure it starts with { and ends with }
        int firstBrace = cleaned.indexOf("{");
        int lastBrace = cleaned.lastIndexOf("}");
        
        if (firstBrace != -1 && lastBrace != -1) {
            return cleaned.substring(firstBrace, lastBrace + 1);
        }
        return cleaned;
    }

    private String fallbackJson(String msg) {
        // Escape quotes in message to prevent invalid JSON
        String safeMsg = msg.replace("\"", "'");
        return "{\"positive\": [\"Data unavailable\"], \"negative\": [\"" + safeMsg + "\"]}";
    }
}