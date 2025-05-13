import { Routes } from '@angular/router';
import { AuthComponent } from './app/components/auth/auth.component';
import { AppLayout } from './app/components/layout/component/app.layout';
import { AuthGuard } from './guards/auth.guard';
import { CrudUsersComponent } from './app/components/crud-users/crud-users.component';
import { IncentivosComponent } from './app/components/incentivos/incentivos.component';
import { ActividadesComponent } from './app/components/actividades/actividades.component';
import { EntregaComponent } from './app/components/entrega/entrega.component';
import { ReportesComponent } from './app/components/reportes/reportes.component';
import { ExcelComponent } from './app/components/excel/excel.component';

export const appRoutes: Routes = [
    { path: '', component: AuthComponent },
    { path: 'layout', component: AppLayout, canActivate: [AuthGuard],
        children: [
        { path: '', redirectTo: 'entrega_incentivos', pathMatch: 'full' },
        { path: 'registro_usuarios', component: CrudUsersComponent },
        { path: 'incentivos', component: IncentivosComponent },
        { path: 'actividades', component: ActividadesComponent},
        { path: 'entrega_incentivos', component: EntregaComponent},
        { path: 'reporte', component: ReportesComponent},
        { path: 'socios', component: ExcelComponent},
    ]}
];
