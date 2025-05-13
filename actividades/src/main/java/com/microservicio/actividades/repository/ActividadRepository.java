package com.microservicio.actividades.repository;
import com.microservicio.actividades.model.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByUserId(Long userId);

    @Query("SELECT a FROM Actividad a LEFT JOIN FETCH a.incentivos WHERE a.id = :id")
    Optional<Actividad> findByIdWithIncentivos(@Param("id") Long id);
    
    @Query("SELECT a FROM Actividad a LEFT JOIN FETCH a.incentivos")
    List<Actividad> findAllWithIncentivos();
}