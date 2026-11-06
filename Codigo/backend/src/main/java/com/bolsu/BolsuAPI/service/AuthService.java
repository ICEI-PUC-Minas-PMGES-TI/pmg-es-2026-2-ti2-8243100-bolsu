package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.security.JwtUtil;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public String generateToken(String id){
        return JwtUtil.generateToken(id);
    }

    public String extractId(String token){
        return JwtUtil.extractId(token);
    }
}
