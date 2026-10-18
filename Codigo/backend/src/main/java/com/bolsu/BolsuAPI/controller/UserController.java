package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.UserDTO;
import com.bolsu.BolsuAPI.model.User;
import com.bolsu.BolsuAPI.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAll(){
        return userService.getAll();
    }

    @PostMapping
    public ResponseEntity<User> add(@RequestBody UserDTO userDTO){

        User user = userService.add(new User(userDTO.name(), userDTO.email()));

        return ResponseEntity.ok(user);
    }
}
