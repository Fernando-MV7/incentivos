package com.microservicio.sociosexcel.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.microservicio.sociosexcel.model.Socio;
import com.microservicio.sociosexcel.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelService {
    
    private final SocioRepository socioRepository;

    public List<Socio> procesarExcel(MultipartFile archivo, Long idActividad) {
        if (archivo == null || archivo.isEmpty()) {
            throw new RuntimeException("El archivo está vacío o es nulo");
        }
        try {
            return parseExcelFile(archivo.getInputStream(), idActividad);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo procesar el archivo Excel: " + e.getMessage());
        }
    }

    private List<Socio> parseExcelFile(InputStream inputStream, Long idActividad) throws IOException {
        List<Socio> socios = new ArrayList<>();
        List<String> sociosDuplicadosEnBD = new ArrayList<>();
        Map<String, List<Integer>> sociosDuplicadosEnExcel = new HashMap<>();
        Set<String> numerosSociosProcesados = new HashSet<>();
        
        int rowCount = 0;
        int duplicadosEnBDCount = 0;
        int duplicadosEnExcelCount = 0;
    
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (rows.hasNext()) {
                rows.next();
                rowCount++;
            }

            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowCount++;

                if (isEmptyRow(currentRow)) {
                    continue;
                }
    
                try {
                    Cell numeroSocioCell = currentRow.getCell(0, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    String numeroSocio = getCellValueAsString(numeroSocioCell);
                    if (numeroSocio == null || numeroSocio.trim().isEmpty()) {
                        continue;
                    }
                    
                    if (numerosSociosProcesados.contains(numeroSocio)) {
                        sociosDuplicadosEnExcel.computeIfAbsent(numeroSocio, k -> new ArrayList<>())
                                             .add(rowCount);
                        duplicadosEnExcelCount++;
                    } else {
                        numerosSociosProcesados.add(numeroSocio);
                    }
                    
                } catch (Exception e) {}
            }

            if (!sociosDuplicadosEnExcel.isEmpty()) {
                StringBuilder errorMsg = new StringBuilder();
                errorMsg.append("Se encontraron números de socios duplicados en el archivo Excel: \n");
                
                for (Map.Entry<String, List<Integer>> entry : sociosDuplicadosEnExcel.entrySet()) {
                    String numeroSocio = entry.getKey();
                    List<Integer> filas = entry.getValue();
                    errorMsg.append("Número de socio '").append(numeroSocio)
                           .append("' duplicado en las filas: ");
                    
                    for (int i = 0; i < filas.size(); i++) {
                        errorMsg.append(filas.get(i));
                        if (i < filas.size() - 1) {
                            errorMsg.append(", ");
                        }
                    }
                    errorMsg.append("\n");
                }
                throw new RuntimeException(errorMsg.toString());
            }
            
            rows = sheet.iterator();
            rowCount = 0;

            if (rows.hasNext()) {
                rows.next();
                rowCount++;
            }

            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowCount++;
                
                if (isEmptyRow(currentRow)) {
                    continue;
                }
    
                try {
                    Cell numeroSocioCell = currentRow.getCell(0, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    String numeroSocio = getCellValueAsString(numeroSocioCell);
                    if (numeroSocio == null || numeroSocio.trim().isEmpty()) {
                        continue;
                    }

                    if (socioRepository.existsByNumeroSocioAndIdActividad(numeroSocio, idActividad)) {
                        sociosDuplicadosEnBD.add(numeroSocio);
                        duplicadosEnBDCount++;
                        continue;
                    }
                    
                    Socio socio = new Socio();
                    socio.setNumeroSocio(numeroSocio);
                    Cell nombresCell = currentRow.getCell(1, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    String nombres = getCellValueAsString(nombresCell);
                    socio.setNombres(nombres);
                    socio.setHabilitado(true);
                    socio.setEntregado(false);
                    socio.setIdActividad(idActividad);
                    socios.add(socio);
                } catch (Exception e) {}
            }
        }
        return socios;
    }

    private boolean isEmptyRow(Row row) {
        if (row == null) {
            return true;
        }
        if (row.getFirstCellNum() < 0) {
            return true;
        }

        for (int cellNum = row.getFirstCellNum(); cellNum < Math.min(2, row.getLastCellNum()); cellNum++) {
            Cell cell = row.getCell(cellNum, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValueAsString(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return "";
        }
        
        try {
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue().trim();
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getLocalDateTimeCellValue().toString();
                    } else {
                        double numVal = cell.getNumericCellValue();
                        if (numVal == Math.floor(numVal)) {
                            return String.valueOf((long) numVal);
                        } else {
                            return String.valueOf(numVal);
                        }
                    }
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    try {
                        switch (cell.getCachedFormulaResultType()) {
                            case STRING:
                                return cell.getStringCellValue().trim();
                            case NUMERIC:
                                if (DateUtil.isCellDateFormatted(cell)) {
                                    return cell.getLocalDateTimeCellValue().toString();
                                } else {
                                    double numVal = cell.getNumericCellValue();
                                    if (numVal == Math.floor(numVal)) {
                                        return String.valueOf((long) numVal);
                                    } else {
                                        return String.valueOf(numVal);
                                    }
                                }
                            case BOOLEAN:
                                return String.valueOf(cell.getBooleanCellValue());
                            default:
                                return "";
                        }
                    } catch (Exception e) {
                        return "";
                    }
                default:
                    return "";
            }
        } catch (Exception e) {
            return "";
        }
    }
}