package com.bolsu.BolsuAPI.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customConfig(){
        return new OpenAPI()
                .info(new Info()
                        .title("BolsuAPI")
                        .version("1.0")
                        .description("Documentação dos endpoints presentes na API na qual alimenta o Bolsu App.")
                );
    }
}
