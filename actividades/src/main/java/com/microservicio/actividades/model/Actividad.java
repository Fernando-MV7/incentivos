package com.microservicio.actividades.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "actividades")
public class Actividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "actid")
    private Long id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "estado", nullable = false)
    private Boolean estado;

    @Column(name = "usrid", nullable = false)
    private Long userId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "actividad_incentivo",
        joinColumns = @JoinColumn(name = "actid"),
        inverseJoinColumns = @JoinColumn(name = "incid")
    )
    
    private Set<Incentivo> incentivos = new HashSet<>();
    
    public void addIncentivo(Incentivo incentivo) {
        this.incentivos.add(incentivo);
        incentivo.getActividades().add(this);
    }
    
    public void removeIncentivo(Incentivo incentivo) {
        this.incentivos.remove(incentivo);
        incentivo.getActividades().remove(this);
    }
}
