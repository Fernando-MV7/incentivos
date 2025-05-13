import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RegistroService, Registro } from '../../service/registro.service';
import { ExcelService } from '../../service/excel.service';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, TableModule, ButtonModule, SelectModule, CalendarModule, CardModule, DatePickerModule, DialogModule, InputTextModule],
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.scss'],
    providers: [DatePipe, ExcelService]
})
export class ReportesComponent implements OnInit {
    filterForm: FormGroup;
    registros: Registro[] = [];
    filteredRegistros: Registro[] = [];
    actividadSeleccionada: string = '';
    responsableSeleccionado: string = '';
    fechaInicio: string = '';
    fechaFin: string = '';
    actividades: { id: string; nombre: string }[] = [];
    responsables: { id: string; nombre: string }[] = [];
    isAuthorized: boolean = true;
    calendarValue: any = null;
    displaySaveDialog: boolean = false;
    fileName: string = 'Reporte_Entrega_Incentivos';
    habilitadosCount: number = 0;
    error: string = '';
    faltantesCount: number = 0;

    constructor(
        private registroService: RegistroService,
        private formBuilder: FormBuilder,
        private datePipe: DatePipe,
        private http: HttpClient,
        private excelService: ExcelService
    ) {
        this.filterForm = this.formBuilder.group({
            actividad: [''],
            responsable: [''],
            fechaInicio: [null],
            fechaFin: [null]
        });
    }

    ngOnInit(): void {
        this.cargarRegistros();
        this.checkAuthorization();
    }

