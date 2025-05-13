import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { Actividad, User, ActividadRequestDto, ActividadService, IncentivoResponseDto } from '../../service/actividad.service';
import { IncentivoService, Incentivo } from '../../service/incentivo.service';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

interface TokenPayload {
    sub: string;
    roles: string;
    userId: number;
    exp: number;
    iat: number;
}

@Component({
    selector: 'app-actividades',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        InputIconModule,
        IconFieldModule,
        CheckboxModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        MessageModule,
        MultiSelectModule
    ],
    templateUrl: './actividades.component.html',
    styleUrl: './actividades.component.scss',
    providers: [MessageService, ConfirmationService, ActividadService, IncentivoService, DatePipe]
})
export class ActividadesComponent implements OnInit {
    actividadDialog: boolean = false;
    incentivoDialog: boolean = false;
    actividades = signal<Actividad[]>([]);
    actividad!: Actividad;
    selectedActividades!: Actividad[] | null;
    submitted: boolean = false;
    disponibleIncentivos: Incentivo[] = [];
    selectedIncentivos: number[] = [];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    isAuthorized: boolean = true;
    tituloDialog: string = 'Registro de Actividad';
    userCache: { [key: number]: string } = {};

    constructor(
        private actividadService: ActividadService,
        private incentivoService: IncentivoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe
    ) {}

