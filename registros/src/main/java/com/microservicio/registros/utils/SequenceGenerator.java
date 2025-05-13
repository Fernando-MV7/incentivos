package com.microservicio.registros.utils;

import org.springframework.stereotype.Component;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.NoResultException;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SequenceGenerator {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Transactional
    public String getNextRegistrationNumber(String activityId) {
        try {
            Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(MAX(CAST(nº_registro AS INT)), 0) + 1 FROM registros_entrega WHERE id_actividad = :activityId"
            );
            query.setParameter("activityId", activityId);
            Integer nextVal = (Integer) query.getSingleResult();
            return String.format("%05d", nextVal);
        } catch (NoResultException e) {
            return "00001";
        }
    }
    
    @Transactional(readOnly = true)
    public String peekNextRegistrationNumber(String activityId) {
        try {
            Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(MAX(CAST(nº_registro AS INT)), 0) + 1 FROM registros_entrega WHERE id_actividad = :activityId"
            );
            query.setParameter("activityId", activityId);
            Integer nextVal = (Integer) query.getSingleResult();
            return String.format("%05d", nextVal);
        } catch (NoResultException e) {
            return "00001";
        }
    }
}