package com.microservicio.sociosexcel.service;

import com.microservicio.sociosexcel.model.Socio;
import com.microservicio.sociosexcel.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@Slf4j
public class SocioService {

    private final SocioRepository socioRepository;
    private final ExcelService excelService;

    @Transactional
    public List<Socio> procesarYGuardarDesdeExcel(MultipartFile archivo, Long idActividad) {
        List<Socio> socios = excelService.procesarExcel(archivo, idActividad);
        if (socios.isEmpty()) {
            return new ArrayList<>();
        }

        return socioRepository.saveAll(socios);
    }

    @Transactional
    public List<Socio> guardarSocios(List<Socio> socios) {
        List<Socio> sociosAGuardar = new ArrayList<>();
        int duplicados = 0;

        for (Socio socio : socios) {
            if (socio.getNumeroSocio() == null || socio.getNumeroSocio().trim().isEmpty()) {
                continue;
            }
            boolean existeEnActividad = socioRepository.existsByNumeroSocioAndIdActividad(
                    socio.getNumeroSocio(), socio.getIdActividad());

            if (existeEnActividad) {
                duplicados++;
                continue;
            }

            Optional<Socio> socioExistente = socioRepository.findByNumeroSocio(socio.getNumeroSocio());
            if (socioExistente.isPresent()) {
                Socio nuevoSocio = new Socio();
                nuevoSocio.setNumeroSocio(socio.getNumeroSocio());
                nuevoSocio.setNombres(socio.getNombres());
                nuevoSocio.setHabilitado(true);
                nuevoSocio.setEntregado(false);
                nuevoSocio.setIdActividad(socio.getIdActividad());
                sociosAGuardar.add(nuevoSocio);
            } else {
                socio.setHabilitado(true);
                socio.setEntregado(false);
                sociosAGuardar.add(socio);
            }
        }

        if (sociosAGuardar.isEmpty()) {
            return new ArrayList<>();
        }

        return socioRepository.saveAll(sociosAGuardar);
    }

    @Transactional
    public Socio guardarSocio(Socio socio) {
        if (existeSocioEnActividad(socio.getNumeroSocio(), socio.getIdActividad())) {
            throw new RuntimeException("El socio ya existe en esta actividad");
        }
        return socioRepository.save(socio);
    }

    public boolean existeSocioEnActividad(String numeroSocio, Long idActividad) {
        if (numeroSocio == null || idActividad == null) {
            return false;
        }
        return socioRepository.existsByNumeroSocioAndIdActividad(numeroSocio, idActividad);
    }

    public List<Socio> obtenerTodos() {
        return socioRepository.findAll();
    }

    public Optional<Socio> obtenerPorNumero(String numeroSocio) {
        return socioRepository.findByNumeroSocio(numeroSocio);
    }

    @Transactional
    public Socio marcarEntregado(String numeroSocio, Long idActividad) {
        Optional<Socio> socioOptional = socioRepository.findByNumeroSocioAndIdActividad(numeroSocio, idActividad);
        if (socioOptional.isPresent()) {
            Socio socio = socioOptional.get();
            if (socio.getEntregado() == null || !socio.getEntregado()) {
                socio.setEntregado(true);
                return socioRepository.save(socio);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El socio con número " + numeroSocio + " ya fue marcado como entregado.");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Socio con número " + numeroSocio + " no encontrado en la actividad " + idActividad + ".");
        }
    }

    public Socio inhabilitarSocioPorNumero(String numeroSocio, Long idActividad) {
        Optional<Socio> socioOptional = socioRepository.findByNumeroSocioAndIdActividad(numeroSocio, idActividad);
        if (socioOptional.isPresent()) {
            Socio socio = socioOptional.get();

            if (socio.getCambiosHabilitado() == null) {
                socio.setCambiosHabilitado(0);
            }

            if (socio.getCambiosHabilitado() >= 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El socio con número " + numeroSocio + " ya no puede cambiar su estado de habilitado.");
            }

            if (socio.getHabilitado()) {
                socio.setHabilitado(false);
                socio.setCambiosHabilitado(socio.getCambiosHabilitado() + 1);
                return socioRepository.save(socio);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El socio con número " + numeroSocio + " en la actividad " + idActividad
                                + " ya está inhabilitado.");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Socio con número " + numeroSocio + " no encontrado en la actividad " + idActividad + ".");
        }
    }

    public Socio habilitarSocioPorNumero(String numeroSocio, Long idActividad) {
        Optional<Socio> socioOptional = socioRepository.findByNumeroSocioAndIdActividad(numeroSocio, idActividad);
        if (socioOptional.isPresent()) {
            Socio socio = socioOptional.get();

            if (socio.getCambiosHabilitado() == null) {
                socio.setCambiosHabilitado(0);
            }

            if (socio.getCambiosHabilitado() >= 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El socio con número " + numeroSocio + " ya no puede cambiar su estado de habilitado.");
            }

            if (!socio.getHabilitado()) {
                socio.setHabilitado(true);
                socio.setCambiosHabilitado(socio.getCambiosHabilitado() + 1);
                return socioRepository.save(socio);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El socio con número " + numeroSocio + " en la actividad " + idActividad
                                + " ya está habilitado.");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Socio con número " + numeroSocio + " no encontrado en la actividad " + idActividad + ".");
        }
    }

    @Transactional
    public void eliminarSocio(String numeroSocio, Long idActividad) {
        Optional<Socio> socioOpt = socioRepository.findByNumeroSocioAndIdActividad(numeroSocio, idActividad);
        if (!socioOpt.isPresent()) {
            throw new RuntimeException(
                    "No se encontró el socio con número: " + numeroSocio + " en la actividad: " + idActividad);
        }
        socioRepository.delete(socioOpt.get());
    }

    @Transactional
    public int eliminarMultiplesSocios(List<String> numerosSocios) {
        if (numerosSocios == null || numerosSocios.isEmpty()) {
            return 0;
        }
        int cantidadAEliminar = socioRepository.countByNumeroSocioIn(numerosSocios);
        socioRepository.deleteByNumeroSocioIn(numerosSocios);
        return cantidadAEliminar;
    }

    public List<Socio> obtenerPorIdActividad(Long idActividad) {
        return socioRepository.findByIdActividad(idActividad);
    }

    public Optional<Socio> obtenerPorNumeroYActividad(String numeroSocio, Long idActividad) {
        if (numeroSocio == null || idActividad == null) {
            return Optional.empty();
        }
        return socioRepository.findByNumeroSocioAndIdActividad(numeroSocio, idActividad);
    }

    @Transactional(readOnly = true)
    public List<Long> obtenerTodasLasActividades() {
        return socioRepository.findDistinctActividades();
    }

    @Transactional(readOnly = true)
    public Long contarSociosPorActividad(Long idActividad) {
        return socioRepository.countByIdActividad(idActividad);
    }

    @Transactional(readOnly = true)
    public Map<Long, Long> contarSociosPorTodasLasActividades() {
        List<Object[]> resultados = socioRepository.countSociosByActividad();

        Map<Long, Long> conteoPorActividad = new HashMap<>();
        for (Object[] resultado : resultados) {
            Long idActividad = (Long) resultado[0];
            Long cantidad = (Long) resultado[1];
            conteoPorActividad.put(idActividad, cantidad);
        }
        return conteoPorActividad;
    }
}