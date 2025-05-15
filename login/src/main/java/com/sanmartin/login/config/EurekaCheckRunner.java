package com.sanmartin.login.config;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class EurekaCheckRunner implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        String eurekaServerUrl = "http://server:8761/eureka/apps";
        RestTemplate restTemplate = new RestTemplate();
        boolean eurekaUp = false;

        for (int i = 0; i < 12; i++) { 
            try {
                restTemplate.getForObject(eurekaServerUrl, String.class);
                eurekaUp = true;
                break;
            } catch (Exception e) {
                System.out.println("Esperando que Eureka esté disponible...");
                Thread.sleep(5000); 
            }
        }

        if (!eurekaUp) {
            throw new RuntimeException("El servidor  no está disponible. Abortando el microservicio.");
        }

        System.out.println("Eureka está disponible. Continuando con el inicio del microservicio...");
    }
}

