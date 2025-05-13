package com.microservicio.socios.model;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Date;

public class AgentData {
    
    private String nombre;
    private String CI;
    private Integer Nsocio;
    private Date fechaExpiracionCI;
    private String celular;
    private String correo;
    private boolean exactMatch;
    private boolean ciVigente;  
    
    public AgentData() {
    }
    
    public AgentData(String nombre, Integer Nsocio, String CI, 
                     Date fechaExpiracionCI, String celular, String correo) {
        this.nombre = nombre;
        this.CI = CI;
        this.Nsocio = Nsocio;
        this.fechaExpiracionCI = fechaExpiracionCI;
        this.celular = celular;
        this.correo = correo;
        this.verificarVigenciaCI();
    }

    public boolean verificarVigenciaCI() {
        Date fechaActual = new Date(); 
        
        if (fechaExpiracionCI != null) {
            this.ciVigente = fechaExpiracionCI.after(fechaActual);
        } else {
            this.ciVigente = false;
        }
        return this.ciVigente;
    }
    
    @JsonProperty("CIVigente")
    public boolean isCiVigente() {
        return ciVigente;
    }
    
    public void setCiVigente(boolean ciVigente) {
        this.ciVigente = ciVigente;
    }
    
    public boolean isExactMatch() {
        return exactMatch;
    }
    
    public void setExactMatch(boolean exactMatch) {
        this.exactMatch = exactMatch;
    }
    
    @JsonProperty("Nombre")
    public String getGbagenomb() {
        return nombre;
    }
    
    public void setGbagenomb(String gbagenomb) {
        this.nombre = gbagenomb;
    }
    
    @JsonProperty("Nsocio")
    public Integer getGbagecage() {
        return Nsocio;
    }
    
    public void setGbagecage(Integer gbagecage) {
        this.Nsocio = gbagecage;
    }
    
    @JsonProperty("CI")
    public String getGbagendid() {
        return CI;
    }
    
    public void setGbagendid(String gbagendid) {
        this.CI = gbagendid;
    }
    
    @JsonProperty("FechaExpiracionCI")
    public Date getFechaExpiracionCI() {
        return fechaExpiracionCI;
    }
    
    public void setFechaExpiracionCI(Date fechaExpiracionCI) {
        this.fechaExpiracionCI = fechaExpiracionCI;
        this.verificarVigenciaCI(); 
    }
    
    @JsonProperty("Celular")
    public String getCelular() {
        return celular;
    }
    
    public void setCelular(String celular) {
        this.celular = celular;
    }
    
    @JsonProperty("Correo")
    public String getCorreo() {
        return correo;
    }
    
    public void setCorreo(String correo) {
        this.correo = correo;
    }
}