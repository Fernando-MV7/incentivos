package com.microservicio.sociosexcel.repository;

import com.microservicio.sociosexcel.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {
    Optional<Socio> findByNumeroSocio(String numeroSocio);

    List<Socio> findByIdActividad(Long idActividad);

    @Query("SELECT COUNT(s) > 0 FROM Socio s WHERE s.numeroSocio = :numeroSocio AND s.idActividad = :idActividad")
    boolean existsByNumeroSocioAndIdActividad(@Param("numeroSocio") String numeroSocio,
            @Param("idActividad") Long idActividad);

    void deleteByNumeroSocioIn(List<String> numerosSocios);

    @Query("SELECT COUNT(s) FROM Socio s WHERE s.numeroSocio IN :numerosSocios")
    int countByNumeroSocioIn(@Param("numerosSocios") List<String> numerosSocios);

    Optional<Socio> findByNumeroSocioAndIdActividad(String numeroSocio, Long idActividad);

    @Query("SELECT DISTINCT s.idActividad FROM Socio s")
    List<Long> findDistinctActividades();

    @Query("SELECT COUNT(s) FROM Socio s WHERE s.idActividad = :idActividad")
    Long countByIdActividad(Long idActividad);

    @Query("SELECT s.idActividad, COUNT(s) FROM Socio s GROUP BY s.idActividad")
    List<Object[]> countSociosByActividad();

}
