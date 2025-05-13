package com.microservicio.socios.service;
import com.microservicio.socios.model.AgentData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.sql.Blob;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
public class AgentDataService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private final RowMapper<AgentData> agentRowMapper = (ResultSet rs, int rowNum) -> {
        AgentData agent = new AgentData();
        try {
            agent.setGbagecage(rs.getInt("camcacage"));
        } catch (SQLException e) {
            agent.setGbagecage(null);
        }
        
        agent.setGbagenomb(rs.getString("nombre") != null ? rs.getString("nombre").trim() : null);
        agent.setGbagendid(rs.getString("ci") != null ? rs.getString("ci").trim() : null);
        
        try {
            agent.setFechaExpiracionCI(rs.getDate("fechaExpiracionCI"));
            agent.verificarVigenciaCI();
        } catch (SQLException e) {
            agent.setFechaExpiracionCI(null);
            agent.setCiVigente(false);
        }
        
        try {
            agent.setCelular(rs.getString("celular") != null ? rs.getString("celular").trim() : null);
        } catch (SQLException e) {
            agent.setCelular(null);
        }
        
        try {
            agent.setCorreo(rs.getString("correo") != null ? rs.getString("correo").trim() : null);
        } catch (SQLException e) {
            agent.setCorreo(null);
        }
        
        return agent;
    };
    
    private String buildBaseQuery(Integer idSocio) {
        return "SELECT s.gbagecage AS camcacage, " +
               "TRIM(s.gbagenomb) AS nombre, " +
               "TRIM(s.gbagendid) AS ci, " +
               "d.gbdocfvid AS fechaExpiracionCI, " +
               "TRIM(c.gbdaccelu) AS celular, " +
               "TRIM(c.gbdacmail) AS correo " +
               "FROM gbage s " +
               "LEFT JOIN gbdoc d ON s.gbagecage = d.gbdoccage " +
               "LEFT JOIN gbdac c ON s.gbagecage = c.gbdaccage " +
               "WHERE s.gbagecage != 1 " +
               (idSocio != null ? " AND s.gbagecage = " + idSocio : "");
    }
    
    public Optional<AgentData> getSocioByNumeroAndVerificarCI(Integer numeroSocio) {
        if (numeroSocio == null) {
            return Optional.empty();
        }
        
        String sql = buildBaseQuery(numeroSocio);
        List<AgentData> resultados = jdbcTemplate.query(sql, agentRowMapper);
        
        if (resultados.isEmpty()) {
            return Optional.empty();
        }
        
        AgentData socio = resultados.get(0);        
        return Optional.of(socio);
    }

    public boolean verificarCIVigenteBySocio(Integer numeroSocio) {
        return getSocioByNumeroAndVerificarCI(numeroSocio)
                .map(AgentData::isCiVigente)
                .orElse(false);
    }
    
    public List<AgentData> getAllAgents() {
        String sql = buildBaseQuery(null);
        return jdbcTemplate.query(sql, agentRowMapper);
    }
    
    public List<AgentData> searchAgents(String searchText) {
        try {
            Integer numeroSocio = Integer.parseInt(searchText);
            String sqlExacto = buildBaseQuery(numeroSocio);
            List<AgentData> resultadosExactos = jdbcTemplate.query(sqlExacto, agentRowMapper);
            
            if (!resultadosExactos.isEmpty()) {
                for (AgentData agent : resultadosExactos) {
                    agent.setExactMatch(true);
                }
                return resultadosExactos;
            }
        } catch (NumberFormatException e) {}

        String sqlExacto = buildBaseQuery(null) + 
                           " AND (s.gbagendid = ? OR LOWER(s.gbagenomb) = LOWER(?))";
        
        List<AgentData> resultadosExactos = jdbcTemplate.query(
            sqlExacto, 
            agentRowMapper, 
            searchText, 
            searchText 
        );

        if (!resultadosExactos.isEmpty()) {
            for (AgentData agent : resultadosExactos) {
                agent.setExactMatch(true);
            }
            return resultadosExactos;
        }

        String sqlParcial = buildBaseQuery(null) + 
                           " AND (CAST(s.gbagecage AS VARCHAR(20)) LIKE ? OR s.gbagendid LIKE ? OR LOWER(s.gbagenomb) LIKE LOWER(?))";
        
        String searchPattern = "%" + searchText + "%";
        List<AgentData> resultadosParciales = jdbcTemplate.query(
            sqlParcial, 
            agentRowMapper, 
            searchPattern, searchPattern, searchPattern
        );
        
        return resultadosParciales;
    }
    
    public byte[] getAgentImage(Integer agentId) {
        String sql = "SELECT idimgfirm FROM idimg WHERE idimgcage = ?";
        
        try {
            return jdbcTemplate.query(
                sql, 
                rs -> {
                    if (rs.next()) {
                        try {
                            Blob blob = rs.getBlob("idimgfirm");
                            if (blob != null && blob.length() > 0) {
                                try (InputStream inputStream = blob.getBinaryStream()) {
                                    byte[] result = blobToByteArray(blob, inputStream);
                                    if (result != null && result.length > 0) {
                                        return result;
                                    }
                                } finally {
                                    blob.free();
                                }
                            }
                        } catch (Exception e) {}
                    }
                    return new byte[0];
                },
                agentId
            );
        } catch (Exception e) {
            return new byte[0];
        }
    }
    
    private byte[] blobToByteArray(Blob blob, InputStream inputStream) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            
            return outputStream.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }
}