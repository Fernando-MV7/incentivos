package com.microservicio.actividades.controller;
import com.microservicio.actividades.dto.IncentivoRequestDto;
import com.microservicio.actividades.dto.IncentivoResponseDto;
import com.microservicio.actividades.service.IncentivoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/incentivos")
@RequiredArgsConstructor
public class IncentivoController {

    private final IncentivoService incentivoService;

    @GetMapping
    public ResponseEntity<List<IncentivoResponseDto>> getAllIncentivos() {
        return ResponseEntity.ok(incentivoService.getAllIncentivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncentivoResponseDto> getIncentivoById(@PathVariable Long id) {
        return ResponseEntity.ok(incentivoService.getIncentivoById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncentivoResponseDto> createIncentivo(
            @RequestPart("incentivo") @Valid IncentivoRequestDto requestDto,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen) {
        IncentivoResponseDto createdIncentivo = incentivoService.createIncentivo(requestDto, imagen);
        return new ResponseEntity<>(createdIncentivo, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncentivoResponseDto> updateIncentivo(
            @PathVariable Long id,
            @RequestPart("incentivo") @Valid IncentivoRequestDto requestDto,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen) {
        return ResponseEntity.ok(incentivoService.updateIncentivo(id, requestDto, imagen));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteIncentivo(@PathVariable Long id) {
        incentivoService.deleteIncentivo(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncentivoResponseDto> disableIncentivo(@PathVariable Long id) {
        return ResponseEntity.ok(incentivoService.disableIncentivo(id));
    }
    
    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncentivoResponseDto> enableIncentivo(@PathVariable Long id) {
        return ResponseEntity.ok(incentivoService.enableIncentivo(id));
    }

    @GetMapping("/{id}/imagen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getIncentivoImagen(@PathVariable Long id) {
        return incentivoService.getIncentivoImagen(id);
    }

    @PatchMapping("/{id}/decrementar")
    public ResponseEntity<IncentivoResponseDto> decrementarIncentivo(@PathVariable Long id) {
        return ResponseEntity.ok(incentivoService.decrementarIncentivo(id));
    }
}