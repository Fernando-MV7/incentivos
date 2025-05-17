import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

interface InventoryStatus {
  label: string;
  value: string;
}

export interface User {
  id?: string; 
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email?: string;
  username?: string;
  password?: string;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
  estado?: boolean;
  userRoles?: any[];
}

interface UserInfoResponse {
  userRoles: { role: { name: string } }[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://gateway:8080';
  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
      const token = sessionStorage.getItem('token'); 
      const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
      });

      return this.http.get<User[]>(`${this.apiUrl}/api/users`, {headers});
  }

  estadoFalseUser(id: number): Observable<void> {
    const token = sessionStorage.getItem('token'); 
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/api/users/${id}`, {headers});
  }

  estadoTruUser(id: number): Observable<User> {
    const token = sessionStorage.getItem('token'); 
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
    });

    return this.http.patch<User>(`${this.apiUrl}/api/users/${id}/activate`, null, {headers});
  }
  
  createUser(
    regnombre: string, 
    regapellidoPaterno: string, 
    regapellidoMaterno: string, 
    regemail: string, 
    regusername: string, 
    regpassword: string, 
    regestado: boolean, 
    regname: string): Observable<User> {
    const token = sessionStorage.getItem('token'); 
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const body = {
      nombre: regnombre,
      apellidoPaterno: regapellidoPaterno,
      apellidoMaterno: regapellidoMaterno,
      email: regemail,
      username: regusername,
      password: regpassword,
      estado: regestado,
      userRoles: [
        {
          role: {
            name: regname
          }
        }
      ]
    }
    return this.http.post<User>(`${this.apiUrl}/api/auth/register`, body,  {headers});
  }
  createAdmin(regnombre: string, 
    regapellidoPaterno: string, 
    regapellidoMaterno: string, 
    regemail: string, 
    regusername: string, 
    regpassword: string, 
    regestado: boolean, 
    regname: string): Observable<User> {
      const token = sessionStorage.getItem('token'); 
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    });
      const body = {
        nombre: regnombre,
        apellidoPaterno: regapellidoPaterno,
        apellidoMaterno: regapellidoMaterno,
        email: regemail,
        username: regusername,
        password: regpassword,
        estado: regestado,
        userRoles: [
          {
            role: {
              name: regname
            }
          }
        ]
      }
    return this.http.post<User>(`${this.apiUrl}/api/auth/register-admin`, body, {headers});
  }

  updateUser(id: number, userDto: any): Observable<User> {
    const token = sessionStorage.getItem('token'); 
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put<User>(`${this.apiUrl}/api/users/${id}`, userDto, { headers });
  }
  
  updateUserRoles(id: number, roles: string[]): Observable<any> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { roles: roles };
    return this.http.put(`${this.apiUrl}/api/users/${id}/roles`, body, { headers });
  }

  deleteUser(id: number): Observable<any> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete(`${this.apiUrl}/api/users/${id}/permanent`, { headers });
  }  
}