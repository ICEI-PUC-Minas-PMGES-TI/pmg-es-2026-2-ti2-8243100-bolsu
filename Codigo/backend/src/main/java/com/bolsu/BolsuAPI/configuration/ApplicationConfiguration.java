package com.bolsu.BolsuAPI.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApplicationConfiguration {

    @Bean
    public OpenAPI customConfig(){
        return new OpenAPI()
                .info(new Info()
                        .title("BolsuAPI")
                        .version("1.0")
                        .description("Documentação dos endpoints presentes na API na qual alimenta o Bolsu App.")
                );
    }

    @Bean
    public WebMvcConfigurer corsConfig(){
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry){
                registry.addMapping("/**") // Aplica a todas as rotas
                        .allowedOrigins("http://localhost:3000") // Domínio do seu Frontend
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
