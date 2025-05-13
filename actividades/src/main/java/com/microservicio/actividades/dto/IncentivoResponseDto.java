package com.microservicio.actividades.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncentivoResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private String imagenBase64;
    private String imagenTipo;
    private Integer cantidad;
    private Boolean estado;
}