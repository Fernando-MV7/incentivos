package com.microservicio.sociosexcel.controller;

import com.microservicio.sociosexcel.dto.ResponseDTO;
import com.microservicio.sociosexcel.model.Socio;
import com.microservicio.sociosexcel.service.SocioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
@Slf4j
public class SocioController {

    private final SocioService socioService;

    @PostMapping("/upload")
    public ResponseEntity<ResponseDTO> cargarExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("idActividad") Long idActividad) {
        try {

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(ResponseDTO.error("Por favor seleccione un archivo"));
            }

            String fileName = file.getOriginalFilename();
            if (fileName != null && !(fileName.endsWith(".xlsx") || fileName.endsWith(".xls"))) {
                return ResponseEntity.badRequest().body(ResponseDTO.error("Por favor suba un archivo Excel válido"));
            }

            List<Socio> sociosProcesados = socioService.procesarYGuardarDesdeExcel(file, idActividad);

            if (sociosProcesados.isEmpty()) {
                return ResponseEntity.ok(
                        ResponseDTO.exito(
                                "No se insertaron nuevos socios. Es posible que todos ya existieran en esta actividad.",
                                sociosProcesados));
            } else {
                return ResponseEntity.ok(
                        ResponseDTO.exito(
                                "Archivo procesado correctamente. Socios procesados: " + sociosProcesados.size(),
                                sociosProcesados));
            }
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("números de socios duplicados en el archivo Excel")) {
                return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
            } else {
                return ResponseEntity.status(500)
                        .body(ResponseDTO.error("Error al procesar el archivo: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                    ResponseDTO.error("Error al procesar el archivo: " + e.getMessage() + ". Causa: " + e.getCause()));
        }
    }

    @PostMapping("/nuevo")
    public ResponseEntity<ResponseDTO> crearSocio(@RequestBody Socio socio) {
        try {

            if (socio.getNumeroSocio() == null || socio.getNumeroSocio().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ResponseDTO.error("El número de socio es requerido"));
            }

            if (socioService.existeSocioEnActividad(socio.getNumeroSocio(), socio.getIdActividad())) {
                return ResponseEntity.badRequest().body(ResponseDTO.error("El socio ya existe en esta actividad"));
            }

            if (socio.getHabilitado() == null) {
                socio.setHabilitado(true);
            }
            if (socio.getEntregado() == null) {
                socio.setEntregado(false);
            }

            Socio socioGuardado = socioService.guardarSocio(socio);
            return ResponseEntity.ok(ResponseDTO.exito("Socio creado correctamente", socioGuardado));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al crear el socio: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Socio>> listarSocios() {
        List<Socio> socios = socioService.obtenerTodos();
        return ResponseEntity.ok(socios);
    }

    @DeleteMapping("/{numeroSocio}")
    public ResponseEntity<ResponseDTO> eliminarSocio(
            @PathVariable String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            socioService.eliminarSocio(numeroSocio, idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Socio eliminado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al eliminar el socio: " + e.getMessage()));
        }
    }

    @PatchMapping("/{numeroSocio}/inhabilitar")
    public ResponseEntity<ResponseDTO> inhabilitarSocioPorNumero(
            @PathVariable String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            Socio socioInhabilitado = socioService.inhabilitarSocioPorNumero(numeroSocio, idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Socio inhabilitado correctamente", socioInhabilitado));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ResponseDTO.error(e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al inhabilitar el socio: " + e.getMessage()));
        }
    }

    @PatchMapping("/{numeroSocio}/habilitar")
    public ResponseEntity<ResponseDTO> habilitarSocioPorNumero(
            @PathVariable String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            Socio socioHabilitado = socioService.habilitarSocioPorNumero(numeroSocio, idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Socio habilitado correctamente", socioHabilitado));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ResponseDTO.error(e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al habilitar el socio: " + e.getMessage()));
        }
    }

    @DeleteMapping("/eliminar-multiples")
    public ResponseEntity<ResponseDTO> eliminarMultiplesSocios(@RequestBody List<String> numerosSocios) {
        try {
            if (numerosSocios == null || numerosSocios.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("No se han proporcionado socios para eliminar"));
            }
            int cantidad = socioService.eliminarMultiplesSocios(numerosSocios);
            return ResponseEntity.ok(ResponseDTO.exito("Se eliminaron " + cantidad + " socios correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al eliminar los socios: " + e.getMessage()));
        }
    }

    @GetMapping("/actividad/{idActividad}")
    public ResponseEntity<ResponseDTO> listarPorActividad(@PathVariable Long idActividad) {
        try {
            List<Socio> socios = socioService.obtenerPorIdActividad(idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Socios encontrados", socios));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al buscar socios por actividad: " + e.getMessage()));
        }
    }

    @GetMapping("/verificar-existencia")
    public ResponseEntity<ResponseDTO> verificarExistencia(
            @RequestParam String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            boolean existe = socioService.existeSocioEnActividad(numeroSocio, idActividad);
            if (existe) {
                return ResponseEntity.ok(ResponseDTO.exito("El socio ya existe en esta actividad", true));
            } else {
                return ResponseEntity.ok(ResponseDTO.exito("El socio no existe en esta actividad", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al verificar existencia del socio: " + e.getMessage()));
        }
    }

    @GetMapping("/buscar")
    public ResponseEntity<ResponseDTO> buscarPorNumeroYActividad(
            @RequestParam String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            boolean existe = socioService.existeSocioEnActividad(numeroSocio, idActividad);
            if (!existe) {
                return ResponseEntity.status(404).body(ResponseDTO.error("No se encontró el socio en esta actividad"));
            }

            Optional<Socio> socioOpt = socioService.obtenerPorNumeroYActividad(numeroSocio, idActividad);

            if (socioOpt.isPresent()) {
                Socio socio = socioOpt.get();
                return ResponseEntity.ok(ResponseDTO.exito("Socio encontrado", socio));
            } else {
                return ResponseEntity.status(404).body(ResponseDTO.error("No se encontró el socio"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al buscar socio: " + e.getMessage()));
        }
    }

    @GetMapping("/actividades")
    public ResponseEntity<ResponseDTO> listarActividades() {
        try {
            List<Long> actividades = socioService.obtenerTodasLasActividades();
            return ResponseEntity.ok(ResponseDTO.exito("Actividades obtenidas con éxito", actividades));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al obtener las actividades: " + e.getMessage()));
        }
    }

    @GetMapping("/contar/actividad/{idActividad}")
    public ResponseEntity<ResponseDTO> contarSociosPorActividad(@PathVariable Long idActividad) {
        try {
            Long cantidad = socioService.contarSociosPorActividad(idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Conteo exitoso", cantidad));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al contar socios: " + e.getMessage()));
        }
    }

    @GetMapping("/contar/todas-actividades")
    public ResponseEntity<ResponseDTO> contarSociosPorTodasLasActividades() {
        try {
            Map<Long, Long> conteo = socioService.contarSociosPorTodasLasActividades();
            return ResponseEntity.ok(ResponseDTO.exito("Conteo exitoso para todas las actividades", conteo));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ResponseDTO.error("Error al contar socios: " + e.getMessage()));
        }
    }

    @PatchMapping("/{numeroSocio}/entregar")
    public ResponseEntity<ResponseDTO> marcarEntregado(
            @PathVariable String numeroSocio,
            @RequestParam Long idActividad) {
        try {
            Socio socioEntregado = socioService.marcarEntregado(numeroSocio, idActividad);
            return ResponseEntity.ok(ResponseDTO.exito("Socio marcado como entregado correctamente", socioEntregado));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ResponseDTO.error(e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ResponseDTO.error("Error al marcar socio como entregado: " + e.getMessage()));
        }
    }
}