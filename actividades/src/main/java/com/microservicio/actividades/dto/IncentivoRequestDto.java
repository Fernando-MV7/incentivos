package com.microservicio.actividades.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncentivoRequestDto {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    private String descripcion;
    private String imagen;
    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 0, message = "La cantidad mínima es 1")
    private Integer cantidad;
}