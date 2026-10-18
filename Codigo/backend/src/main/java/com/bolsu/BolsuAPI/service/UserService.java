package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.model.User;
import com.bolsu.BolsuAPI.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAll(){
        return userRepository.findAll();
    }

    public User add(User user){
        return userRepository.save(user);
    }
}
