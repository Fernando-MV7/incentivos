package com.microservicio.registros.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "registros_entrega")
public class Registro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "regId")
    private Long id;

    @Column(name = "Nº_registro", length = 5, nullable = false)
    private String registrationNumber;
    
    @Column(name = "nº_socio")
    private String memberNumber;
    
    @Column(name = "ci_socio")
    private String memberCI;
    
    @Column(name = "nombre_socio")
    private String memberName;
    
    @Column(name = "celular")
    private String phoneNumber;
    
    @Column(name = "correo")
    private String email;
    
    @Column(name = "id_incentivo")
    private String incentiveId;
    
    @Column(name = "nombre_incentivo")
    private String incentiveName;
    
    @Column(name = "id_actividad")
    private String activityId;
    
    @Column(name = "nombre_actividad")
    private String activityName;
    
    @Column(name = "id_responsable")
    private String responsibleId;
    
    @Column(name = "nombre_responsable")
    private String responsibleName;
    
    @Column(name = "fecha_entrega")
    private LocalDate deliveryDate;
    
    @Column(name = "hora_entrega")
    private LocalTime deliveryTime;
}