package com.microservicio.sociosexcel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "excel_socios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Socio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "numero_socio")
    private String numeroSocio;

    @Column(name = "Nombres")
    private String nombres;

    @Column(name = "Habilitado")
    private Boolean habilitado;

    @Column(name = "Entregado")
    private Boolean entregado;

    @Column(name = "cambios_habilitado")
    private Integer cambiosHabilitado;

    @Column(name = "id_actividad")
    private Long idActividad;
}
