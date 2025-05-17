import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Socio {
  id?: number;
  numeroSocio: string;
  nombres: string;
  habilitado: boolean;
  entregado: boolean;
  idActividad?: number;
}

export interface ResponseDTO {
  mensaje: string;
  exito: boolean;
  datos: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  verificarSocioExistente(numeroSocio: string, idActividad: number | undefined): Observable<ResponseDTO> {
    if (!idActividad) {
      return throwError(() => new Error('Se requiere un ID de actividad válido'));
    }
    
    const params = new HttpParams()
      .set('numeroSocio', numeroSocio)
      .set('idActividad', idActividad.toString());
      
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/verificar-existencia`, { params });
  }

  getSocios(): Observable<Socio[]> {
    return this.http.get<Socio[]>(`${this.apiUrl}/api/socios`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getSocioPorNumero(numeroSocio: string): Observable<ResponseDTO> {
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/${numeroSocio}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  cargarExcel(file: File, idActividad: number): Observable<ResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idActividad', idActividad.toString());
      
    return this.http.post<ResponseDTO>(`${this.apiUrl}/api/socios/upload`, formData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  crearSocio(socio: Socio): Observable<ResponseDTO> {
    return this.http.post<ResponseDTO>(`${this.apiUrl}/api/socios/nuevo`, socio).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  habilitarSocio(numeroSocio: string, idActividad: number | undefined): Observable<ResponseDTO> {
    let params = new HttpParams();
    if (idActividad !== undefined && idActividad !== null) {
      params = params.set('idActividad', idActividad.toString());
    }
    
    return this.http.patch<ResponseDTO>(`${this.apiUrl}/api/socios/${numeroSocio}/habilitar`, {}, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  inhabilitarSocio(numeroSocio: string, idActividad: number | string): Observable<ResponseDTO> {
    let params = new HttpParams();
    if (idActividad !== undefined && idActividad !== null) {
      params = params.set('idActividad', idActividad.toString());
    }
    
    return this.http.patch<ResponseDTO>(`${this.apiUrl}/api/socios/${numeroSocio}/inhabilitar`, {}, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  marcarSocioEntregado(numeroSocio: string, idActividad: number): Observable<ResponseDTO> {
    const params = new HttpParams()
      .set('idActividad', idActividad.toString());
    
    return this.http.patch<ResponseDTO>(`${this.apiUrl}/api/socios/${numeroSocio}/entregar`, {}, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  eliminarSocio(numeroSocio: string, idActividad: number | undefined): Observable<ResponseDTO> {
    let params = new HttpParams();
    if (idActividad !== undefined && idActividad !== null) {
      params = params.set('idActividad', idActividad.toString());
    }
    
    return this.http.delete<ResponseDTO>(`${this.apiUrl}/api/socios/${numeroSocio}`, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  eliminarMultiplesSocios(numerosSocios: string[]): Observable<ResponseDTO> {
    return this.http.delete<ResponseDTO>(`${this.apiUrl}/api/socios/eliminar-multiples`, { body: numerosSocios }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getSociosPorActividad(idActividad: number): Observable<ResponseDTO> {
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/actividad/${idActividad}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getSocioPorNumeroYActividad(numeroSocio: string, idActividad: number | string): Observable<ResponseDTO> {
    const params = new HttpParams()
      .set('numeroSocio', numeroSocio)
      .set('idActividad', idActividad.toString());
      
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/buscar`, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getActividades(): Observable<ResponseDTO> {
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/actividades`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  contarSociosPorActividad(idActividad: number | string): Observable<ResponseDTO> {
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/contar/actividad/${idActividad}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  contarSociosPorTodasLasActividades(): Observable<ResponseDTO> {
    return this.http.get<ResponseDTO>(`${this.apiUrl}/api/socios/contar/todas-actividades`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}