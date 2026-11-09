package com.bolsu.BolsuAPI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories
public class BolsuApiApplication {
	public static void main(String[] args) {
		SpringApplication.run(BolsuApiApplication.class, args);
	}
}
