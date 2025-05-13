package com.microservicio.sociosexcel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseDTO {
    private String mensaje;
    private boolean exito;
    private Object datos;
    
    public static ResponseDTO exito(String mensaje, Object datos) {
        return new ResponseDTO(mensaje, true, datos);
    }
    
    public static ResponseDTO error(String mensaje) {
        return new ResponseDTO(mensaje, false, null);
    }
}