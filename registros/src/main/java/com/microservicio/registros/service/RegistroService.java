package com.microservicio.registros.service;
import com.microservicio.registros.model.Registro;
import com.microservicio.registros.repository.RegistroRepository;
import com.microservicio.registros.utils.SequenceGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RegistroService {
    @Autowired
    private RegistroRepository registroRepository;
    
    @Autowired
    private SequenceGenerator sequenceGenerator;
    
    public boolean hasMemberReceivedIncentive(String memberNumber, String memberCI, String activityId) {
        if (memberNumber != null && !memberNumber.isEmpty()) {
            return registroRepository.existsByMemberNumberAndActivityId(memberNumber, activityId);
        }
        else if (memberCI != null && !memberCI.isEmpty()) {
            return registroRepository.existsByMemberCIAndActivityId(memberCI, activityId);
        }
        return false;
    }
    @Transactional
    public Registro registerDelivery(Registro registro, String clientIP) {
        boolean hasReceived = hasMemberReceivedIncentive(
            registro.getMemberNumber(), 
            registro.getMemberCI(), 
            registro.getActivityId()
        );
        
        if (hasReceived) {
            throw new IllegalStateException("El socio ya recibió un incentivo para esta actividad");
        }
        
        String registrationNumber = sequenceGenerator.getNextRegistrationNumber(registro.getActivityId());
        registro.setRegistrationNumber(registrationNumber);
        registro.setDeliveryDate(LocalDate.now());
        registro.setDeliveryTime(LocalTime.now());
        return registroRepository.save(registro);
    }
    
    public String getNextRegistrationNumber(String activityId) {
        return sequenceGenerator.peekNextRegistrationNumber(activityId);
    }
    
    public List<Registro> getAllDeliveries() {
        return registroRepository.findAll();
    }
    
    public Optional<Registro> getDeliveryByRegistrationNumber(String registrationNumber) {
        return registroRepository.findByRegistrationNumber(registrationNumber);
    }
    
    public List<Registro> getDeliveriesByDate(LocalDate date) {
        return registroRepository.findByDeliveryDate(date);
    }
    
    public List<Registro> getDeliveriesByDateRange(LocalDate startDate, LocalDate endDate) {
        return registroRepository.findByDeliveryDateBetween(startDate, endDate);
    }

    public List<Registro> getDeliveriesByActivity(String activityId) {
        return registroRepository.findByActivityId(activityId);
    }
    
    public long countDeliveriesByActivity(String activityId) {
        return registroRepository.countByActivityId(activityId);
    }
    
    public List<Map<String, Object>> getActivitiesStats() {
        List<Registro> allRegistros = registroRepository.findAll();
        Map<String, List<Registro>> registrosByActivity = allRegistros.stream()
                .collect(Collectors.groupingBy(Registro::getActivityId));
        List<Map<String, Object>> stats = new ArrayList<>();
        
        for (Map.Entry<String, List<Registro>> entry : registrosByActivity.entrySet()) {
            String activityId = entry.getKey();
            List<Registro> registros = entry.getValue();
            
            String activityName = registros.isEmpty() ? "Desconocido" : registros.get(0).getActivityName();
            
            Map<String, Object> activityStats = new HashMap<>();
            activityStats.put("activityId", activityId);
            activityStats.put("activityName", activityName);
            activityStats.put("totalEntregas", registros.size());
            
            Map<LocalDate, Long> entregarPorFecha = registros.stream()
                    .collect(Collectors.groupingBy(Registro::getDeliveryDate, Collectors.counting()));
            activityStats.put("entregasPorFecha", entregarPorFecha);
            
            stats.add(activityStats);
        }
        return stats;
    }
}