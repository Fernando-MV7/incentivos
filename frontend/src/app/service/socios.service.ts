import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 

export interface ApiSocio {
    gbagenomb?: string;
    gbagecage?: number;
    gbagendid?: string;
    gbdocfvid?: Date;
    gbdaccelu?: string;
    gbdacmail?: string;
    ciVigente?: boolean;
}

export interface Socios {
    Nombre?: string;
    Nsocio?: number;
    CI?: string;
    fechaExpiracionCI?: Date;
    Celular?: string;
    Correo?: string;
    ciVigente?: boolean;
    esCoincidenciaExacta?: boolean;
    Foto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SociosService {
    private url = 'http://gateway:8080';
    constructor(private http: HttpClient) { }
    getSocios(): Observable<Socios[]> {
        return this.http.get<ApiSocio[]>(`${this.url}/api/agents`)
            .pipe(
                map((socios: ApiSocio[]) => socios.map((socio: ApiSocio) => ({
                    Nombre: socio.gbagenomb,
                    Nsocio: socio.gbagecage,
                    CI: socio.gbagendid,
                    fechaExpiracionCI: socio.gbdocfvid,
                    Celular: socio.gbdaccelu,
                    Correo: socio.gbdacmail,
                    ciVigente: socio.ciVigente
                })))
            );
    }

    buscarSocioCIvencido(numeroSocio: number): Observable<Socios> {
        return this.http.get<any>(`${this.url}/api/agents/socio/${numeroSocio}`)
            .pipe(
                map(response => {
                    return this.mapearSocio(response);
                })
            );
    }

    buscarSocio(texto: string): Observable<Socios[]> {    
        const url = `${this.url}/api/agents/${encodeURIComponent(texto)}`;
        
        return this.http.get<any>(url).pipe(
            map(response => {
                let socios: Socios[] = [];
                if (Array.isArray(response)) {
                    socios = response.map(item => this.mapearSocio(item));
                    socios.sort((a, b) => {
                        if (a.esCoincidenciaExacta && !b.esCoincidenciaExacta) return -1;
                        if (!a.esCoincidenciaExacta && b.esCoincidenciaExacta) return 1;
                        return 0;
                    });
                } else if (response) {
                    const socio = this.mapearSocio(response);
                    socios = [socio];
                }
                return socios;
            })
        );
    }
    
    private mapearSocio(data: any): Socios {
        let fotoBase64: string | undefined = undefined;
        if (data.Foto && Array.isArray(data.Foto) && data.Foto.length > 0) {
            try {
                const bytes = new Uint8Array(data.Foto);
                if (bytes.length > 0) {
                    const base64String = btoa(
                        Array.from(bytes)
                            .map(byte => String.fromCharCode(byte))
                            .join('')
                    );
                    
                    fotoBase64 = 'data:image/*;base64,' + base64String;
                }
            } catch (error) {
                console.error('Error al procesar la foto:', error);
            }
        }        
        const socio: Socios = {
            Nombre: this.extraerCampo(data, ['Nombre', 'nombre', 'gbagenomb']),
            Nsocio: this.extraerCampo(data, ['Nsocio', 'nsocio', 'gbagecage']),
            CI: this.extraerCampo(data, ['CI', 'ci', 'gbagendid']),
            fechaExpiracionCI: this.extraerCampo(data, ['FechaExpiracionCI', 'fechaExpiracionCI', 'gbdocfvid']),
            Celular: this.extraerCampo(data, ['Celular', 'celular', 'gbdaccelu']),
            Correo: this.extraerCampo(data, ['Correo', 'correo', 'gbdacmail']),
            ciVigente: this.extraerCampo(data, ['CIVigente', 'ciVigente', 'isCiVigente']) || false,
            esCoincidenciaExacta: this.extraerCampo(data, ['exactMatch', 'isExactMatch', 'esCoincidenciaExacta']) || false,
            Foto: fotoBase64
        };
        return socio;
    }

    private detectarTipoImagen(bytes: Uint8Array): string {
        if (bytes.length > 2 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
            return 'image/jpeg';
        }
        else if (bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && 
                bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
        }
        else if (bytes.length > 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && 
                bytes[2] === 0x46) {
            return 'image/gif';
        }
        else if (bytes.length > 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
            return 'image/bmp';
        }
        return 'image/*';
    }

    private extraerCampo(data: any, posiblesNombres: string[]): any {
        if (!data) return undefined;
        for (const nombre of posiblesNombres) {
            if (data[nombre] !== undefined) {
                return data[nombre];
            }
        }
        return undefined;
    }

    getImagenSocio(socioId: number): Observable<string> {
        return this.http.get(`${this.url}/api/agents/image/${socioId}`, { 
            responseType: 'blob' 
        }).pipe(
            map(blob => {
                return URL.createObjectURL(blob);
            })
        );
    }

    getHabilitadosCount(): Observable<number> {
        return this.http.get<number>(`${this.url}/api/agents/habilitados/count`);
    }
}