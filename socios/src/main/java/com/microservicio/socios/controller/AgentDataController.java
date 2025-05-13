package com.microservicio.socios.controller;
import com.microservicio.socios.model.AgentData;
import com.microservicio.socios.service.AgentDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/agents")
public class AgentDataController {
    
    @Autowired
    private AgentDataService agentDataService;
    
    @GetMapping
    public ResponseEntity<List<AgentData>> getAllAgents() {
        List<AgentData> agents = agentDataService.getAllAgents();
        return ResponseEntity.ok(agents);
    }
       
    @GetMapping("/{searchText}")
    public ResponseEntity<?> searchAgents(@PathVariable String searchText) {
        List<AgentData> agents = agentDataService.searchAgents(searchText);
        
        if (agents.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        for (AgentData agent : agents) {
            boolean isExactMatch = 
                (agent.getGbagecage() != null && agent.getGbagecage().toString().equals(searchText)) ||
                (agent.getGbagendid() != null && agent.getGbagendid().equals(searchText)) ||
                (agent.getGbagenomb() != null && agent.getGbagenomb().equalsIgnoreCase(searchText));
            agent.setExactMatch(isExactMatch);
        }
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/image/{agentId}")
    public ResponseEntity<byte[]> getAgentImage(@PathVariable Integer agentId) {
        byte[] imageData = agentDataService.getAgentImage(agentId);
        if (imageData == null || imageData.length == 0) {
            byte[] emptyImage = new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
                                          (byte) 0x80, 0x00, 0x00, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, 
                                          0x00, 0x00, 0x00, 0x21, (byte) 0xF9, 0x04, 0x01, 0x00, 0x00, 
                                          0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 
                                          0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B };
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_GIF)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
                .body(emptyImage);
        }
        
        MediaType mediaType = detectMediaType(imageData);
        return ResponseEntity.ok()
            .contentType(mediaType)
            .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
            .body(imageData);
    }

    private MediaType detectMediaType(byte[] data) {
        if (data == null || data.length < 4) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        
        if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) {
            return MediaType.IMAGE_JPEG;                                
        } else if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50 && 
                   data[2] == (byte) 0x4E && data[3] == (byte) 0x47) {
            return MediaType.IMAGE_PNG;                                   
        } else if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49 && 
                   data[2] == (byte) 0x46) {
            return MediaType.valueOf("image/gif");                            
        } else if ((data[0] == (byte) 0x49 && data[1] == (byte) 0x49) || 
                   (data[0] == (byte) 0x4D && data[1] == (byte) 0x4D)) {
            return MediaType.valueOf("image/tiff");                          
        } else if (data[0] == (byte) 0x42 && data[1] == (byte) 0x4D) {
            return MediaType.valueOf("image/bmp");                           
        } else if (data[0] == (byte) 0x00 && data[1] == (byte) 0x00 && 
                   data[2] == (byte) 0x01 && data[3] == (byte) 0x00) {
            return MediaType.valueOf("image/x-icon");                        
        } else if (data[0] == 'R' && data[1] == 'I' && 
                   data[2] == 'F' && data[3] == 'F') {
            return MediaType.valueOf("image/webp");                         
        } else if (data[0] == '<' && data[1] == '?' && 
                   data[2] == 'x' && data[3] == 'm') {
            return MediaType.valueOf("image/svg+xml");                      
        }
        
        return MediaType.valueOf("image/*");
    }

     @GetMapping("/verificar-ci/{numeroSocio}")
    public ResponseEntity<Boolean> verificarCIVigente(@PathVariable Integer numeroSocio) {
        boolean ciVigente = agentDataService.verificarCIVigenteBySocio(numeroSocio);
        return ResponseEntity.ok(ciVigente);
    }
    
    @GetMapping("/socio/{numeroSocio}")
    public ResponseEntity<AgentData> getSocioByNumero(@PathVariable Integer numeroSocio) {
        Optional<AgentData> socio = agentDataService.getSocioByNumeroAndVerificarCI(numeroSocio);
        return socio.map(agentData -> new ResponseEntity<>(agentData, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}