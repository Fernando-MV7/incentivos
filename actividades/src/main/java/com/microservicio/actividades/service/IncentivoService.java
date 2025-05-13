package com.microservicio.actividades.service;
import com.microservicio.actividades.dto.IncentivoRequestDto;
import com.microservicio.actividades.dto.IncentivoResponseDto;
import com.microservicio.actividades.model.Incentivo;
import com.microservicio.actividades.repository.IncentivoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncentivoService {

    private final IncentivoRepository incentivoRepository;

    public List<IncentivoResponseDto> getAllIncentivos() {
        return incentivoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public IncentivoResponseDto getIncentivoById(Long id) {
        Incentivo incentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        return mapToDto(incentivo);
    }

    @Transactional
    public IncentivoResponseDto createIncentivo(IncentivoRequestDto requestDto, MultipartFile imagen) {
        Incentivo incentivo = mapToEntity(requestDto);

        if (incentivo.getCantidad() == 0) {
            incentivo.setEstado(false);
        } else {
            incentivo.setEstado(true);
        }
        
        if (imagen != null && !imagen.isEmpty()) {
            try {
                incentivo.setImagen(imagen.getBytes());
                incentivo.setImagenTipo(imagen.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar la imagen", e);
            }
        }
        
        Incentivo savedIncentivo = incentivoRepository.save(incentivo);
        return mapToDto(savedIncentivo);
    }

    @Transactional
    public IncentivoResponseDto updateIncentivo(Long id, IncentivoRequestDto requestDto, MultipartFile imagen) {
        Incentivo existingIncentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        
        existingIncentivo.setNombre(requestDto.getNombre());
        existingIncentivo.setDescripcion(requestDto.getDescripcion());
        existingIncentivo.setCantidad(requestDto.getCantidad());

        if (existingIncentivo.getCantidad() == 0) {
            existingIncentivo.setEstado(false);
        } else {
            existingIncentivo.setEstado(true);
        }
        
        if (imagen != null && !imagen.isEmpty()) {
            try {
                existingIncentivo.setImagen(imagen.getBytes());
                existingIncentivo.setImagenTipo(imagen.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar la imagen", e);
            }
        }
        
        Incentivo updatedIncentivo = incentivoRepository.save(existingIncentivo);
        return mapToDto(updatedIncentivo);
    }

    public ResponseEntity<?> getIncentivoImagen(Long id) {
        Incentivo incentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        
        if (incentivo.getImagen() == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(incentivo.getImagenTipo()))
                .body(incentivo.getImagen());
    }

    @Transactional
    public void deleteIncentivo(Long id) {
        if (!incentivoRepository.existsById(id)) {
            throw new RuntimeException("Incentivo no encontrado con ID: " + id);
        }
        incentivoRepository.deleteById(id);
    }
    
    @Transactional
    public IncentivoResponseDto disableIncentivo(Long id) {
        Incentivo incentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        
        incentivo.setEstado(false);
        Incentivo updatedIncentivo = incentivoRepository.save(incentivo);
        return mapToDto(updatedIncentivo);
    }
    
    @Transactional
    public IncentivoResponseDto enableIncentivo(Long id) {
        Incentivo incentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        
        incentivo.setEstado(true);
        Incentivo updatedIncentivo = incentivoRepository.save(incentivo);
        return mapToDto(updatedIncentivo);
    }

    private Incentivo mapToEntity(IncentivoRequestDto requestDto) {
        return Incentivo.builder()
                .nombre(requestDto.getNombre())
                .descripcion(requestDto.getDescripcion())
                .cantidad(requestDto.getCantidad())
                .build();
    }
    
    private IncentivoResponseDto mapToDto(Incentivo incentivo) {
        IncentivoResponseDto dto = IncentivoResponseDto.builder()
                .id(incentivo.getId())
                .nombre(incentivo.getNombre())
                .descripcion(incentivo.getDescripcion())
                .cantidad(incentivo.getCantidad())
                .estado(incentivo.getEstado())
                .imagenTipo(incentivo.getImagenTipo())
                .build();
        
        if (incentivo.getImagen() != null) {
            dto.setImagenBase64("data:" + incentivo.getImagenTipo() + ";base64," + 
                               Base64.getEncoder().encodeToString(incentivo.getImagen()));
        }
        
        return dto;
    }

    @Transactional
    public IncentivoResponseDto decrementarIncentivo(Long id) {
        Incentivo incentivo = incentivoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + id));
        
        if (incentivo.getCantidad() <= 0) {
            throw new RuntimeException("No hay suficientes incentivos disponibles para decrementar");
        }
        
        incentivo.setCantidad(incentivo.getCantidad() - 1);
        
        // Si la cantidad llega a cero, deshabilitamos el incentivo
        if (incentivo.getCantidad() == 0) {
            incentivo.setEstado(false);
        }
        
        Incentivo updatedIncentivo = incentivoRepository.save(incentivo);
        return mapToDto(updatedIncentivo);
    }
}
