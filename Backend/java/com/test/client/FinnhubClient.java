package com.test.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import javax.net.ssl.*;
import java.security.cert.X509Certificate;
import java.util.Collections;
import java.util.Map;

@Component
public class FinnhubClient {

    @Value("${finnhub.api.url}")
    private String apiUrl;

    @Value("${finnhub.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public FinnhubClient() {
        // 1. Disable SSL Verification (Fixes PKIX path building failed)
        disableSslVerification();
        this.restTemplate = new RestTemplate();
    }

    // --- SSL BYPASS LOGIC ---
    private static void disableSslVerification() {
        try {
            // Create a trust manager that does not validate certificate chains
            TrustManager[] trustAllCerts = new TrustManager[] {
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return null; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                    public void checkServerTrusted(X509Certificate[] certs, String authType) { }
                }
            };

            // Install the all-trusting trust manager
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            // Create all-trusting host name verifier
            HostnameVerifier allHostsValid = (hostname, session) -> true;
            HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    // ------------------------

    // 1. Get Current Price
    public Map<String, Object> getQuote(String symbol, String token) {
        // Use apiKey from properties, ignore the token param passed in
        String url = String.format("%s/quote?symbol=%s&token=%s", apiUrl, symbol, apiKey);
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            System.err.println("Finnhub Quote Error: " + e.getMessage());
            return Collections.emptyMap();
        }
    }

    // 2. Get Candles (History)
    public Map<String, Object> getCandles(String symbol, String resolution, String from, String to, String token) {
        String url = String.format("%s/stock/candle?symbol=%s&resolution=%s&from=%s&to=%s&token=%s", 
                apiUrl, symbol, resolution, from, to, apiKey);
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            System.err.println("Finnhub Candle Error: " + e.getMessage());
            return Collections.emptyMap();
        }
    }
}