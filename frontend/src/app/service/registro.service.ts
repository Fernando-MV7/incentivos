import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Registro {
  id?: number;
  registrationNumber?: string;
  memberNumber?: string;
  memberCI?: string;
  memberName?: string;
  phoneNumber?: string;
  email?: string;
  incentiveId?: string;
  incentiveName?: string;
  activityId?: string;
  activityName?: string;
  responsibleId?: string;
  responsibleName?: string;
  deliveryDate?: string;
  deliveryTime?: string;
}

export interface CheckMemberResponse {
  hasReceived: boolean;
}

export interface ActivityStats {
  activityId: string;
  activityName?: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  checkMemberIncentive(memberNumber: string | undefined, memberCI: string | undefined, activityId: string): Observable<CheckMemberResponse> {
    let params = new HttpParams();
    if (memberNumber) {
      params = params.set('memberNumber', memberNumber);
    }
    if (memberCI) {
      params = params.set('memberCI', memberCI);
    }
    params = params.set('activityId', activityId);
    return this.http.get<CheckMemberResponse>(`${this.apiUrl}/api/registros/check-member`, { params });
  }

  getNextRegistrationNumber(activityId: string): Observable<{nextRegistrationNumber: string}> {
    const params = new HttpParams().set('activityId', activityId);
    return this.http.get<{nextRegistrationNumber: string}>(`${this.apiUrl}/api/registros/next-registration-number`, { params });
  }

  registerDelivery(registro: Registro): Observable<Registro> {
    return this.http.post<Registro>(`${this.apiUrl}/api/registros`, registro);
  }

  getAllDeliveries(): Observable<Registro[]> {
    return this.http.get<Registro[]>(`${this.apiUrl}/api/registros`);
  }

  getDeliveryByRegistrationNumber(registrationNumber: string): Observable<Registro> {
    return this.http.get<Registro>(`${this.apiUrl}/api/registros/${registrationNumber}`);
  }

  getDeliveriesByDate(date: string): Observable<Registro[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Registro[]>(`${this.apiUrl}/api/registros/reports/by-date`, { params });
  }

  getDeliveriesByDateRange(startDate: string, endDate: string): Observable<Registro[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Registro[]>(`${this.apiUrl}/api/registros/reports/by-date-range`, { params });
  }
  
  getComprobanteData(registrationNumber: string): Observable<Registro> {
    return this.http.get<Registro>(`${this.apiUrl}/api/registros/comprobante/${registrationNumber}`);
  }
  
  getDeliveriesByActivity(activityId: string): Observable<Registro[]> {
    return this.http.get<Registro[]>(`${this.apiUrl}/api/registros/by-activity/${activityId}`);
  }

  countDeliveriesByActivity(activityId: string): Observable<{activityId: string, count: number}> {
     return this.http.get<{activityId: string, count: number}>(`${this.apiUrl}/api/registros/count-activity/${activityId}`);
  }

  getActivitiesStats(): Observable<ActivityStats[]> {
    return this.http.get<ActivityStats[]>(`${this.apiUrl}/api/registros/activities-stats`);
  }
}