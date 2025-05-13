package com.microservicio.registros.controller;
import com.microservicio.registros.model.Registro;
import com.microservicio.registros.service.RegistroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/registros")
public class RegistroController {
    @Autowired
    private RegistroService registroService;
    
    @PostMapping
    public ResponseEntity<Registro> registerDelivery(@RequestBody Registro registro, HttpServletRequest request) {
    
        String clientIP = request.getRemoteAddr();
    
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            clientIP = forwardedFor.split(",")[0].trim();
        }
    
        if (clientIP != null) {
            if (clientIP.contains(":")) {
                if (clientIP.contains("::ffff:")) {
                    clientIP = clientIP.substring(clientIP.lastIndexOf(":") + 1);
                } else {
                    String xRealIP = request.getHeader("X-Real-IP");
                    if (xRealIP != null && !xRealIP.contains(":")) {
                        clientIP = xRealIP;
                    } else {
                        clientIP = "0.0.0.0";
                    }
                }
            }
        }

        Registro registeredDelivery = registroService.registerDelivery(registro, clientIP);
        return new ResponseEntity<>(registeredDelivery, HttpStatus.CREATED);
    }

    @GetMapping("/check-member")
    public ResponseEntity<Map<String, Object>> checkMemberIncentive(
            @RequestParam(required = false) String memberNumber,
            @RequestParam(required = false) String memberCI,
            @RequestParam String activityId) {
        
        if ((memberNumber == null || memberNumber.isEmpty()) && (memberCI == null || memberCI.isEmpty())) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Se requiere al menos el número de socio o el CI");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
        
        boolean hasReceived = registroService.hasMemberReceivedIncentive(memberNumber, memberCI, activityId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasReceived", hasReceived);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @GetMapping("/next-registration-number")
    public ResponseEntity<Map<String, String>> getNextRegistrationNumber(@RequestParam String activityId) {
        String nextRegistrationNumber = registroService.getNextRegistrationNumber(activityId);
        Map<String, String> response = new HashMap<>();
        response.put("nextRegistrationNumber", nextRegistrationNumber);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @GetMapping
    public ResponseEntity<List<Registro>> getAllDeliveries() {
        List<Registro> registros = registroService.getAllDeliveries();
        return new ResponseEntity<>(registros, HttpStatus.OK);
    }
    
    @GetMapping("/{registrationNumber}")
    public ResponseEntity<Registro> getDeliveryByRegistrationNumber(@PathVariable String registrationNumber) {
        return registroService.getDeliveryByRegistrationNumber(registrationNumber)
                .map(registro -> new ResponseEntity<>(registro, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/reports/by-date")
    public ResponseEntity<List<Registro>> getDeliveriesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Registro> registros = registroService.getDeliveriesByDate(date);
        return new ResponseEntity<>(registros, HttpStatus.OK);
    }
    
    @GetMapping("/reports/by-date-range")
    public ResponseEntity<List<Registro>> getDeliveriesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Registro> registros = registroService.getDeliveriesByDateRange(startDate, endDate);
        return new ResponseEntity<>(registros, HttpStatus.OK);
    }

    @GetMapping("/comprobante/{registrationNumber}")
    public ResponseEntity<Registro> getComprobanteData(@PathVariable String registrationNumber) {
        return registroService.getDeliveryByRegistrationNumber(registrationNumber)
                .map(registro -> new ResponseEntity<>(registro, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @GetMapping("/by-activity/{activityId}")
    public ResponseEntity<List<Registro>> getDeliveriesByActivity(@PathVariable String activityId) {
        List<Registro> registros = registroService.getDeliveriesByActivity(activityId);
        return new ResponseEntity<>(registros, HttpStatus.OK);
    }
    
    @GetMapping("/count-activity/{activityId}")
    public ResponseEntity<Map<String, Object>> countDeliveriesByActivity(@PathVariable String activityId) {
        long count = registroService.countDeliveriesByActivity(activityId);
        Map<String, Object> response = new HashMap<>();
        response.put("activityId", activityId);
        response.put("count", count);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @GetMapping("/activities-stats")
    public ResponseEntity<List<Map<String, Object>>> getActivitiesStats() {
        List<Map<String, Object>> stats = registroService.getActivitiesStats();
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}