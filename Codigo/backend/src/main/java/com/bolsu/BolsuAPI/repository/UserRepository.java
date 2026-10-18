package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
}
