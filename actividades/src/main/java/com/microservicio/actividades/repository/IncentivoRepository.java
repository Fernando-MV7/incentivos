package com.microservicio.actividades.repository;
import com.microservicio.actividades.model.Incentivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncentivoRepository extends JpaRepository<Incentivo, Long> {
}