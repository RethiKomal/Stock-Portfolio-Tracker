package com.test.controller;

import com.test.model.User;
import com.test.repository.StockRepository;
import com.test.repository.UserRepository;
import com.test.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin is removed because SecurityConfig handles it
public class AuthController {

    @Autowired
    private UserService userService;
    @Autowired 
    private UserRepository userRepository;
    @Autowired 
    private StockRepository stockRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User newUser = userService.registerUser(user);
            return ResponseEntity.ok(newUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        // Debugging: Print to console to ensure data is arriving
        System.out.println("Login attempt for: " + email);
        System.out.println("Password: "+password);

        User user = userService.loginUser(email, password);

        if (user != null) {
            return ResponseEntity.ok(user); 
        } else {
            // Return 401 Unauthorized instead of throwing an exception
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable String userId, @RequestBody User updatedData) {
        return userRepository.findById(userId).map(user -> {
            user.setUsername(updatedData.getUsername());
            user.setEmail(updatedData.getEmail());
            // If you want to allow password updates, you need to re-encode it here using UserService
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/profile/{userId}")
    public ResponseEntity<?> deleteAccount(@PathVariable String userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        
        // 1. Delete all user stocks (Clean up)
        var stocks = stockRepository.findByUserId(userId);
        stockRepository.deleteAll(stocks);
        
        // 2. Delete the user
        userRepository.deleteById(userId);
        
        return ResponseEntity.ok("Account deleted successfully");
    }
}