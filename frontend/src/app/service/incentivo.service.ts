import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router'; 
import { environment } from '../../environments/environment';

interface InventoryStatus {
  label: string;
  value: string;
}

export interface Incentivo {
  id?: string | number;
  nombre?: string;
  descripcion?: string;
  cantidad: number;
  imagen?: string;
  imagenTipo?: string;
  estado?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class IncentivoService {

  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getIncentivos(): Observable<Incentivo[]> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Incentivo[]>(`${this.apiUrl}/api/incentivos`, { headers });
  }

  estadoFalseIncentivo(id: number): Observable<Incentivo> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.patch<Incentivo>(`${this.apiUrl}/api/incentivos/${id}/disable`, null, { headers });
  }

  estadoTruIncentivo(id: number): Observable<Incentivo> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.patch<Incentivo>(`${this.apiUrl}/api/incentivos/${id}/enable`, null, { headers });
  }

  createIncentivos(incentivo: FormData): Observable<Incentivo> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<Incentivo>(`${this.apiUrl}/api/incentivos`, incentivo, { headers });
  }

  updateIncentivo(id: number, incentivo: FormData): Observable<Incentivo> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<Incentivo>(`${this.apiUrl}/api/incentivos/${id}`, incentivo, { headers });
  }

  deleteIncentivo(id: number): Observable<any> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/api/incentivos/${id}`, { headers });
  }

  getIncentivoImagen(id: number): Observable<Blob> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/api/incentivos/${id}/imagen`, {
      headers, responseType: 'blob'
    });
  }

  decrementarIncentivo(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/incentivos/${id}/decrementar`, {});
  }
}