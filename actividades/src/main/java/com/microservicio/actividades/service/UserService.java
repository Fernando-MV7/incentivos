package com.microservicio.actividades.service;
import lombok.RequiredArgsConstructor;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new SecurityException("No hay autenticación disponible");
        }
        
        Object details = authentication.getDetails();
        if (details instanceof Map) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Long> detailsMap = (Map<String, Long>) details;
                Long userId = detailsMap.get("userId");
                if (userId != null) {
                    return userId;
                }
            } catch (ClassCastException e) {
                throw new SecurityException("Formato de detalles de autenticación incorrecto", e);
            }
        }
        
        throw new SecurityException("No se pudo obtener el ID del usuario");
    }
}