    exportPDF() {
        const doc = new jsPDF();
        doc.text('ACTIVIDADES REGISTRADAS', 105, 15, { align: 'center' });
        const head = [['ID', 'Nombre', 'Descripción', 'Fecha', 'Hora', 'Estado']];
        const actividades = this.actividades() as Actividad[];
        const sortedActividades = [...actividades].sort((a: Actividad, b: Actividad) => {
            const idA = typeof a.id === 'number' ? a.id : 0;
            const idB = typeof b.id === 'number' ? b.id : 0;
            return idA - idB;
        });

        const data = sortedActividades.map((actividad: Actividad) => [
            String(actividad.id),
            actividad.nombre ?? '',
            actividad.descripcion ?? '',
            this.datePipe.transform(actividad.fecha, 'dd/MM/yyyy') ?? '',
            actividad.hora ?? '',
            actividad.estado ? 'Activo' : 'Inactivo'
        ]);

        autoTable(doc, {
            head,
            body: data,
            startY: 20,
            styles: {
                halign: 'center',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        doc.save('actividades.pdf');
    }

    ngOnInit() {
        this.actividad = {
            nombre: '',
            descripcion: '',
            incentivos: []
        };
        this.loadActividades();
        this.loadIncentivos();
        this.checkAuthorization();
        this.cols = [
            { field: 'id', header: 'ID', customExportHeader: 'Actividad ID' },
            { field: 'nombre', header: 'NOMBRE' },
            { field: 'descripcion', header: 'DESCRIPCIÓN' },
            { field: 'fecha', header: 'FECHA' },
            { field: 'hora', header: 'HORA' },
            { field: 'estado', header: 'ESTADO' },
            { field: 'incentivos', header: 'INCENTIVOS' },
            { field: 'userid', header: 'USERID' },
            { field: 'nombreuser', header: 'NOMBRE DE USUARIO' }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    checkAuthorization() {
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                if (decoded.roles) {
                    this.isAuthorized = decoded.roles.includes('ROLE_ADMIN');
                } else {
                    this.isAuthorized = false;
                }
            } catch (error) {
                this.isAuthorized = false;
            }
        } else {
            this.isAuthorized = false;
        }
    }

    loadActividades() {
        this.actividadService.getActividades().subscribe({
            next: (data: Actividad[]) => {
                this.actividades.set(data);
                this.fetchCreatorNames(data);
                this.messageService.add({
                    severity: 'info',
                    summary: 'Carga Exitosa',
                    detail: 'Datos de actividades cargados correctamente.'
                });
            },
            error: (err) => {
                if (err.status === 401 || err.status === 403) {
                    this.isAuthorized = false;
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No autorizado',
                        detail: 'No tiene los permisos necesarios para ver la lista de actividades.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error de Carga',
                        detail: 'Error al cargar los datos de las actividades.'
                    });
                }
            }
        });
    }

    loadIncentivos() {
        this.incentivoService.getIncentivos().subscribe({
            next: (data: Incentivo[]) => {
                this.disponibleIncentivos = data.filter((incentivo) => incentivo.estado);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los incentivos disponibles.'
                });
            }
        });
    }

    fetchCreatorNames(actividades: Actividad[]) {
        actividades.forEach((actividad) => {
            if (actividad.userId && !this.userCache[actividad.userId]) {
                this.loadUser(actividad.userId);
            } else if (actividad.userId && this.userCache[actividad.userId]) {
                this.actividades.update((actividades) => actividades.map((a) => (a.userId !== undefined ? { ...a, nombreuser: this.userCache[a.userId] } : a)));
            }
        });
    }

    loadUser(userId: number) {
        this.actividadService.getMyUser(userId).subscribe({
            next: (user: User) => {
                if (user) {
                    this.userCache[userId] = `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno}`; //  Full name
                    this.actividades.update((actividades) => actividades.map((a) => (a.userId === userId ? { ...a, nombreuser: this.userCache[userId] } : a)));
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar el Usuario.'
                });
            }
        });
    }

    openNew() {
        this.submitted = false;
        this.tituloDialog = 'Registro de Actividad';
        this.actividadDialog = false;
        this.actividad = {
            nombre: '',
            descripcion: '',
            incentivos: []
        };
        this.selectedIncentivos = [];
        setTimeout(() => {
            this.actividadDialog = true;
        }, 100);
        this.messageService.add({
            severity: 'info',
            summary: 'Nueva Actividad',
            detail: 'Creando un nuevo registro de Actividad.'
        });
    }

    saveActividad() {
        this.submitted = true;
        if (!this.actividad.nombre || !this.actividad.descripcion) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre y descripción son obligatorios.'
            });
            return;
        }
        const actividadRequest: ActividadRequestDto = {
            nombre: this.actividad.nombre,
            descripcion: this.actividad.descripcion,
            incentivosIds: this.selectedIncentivos
        };
        this.actividadService.createActividad(actividadRequest).subscribe({
            next: (res: any) => {
                this.submitted = false;
                this.actividadDialog = false;
                this.resetForm();
                this.loadActividades();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Actividad registrada',
                    detail: 'La actividad fue registrada exitosamente.'
                });
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al registrar',
                    detail: err?.error?.message || 'No se pudo registrar la actividad. Intenta nuevamente.'
                });
            }
        });
    }

    updateActividad() {
        this.submitted = true;
        if (!this.actividad.nombre || !this.actividad.descripcion) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre y descripción son obligatorios.'
            });
            return;
        }
        const actividadRequest: ActividadRequestDto = {
            nombre: this.actividad.nombre,
            descripcion: this.actividad.descripcion,
            incentivosIds: this.selectedIncentivos
        };
        this.actividadService.updateActividad(Number(this.actividad.id), actividadRequest).subscribe({
            next: (response) => {
                this.actividadDialog = false;
                this.resetForm();
                this.loadActividades();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Actividad actualizada correctamente.'
                });
            },
            error: (actividadErr) => {
                console.error('Error al actualizar los datos de la actividad:', actividadErr);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al actualizar la actividad',
                    detail: actividadErr?.error?.message || 'No se pudo actualizar los datos.'
                });
            }
        });
    }

    resetForm() {
        this.submitted = false;
        this.actividad = {
            nombre: '',
            descripcion: '',
            incentivos: []
        };
        this.selectedIncentivos = [];
    }

    hideDialog() {
        this.submitted = false;
        this.actividadDialog = false;
        this.resetForm();
        this.messageService.add({
            severity: 'info',
            summary: 'Diálogo Cerrado',
            detail: 'Se cerró el diálogo de actividad.'
        });
    }

    toggleEstado(actividad: any) {
        if (!actividad.estado) {
            this.actividadService.estadoTrueActividad(actividad.id).subscribe(() => {
                this.loadActividades();
                this.messageService.add({ severity: 'success', summary: 'Estado Activado', detail: `Actividad ${actividad.nombre} activada.` });
            });
        } else {
            this.actividadService.estadoFalseActividad(actividad.id).subscribe(() => {
                this.loadActividades();
                this.messageService.add({ severity: 'warn', summary: 'Estado Desactivado', detail: `Actividad ${actividad.nombre} desactivada.` });
            });
        }
        actividad.estado = !actividad.estado;
    }

    incentivosactividad(actividad: Actividad) {
        this.actividad = { ...actividad };
        this.tituloDialog = 'Incentivos de Actividad';
        this.selectedIncentivos = actividad.incentivos?.map((inc) => Number(inc.id)) || [];
        this.incentivoDialog = true;
        this.submitted = false;
    }

    editActividad(actividad: Actividad) {
        this.actividad = { ...actividad };
        this.tituloDialog = 'Actualización de Actividad';
        this.selectedIncentivos = actividad.incentivos?.map((inc) => Number(inc.id)) || [];
        this.actividadDialog = true;
        this.submitted = false;
        this.messageService.add({
            severity: 'info',
            summary: 'Editar Actividad',
            detail: `Editando actividad: ${actividad.nombre}.`
        });
    }

    deleteActividad(actividad: Actividad) {
        this.confirmationService.confirm({
            message: `¿Desea eliminar la actividad: ${actividad.nombre}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const id = typeof actividad.id === 'string' ? parseInt(actividad.id) : typeof actividad.id === 'number' ? actividad.id : 0;
                this.actividadService.deleteActividad(id).subscribe({
                    next: (response) => {
                        this.actividades.set(this.actividades().filter((val) => val.id !== actividad.id));
                        this.resetForm();
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad eliminada permanentemente.' });
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la actividad.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: `La eliminación de la actividad ${actividad.nombre} fue cancelada.` });
            }
        });
    }

    deleteSelectedActividades() {
        if (!this.selectedActividades || this.selectedActividades.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No se han seleccionado actividades para eliminar.' });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar las actividades seleccionadas?',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete: number[] = this.selectedActividades!.map((actividad) => (typeof actividad.id === 'string' ? parseInt(actividad.id) : typeof actividad.id === 'number' ? actividad.id : 0));
                forkJoin(idsToDelete.map((id) => this.actividadService.deleteActividad(id))).subscribe({
                    next: (responses: any[]) => {
                        this.actividades.set(this.actividades().filter((actividad) => !this.selectedActividades?.some((selectedActividad) => selectedActividad.id === actividad.id)));
                        this.selectedActividades = null;
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividades eliminadas.' });
                    },
                    error: (error: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se eliminaron las actividades seleccionadas.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: 'La eliminación de las actividades seleccionadas fue cancelada.' });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}
