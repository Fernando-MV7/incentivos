import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { User, ActividadService} from '../../../service/actividad.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <div *ngIf="userData" class="user-info p-3 surface-card border-round shadow-2 flex items-center gap-3">
            <i class="pi pi-user text-primary text-2xl"></i>
            <div class="flex flex-col">
                <span class="text-lg font-semibold text-700">
                {{ userData.nombre }}
                </span>
                <span class="text-lg text-700">
                {{ userData.apellidoPaterno }} {{ userData.apellidoMaterno }}
                </span>
            </div>
        </div>

        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];
    userData: User | null = null;
    constructor(private actividadService: ActividadService) {}
    ngOnInit() {
        this.getUserData();   
        this.model = [
            {
                label: 'USUARIOS',
                items: [
                    {label: 'Lista de Usuarios', icon: 'pi pi-fw pi-id-card', routerLink: ['/layout/registro_usuarios'] },
                ],           
            },
            {
                label: 'SOCIOS',
                items: [
                    {label: 'Lista de Socios', icon: 'pi pi-fw pi-id-card', routerLink: ['/layout/socios'] },
                ],           
            },
            {
                label: 'ACTIVIDADES',
                items:[
                    {label: 'Registro de Incentivos', icon: 'pi pi-fw pi-book', routerLink: ['/layout/incentivos']},
                    {label: 'Registro de Actividades', icon: 'pi pi-fw pi-book', routerLink: ['/layout/actividades']},
                    
                ],
            },
            {
                label: 'REPORTES',
                items: [
                    {label: 'Reporte de incentivos', icon: 'pi pi-fw pi-table', routerLink: ['/layout/reporte']},
                ],
            },
            {
                label: 'ENTREGA DE INCENTIVOS',
                items: [
                    {label: 'Formulario de registro', icon: 'pi pi-fw pi-gift', routerLink: ['/layout/entrega_incentivos']},
                ],
            },
                        
        ];
    }

    getUserData() {
        const token = sessionStorage.getItem('token');
        
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                const userId = tokenData.userId;
                
                this.actividadService.getMyUser(userId).subscribe({
                    next: (user) => {
                        this.userData = user;
                    },
                    error: (error) => {
                        console.error('Error al obtener datos del usuario:', error);
                    }
                });
            } catch (error) {
                console.error('Error al procesar el token:', error);
            }
        }
    }
}
