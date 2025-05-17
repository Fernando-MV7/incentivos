import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Actividad {
  id?: string | number;
  nombre?: string;
  descripcion?: string;
  fecha?: Date;
  hora?: string;  estado?: boolean;
  userId?: number;
  incentivos?: IncentivoResponseDto[];
}

export interface IncentivoResponseDto {
  id?: number;
  nombre?: string;
  descripcion?: string;
  cantidad?: number;
  estado?: boolean;
  imagenTipo?: string;
  imagenBase64?: string;
}

export interface ActividadRequestDto {
  nombre: string;
  descripcion: string;
  incentivosIds: number[];
}

export interface User {
  id?: number; 
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadService {

  private apiUrl = 'http://gateway:8080'
  constructor(private http: HttpClient) { }
  
  getActividades(): Observable<Actividad[]> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Actividad[]>(`${this.apiUrl}/api/actividades`, { headers });
  }
  
  getMisActividades(): Observable<Actividad[]> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Actividad[]>(`${this.apiUrl}/api/actividades/mis-actividades`, { headers });
  }

  getMyUser(id: number): Observable<User> {
    const token = sessionStorage.getItem('token'); 
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
    });
    return this.http.get<User>(`${this.apiUrl}/api/users/${id}`, {headers});
  }

  getActividadById(id: number): Observable<Actividad> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Actividad>(`${this.apiUrl}/api/actividades/${id}`, { headers });
  }

  createActividad(actividad: ActividadRequestDto): Observable<Actividad> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<Actividad>(`${this.apiUrl}/api/actividades`, actividad, { headers });
  }

  updateActividad(id: number, actividad: ActividadRequestDto): Observable<Actividad> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<Actividad>(`${this.apiUrl}/api/actividades/${id}`, actividad, { headers });
  }

  deleteActividad(id: number): Observable<any> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/api/actividades/${id}`, { headers });
  }

  estadoFalseActividad(id: number): Observable<Actividad> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.patch<Actividad>(`${this.apiUrl}/api/actividades/${id}/disable`, null, { headers });
  }

  estadoTrueActividad(id: number): Observable<Actividad> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.patch<Actividad>(`${this.apiUrl}/api/actividades/${id}/enable`, null, { headers });
  }
}