    actualizarFaltantesCount(): void {
        const formValues = this.filterForm.value;
        const actividadId = formValues.actividad;

        if (actividadId && this.habilitadosCount > 0) {
            const entregasPorActividad = this.registros.filter((registro) => registro.activityId === actividadId).length;

            this.faltantesCount = Math.max(0, this.habilitadosCount - entregasPorActividad);
        } else {
            this.faltantesCount = 0;
        }
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

    loadHabilitadosCount(): void {
        const formValues = this.filterForm.value;
        const actividadId = formValues.actividad;

        if (actividadId) {
            this.excelService.contarSociosPorActividad(actividadId).subscribe({
                next: (response) => {
                    if (response && response.exito) {
                        this.habilitadosCount = response.datos;
                        this.actualizarFaltantesCount();
                    } else {
                        this.error = response && response.mensaje ? response.mensaje : 'Error desconocido';
                    }
                },
                error: (err) => {
                    this.error = 'Error al cargar el conteo de socios. Por favor, inténtelo de nuevo.';
                    console.error('Error en contarSociosPorActividad:', err);
                }
            });
        } else {
            this.habilitadosCount = 0;
            this.actualizarFaltantesCount();
        }
    }

    cargarRegistros(): void {
        this.registroService.getAllDeliveries().subscribe((data) => {
            this.registros = data;
            this.filteredRegistros = [...this.registros];
            this.extraerActividades();
            this.extraerResponsables();
            this.loadHabilitadosCount();
        });
    }

    extraerActividades(): void {
        const actividadesMap = new Map<string, string>();
        this.registros.forEach((registro) => {
            if (registro.activityId && registro.activityName) {
                actividadesMap.set(registro.activityId, registro.activityName);
            }
        });
        this.actividades = Array.from(actividadesMap).map(([id, nombre]) => ({ id, nombre }));
    }

    extraerResponsables(): void {
        const responsablesMap = new Map<string, string>();
        this.registros.forEach((registro) => {
            if (registro.responsibleId && registro.responsibleName) {
                responsablesMap.set(registro.responsibleId, registro.responsibleName);
            }
        });
        this.responsables = Array.from(responsablesMap).map(([id, nombre]) => ({ id, nombre }));
    }

    corregirFecha(fecha: Date): Date {
        if (!fecha) return fecha;
        const year = fecha.getFullYear();
        const month = fecha.getMonth();
        const day = fecha.getDate();
        const fechaCorregida = new Date(Date.UTC(year, month, day));
        return fechaCorregida;
    }

    filtrarRegistros(): void {
        const values = this.filterForm.value;
        this.filteredRegistros = [...this.registros];
        if (values.actividad) {
            const actividadEncontrada = this.actividades.find((a) => a.id === values.actividad);
            this.actividadSeleccionada = actividadEncontrada ? actividadEncontrada.nombre : '';
        } else {
            this.actividadSeleccionada = '';
        }

        if (values.responsable) {
            const responsableEncontrado = this.responsables.find((r) => r.id === values.responsable);
            this.responsableSeleccionado = responsableEncontrado ? responsableEncontrado.nombre : '';
        } else {
            this.responsableSeleccionado = '';
        }

        if (values.actividad) {
            this.filteredRegistros = this.filteredRegistros.filter((registro) => registro.activityId === values.actividad);
        }

        if (values.responsable) {
            this.filteredRegistros = this.filteredRegistros.filter((registro) => registro.responsibleId === values.responsable);
        }
        if (values.fechaInicio) {
            let fechaInicio: Date;
            if (typeof values.fechaInicio === 'string') {
                fechaInicio = new Date(values.fechaInicio);
            } else {
                fechaInicio = this.corregirFecha(values.fechaInicio);
            }

            fechaInicio.setHours(0, 0, 0, 0);
            this.fechaInicio = this.datePipe.transform(fechaInicio, 'yyyy-MM-dd') || '';
            this.filteredRegistros = this.filteredRegistros.filter((registro) => {
                if (!registro.deliveryDate) return false;
                const fechaRegistro = new Date(registro.deliveryDate);
                fechaRegistro.setHours(0, 0, 0, 0);
                return fechaRegistro.getTime() >= fechaInicio.getTime();
            });
        } else {
            this.fechaInicio = '';
        }
        if (values.fechaFin) {
            let fechaFin: Date;
            if (typeof values.fechaFin === 'string') {
                fechaFin = new Date(values.fechaFin);
            } else {
                fechaFin = this.corregirFecha(values.fechaFin);
            }
            fechaFin.setHours(23, 59, 59, 999);
            this.fechaFin = this.datePipe.transform(fechaFin, 'yyyy-MM-dd') || '';
            this.filteredRegistros = this.filteredRegistros.filter((registro) => {
                if (!registro.deliveryDate) return false;
                const fechaRegistro = new Date(registro.deliveryDate);
                return fechaRegistro.getTime() <= fechaFin.getTime();
            });
        } else {
            this.fechaFin = '';
        }

        this.loadHabilitadosCount();
    }

    limpiarFiltros(): void {
        this.filterForm.reset({
            actividad: '',
            responsable: '',
            fechaInicio: null,
            fechaFin: null
        });
        this.actividadSeleccionada = '';
        this.responsableSeleccionado = '';
        this.fechaInicio = '';
        this.fechaFin = '';
        this.filteredRegistros = [...this.registros];
        this.habilitadosCount = 0;
        this.faltantesCount = 0;
    }

    obtenerTituloReporte(): string {
        let titulo = 'Del ';

        if (this.fechaInicio) {
            const fechaFormateada = this.datePipe.transform(this.fechaInicio, 'dd/MM/yyyy');
            titulo += fechaFormateada || '---';
        } else {
            titulo += '---';
        }
        titulo += ' al ';
        if (this.fechaFin) {
            const fechaFormateada = this.datePipe.transform(this.fechaFin, 'dd/MM/yyyy');
            titulo += fechaFormateada || '---';
        } else {
            titulo += '---';
        }
        return titulo;
    }

    exportarExcel(): void {
        this.generateDefaultFileName();
        this.displaySaveDialog = true;
    }

    confirmExport(): void {
        if (!this.fileName || this.fileName.trim() === '') {
            this.fileName = 'Reporte_Entrega_Incentivos';
        }
        if (!this.fileName.toLowerCase().endsWith('.xlsx')) {
            this.fileName += '.xlsx';
        }
        this.displaySaveDialog = false;
        this.performExport();
    }

    generateDefaultFileName(): void {
        let fileName = 'Reporte';
        if (this.actividadSeleccionada) {
            fileName += '_' + this.actividadSeleccionada.substring(0, 15).replace(/\s+/g, '_');
        }
        if (this.fechaInicio) {
            fileName += '_' + this.fechaInicio.replace(/-/g, '');
        }
        this.fileName = fileName;
    }

    getBase64ImageFromAssets(url: string): Promise<string> {
        return this.http
            .get(url, { responseType: 'blob' })
            .toPromise()
            .then((blob) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob!);
                });
            });
    }
    async performExport(): Promise<void> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte', {
            pageSetup: {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            }
        });

        worksheet.pageSetup.margins = {
            top: 0.3,
            header: 0.1,
            bottom: 0.3,
            footer: 0.1,
            left: 0.5,
            right: 0.5
        };
        const base64Image = await this.getBase64ImageFromAssets('assets/image/sanmartin.png');
        const imageId = workbook.addImage({
            base64: base64Image,
            extension: 'png'
        });

        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 150, height: 75 }
        });

        this.generateContent(worksheet);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.fileName || 'Reporte'}`;
        link.click();
    }

    generateContent(worksheet: ExcelJS.Worksheet): void {
        worksheet.mergeCells('B1:L1');
        worksheet.mergeCells('B2:L2');
        worksheet.mergeCells('B3:L3');

        const fila1 = worksheet.getCell('B1');
        fila1.value = 'COOPERATIVA DE AHORRO Y CRÉDITO "SAN MARTÍN" R.L.';
        fila1.font = { bold: true, size: 16, name: 'Calibri', color: { argb: 'FF000000' } };
        fila1.alignment = { horizontal: 'center', vertical: 'middle' };

        const fila2 = worksheet.getCell('B2');
        fila2.value = 'REPORTE DE ENTREGA DE INCENTIVOS';
        fila2.font = { bold: true, size: 13, name: 'Calibri', color: { argb: 'FF000000' } };
        fila2.alignment = { horizontal: 'center', vertical: 'middle' };

        const fila3 = worksheet.getCell('B3');
        fila3.value = `Fecha de generación: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}`;
        fila3.font = { italic: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
        fila3.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getRow(1).height = 25;
        worksheet.getRow(2).height = 22;
        worksheet.getRow(3).height = 20;
        worksheet.pageSetup.printTitlesRow = '1:8';
        worksheet.views = [{ state: 'frozen', ySplit: 8 }];

        const filaInfo = worksheet.addRow([`Actividad: ${this.actividadSeleccionada || 'Reporte General'}`, '', '', '', '', '', `Responsables: ${this.responsableSeleccionado || ' - '}`]);
        worksheet.mergeCells(`A${filaInfo.number}:E${filaInfo.number}`);
        worksheet.mergeCells(`G${filaInfo.number}:I${filaInfo.number}`);
        filaInfo.font = { size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
        filaInfo.alignment = { vertical: 'middle', horizontal: 'left' };
        let fechaInicioTexto = '-';
        let fechaFinTexto = '-';
        const formValues = this.filterForm.value;

        if (formValues.fechaInicio) {
            if (formValues.fechaInicio instanceof Date) {
                fechaInicioTexto = this.datePipe.transform(formValues.fechaInicio, 'dd/MM/yyyy') || '-';
            } else if (typeof formValues.fechaInicio === 'string') {
                if (formValues.fechaInicio.includes('-')) {
                    const partes = formValues.fechaInicio.split('T')[0].split('-');
                    if (partes.length === 3) {
                        fechaInicioTexto = `${partes[2]}/${partes[1]}/${partes[0]}`;
                    }
                } else {
                    fechaInicioTexto = formValues.fechaInicio;
                }
            }
        }

        if (formValues.fechaFin) {
            if (formValues.fechaFin instanceof Date) {
                fechaFinTexto = this.datePipe.transform(formValues.fechaFin, 'dd/MM/yyyy') || '-';
            } else if (typeof formValues.fechaFin === 'string') {
                if (formValues.fechaFin.includes('-')) {
                    const partes = formValues.fechaFin.split('T')[0].split('-');
                    if (partes.length === 3) {
                        fechaFinTexto = `${partes[2]}/${partes[1]}/${partes[0]}`;
                    }
                } else {
                    fechaFinTexto = formValues.fechaFin;
                }
            }
        }

        const filaFechas = worksheet.addRow([`Rango de fechas: ${fechaInicioTexto} - ${fechaFinTexto}`]);
        worksheet.mergeCells(`A${filaFechas.number}:I${filaFechas.number}`);
        filaFechas.font = { size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
        filaFechas.alignment = { vertical: 'middle', horizontal: 'left' };

        const totalEntregas = this.filteredRegistros.length;
        const actividadId = this.filterForm.value.actividad;
        let entregasPorActividad = 0;
        if (actividadId) {
            entregasPorActividad = this.registros.filter((registro) => registro.activityId === actividadId).length;
        }
        const totalHabilitados = this.habilitadosCount > 0 ? this.habilitadosCount : '-';
        const totalFaltantes = this.habilitadosCount > 0 ? Math.max(0, this.habilitadosCount - entregasPorActividad) : '-';

        const filaTotal = worksheet.addRow([`Total entregas: ${totalEntregas || '-'}`, '', '', '', `Total habilitados: ${totalHabilitados}`, '', `Total faltantes: ${totalFaltantes}`]);
        worksheet.mergeCells(`A${filaTotal.number}:C${filaTotal.number}`);
        worksheet.mergeCells(`E${filaTotal.number}:F${filaTotal.number}`);
        worksheet.mergeCells(`G${filaTotal.number}:I${filaTotal.number}`);
        filaTotal.font = { size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
        filaTotal.alignment = { vertical: 'middle', horizontal: 'left' };

        worksheet.addRow([]);

        const headers = ['N° Registro', 'N° Socio', 'Socio (a)', 'C.I.', 'Celular', 'Correo', 'Entrega', 'Actividad', 'Fecha entrega', 'Hora entrega', 'Responsable'];

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: 'Calibri', color: { argb: 'FF000000' } };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEFEFEF' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const datos = this.filteredRegistros.length > 0 ? this.filteredRegistros : Array(5).fill(null);

        datos.forEach((reg, i) => {
            const row = worksheet.addRow([
                reg?.registrationNumber || '',
                reg?.memberNumber || '',
                reg?.memberName || '',
                reg?.memberCI || '',
                reg?.phoneNumber || '',
                reg?.email || '',
                reg?.incentiveName || '',
                reg?.activityName || '',
                reg?.deliveryDate ? this.datePipe.transform(reg.deliveryDate, 'dd/MM/yyyy') : '',
                reg?.deliveryTime ? reg.deliveryTime.split('.')[0] : '',
                reg?.responsibleName || ''
            ]);

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                cell.font = { name: 'Calibri', color: { argb: 'FF000000' } };
            });
        });

        worksheet.columns = [{ width: 10 }, { width: 8 }, { width: 32 }, { width: 15 }, { width: 15 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 15 }, { width: 13 }, { width: 30 }];
    }
}
