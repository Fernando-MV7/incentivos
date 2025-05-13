package com.microservicio.actividades.service;
import com.microservicio.actividades.dto.ActividadRequestDto;
import com.microservicio.actividades.dto.ActividadResponseDto;
import com.microservicio.actividades.dto.IncentivoResponseDto;
import com.microservicio.actividades.model.Actividad;
import com.microservicio.actividades.model.Incentivo;
import com.microservicio.actividades.repository.ActividadRepository;
import com.microservicio.actividades.repository.IncentivoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final IncentivoRepository incentivoRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ActividadResponseDto> getAllActividades() {
        return actividadRepository.findAllWithIncentivos().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActividadResponseDto getActividadById(Long id) {
        Actividad actividad = actividadRepository.findByIdWithIncentivos(id)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada con ID: " + id));
        return mapToDto(actividad);
    }

    @Transactional
    public ActividadResponseDto createActividad(ActividadRequestDto requestDto) {
        Long userId = userService.getCurrentUserId();
        
        Actividad actividad = mapToEntity(requestDto);
        actividad.setUserId(userId);
        actividad.setEstado(true);
        actividad.setFecha(LocalDate.now());
        actividad.setHora(LocalTime.now());

        if (requestDto.getIncentivosIds() != null && !requestDto.getIncentivosIds().isEmpty()) {
            for (Long incentivoId : requestDto.getIncentivosIds()) {
                Incentivo incentivo = incentivoRepository.findById(incentivoId)
                        .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + incentivoId));
                actividad.addIncentivo(incentivo);
            }
        }
        
        Actividad savedActividad = actividadRepository.save(actividad);
        return mapToDto(savedActividad);
    }

    @Transactional
    public ActividadResponseDto updateActividad(Long id, ActividadRequestDto requestDto) {
        Actividad existingActividad = actividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada con ID: " + id));
        existingActividad.setNombre(requestDto.getNombre());
        existingActividad.setDescripcion(requestDto.getDescripcion());
        
        if (requestDto.getIncentivosIds() != null) {
            existingActividad.getIncentivos().clear();
            
            for (Long incentivoId : requestDto.getIncentivosIds()) {
                Incentivo incentivo = incentivoRepository.findById(incentivoId)
                        .orElseThrow(() -> new RuntimeException("Incentivo no encontrado con ID: " + incentivoId));
                existingActividad.addIncentivo(incentivo);
            }
        }
        
        Actividad updatedActividad = actividadRepository.save(existingActividad);
        return mapToDto(updatedActividad);
    }

    @Transactional
    public void deleteActividad(Long id) {
        if (!actividadRepository.existsById(id)) {
            throw new RuntimeException("Actividad no encontrada con ID: " + id);
        }
        actividadRepository.deleteById(id);
    }
    
    @Transactional
    public ActividadResponseDto disableActividad(Long id) {
        Actividad actividad = actividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada con ID: " + id));
        actividad.setEstado(false);
        Actividad updatedActividad = actividadRepository.save(actividad);
        return mapToDto(updatedActividad);
    }
    
    @Transactional
    public ActividadResponseDto enableActividad(Long id) {
        Actividad actividad = actividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada con ID: " + id));
        actividad.setEstado(true);
        Actividad updatedActividad = actividadRepository.save(actividad);
        return mapToDto(updatedActividad);
    }

    private Actividad mapToEntity(ActividadRequestDto requestDto) {
        return Actividad.builder()
                .nombre(requestDto.getNombre())
                .descripcion(requestDto.getDescripcion())
                .incentivos(new HashSet<>())
                .build();
    }
    
    public List<ActividadResponseDto> getActividadesByCurrentUser() {
        Long userId = userService.getCurrentUserId();
        return actividadRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    private ActividadResponseDto mapToDto(Actividad actividad) {
        Set<IncentivoResponseDto> incentivosDto = actividad.getIncentivos().stream()
                .map(incentivo -> {
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
                })
                .collect(Collectors.toSet());
        
        return ActividadResponseDto.builder()
                .id(actividad.getId())
                .nombre(actividad.getNombre())
                .descripcion(actividad.getDescripcion())
                .fecha(actividad.getFecha())
                .hora(actividad.getHora())
                .estado(actividad.getEstado())
                .userId(actividad.getUserId())
                .incentivos(incentivosDto)
                .build();
    }
}