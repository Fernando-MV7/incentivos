package com.microservicio.actividades.controller;
import com.microservicio.actividades.dto.ActividadRequestDto;
import com.microservicio.actividades.dto.ActividadResponseDto;
import com.microservicio.actividades.service.ActividadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
public class ActividadController {

    private final ActividadService actividadService;

    @GetMapping
    public ResponseEntity<List<ActividadResponseDto>> getAllActividades() {
        return ResponseEntity.ok(actividadService.getAllActividades());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActividadResponseDto> getActividadById(@PathVariable Long id) {
        return ResponseEntity.ok(actividadService.getActividadById(id));
    }
    
    @GetMapping("/mis-actividades")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ActividadResponseDto>> getActividadesByCurrentUser() {
        return ResponseEntity.ok(actividadService.getActividadesByCurrentUser());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActividadResponseDto> createActividad(@Valid @RequestBody ActividadRequestDto requestDto) {
        ActividadResponseDto createdActividad = actividadService.createActividad(requestDto);
        return new ResponseEntity<>(createdActividad, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActividadResponseDto> updateActividad(
            @PathVariable Long id, 
            @Valid @RequestBody ActividadRequestDto requestDto) {
        return ResponseEntity.ok(actividadService.updateActividad(id, requestDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteActividad(@PathVariable Long id) {
        actividadService.deleteActividad(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActividadResponseDto> disableActividad(@PathVariable Long id) {
        return ResponseEntity.ok(actividadService.disableActividad(id));
    }
    
    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActividadResponseDto> enableActividad(@PathVariable Long id) {
        return ResponseEntity.ok(actividadService.enableActividad(id));
    }
}
