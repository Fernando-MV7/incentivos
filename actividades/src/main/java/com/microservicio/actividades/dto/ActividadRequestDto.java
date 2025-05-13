package com.microservicio.actividades.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActividadRequestDto {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    private String descripcion;
    private Set<Long> incentivosIds; 
}