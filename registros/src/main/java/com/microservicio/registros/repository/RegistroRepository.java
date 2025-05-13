package com.microservicio.registros.repository;

import com.microservicio.registros.model.Registro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroRepository extends JpaRepository<Registro, Long> {
     Optional<Registro> findByRegistrationNumber(String registrationNumber);
     List<Registro> findByDeliveryDate(LocalDate date);
     List<Registro> findByMemberCI(String memberCI);
     List<Registro> findByIncentiveId(String incentiveId);
     List<Registro> findByDeliveryDateBetween(LocalDate startDate, LocalDate endDate);
     boolean existsByMemberNumberAndActivityId(String memberNumber, String activityId);
     boolean existsByMemberCIAndActivityId(String memberCI, String activityId);
     List<Registro> findByActivityId(String activityId);
     long countByActivityId(String activityId);
}