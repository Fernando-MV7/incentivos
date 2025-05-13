import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Incentivo, IncentivoService } from '../../service/incentivo.service';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { forkJoin, Observable } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { FileUploadModule } from 'primeng/fileupload';
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
    selector: 'app-incentivos',
    standalone: true,
    imports: [
        CommonModule,
        RadioButtonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        RatingModule,
        DropdownModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        CheckboxModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        MessageModule,
        FileUploadModule
    ],
    templateUrl: './incentivos.component.html',
    styleUrl: './incentivos.component.scss',
    providers: [MessageService, ConfirmationService, IncentivoService]
})
export class IncentivosComponent implements OnInit {
    incentivoDialog: boolean = false;
    incentivos = signal<Incentivo[]>([]);
    incentivo!: Incentivo;
    selectedFile: File | null = null;
    selectedImageURL: string | null = null;
    selectedIncentivos!: Incentivo[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    @ViewChild('fileInput') fileInput!: ElementRef;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    isAuthorized: boolean = true;
    showPreview = signal(false);
    tituloDialog: string = 'Registro de Incentivo';

    constructor(
        private incentivoService: IncentivoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportPDF() {
        const doc = new jsPDF();
        doc.text('ICENTIVOS REGISTRADOS', 105, 15, { align: 'center' });
        const head = [['ID', 'Nombre', 'Descripcion', 'Cantidad']];
        const incentivos = this.incentivos() as Incentivo[];
        const sortedIncentivos = [...incentivos].sort((a: Incentivo, b: Incentivo) => {
            const idA = typeof a.id === 'number' ? a.id : 0;
            const idB = typeof b.id === 'number' ? b.id : 0;
            return idA - idB;
        });

        const data = sortedIncentivos.map((incentivo: Incentivo) => [String(incentivo.id), incentivo.nombre ?? '', incentivo.descripcion ?? '', incentivo.cantidad ?? '']);
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
        doc.save('incentivos.pdf');
    }

    ngOnInit() {
        this.incentivo = {
            nombre: '',
            descripcion: '',
            cantidad: 0,
            imagen: '',
            estado: true
        };
        this.loadDemoData();
        this.checkAuthorization();
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
                console.error('Error decoding token:', error);
                this.isAuthorized = false;
            }
        } else {
            this.isAuthorized = false;
        }
    }

    loadDemoData() {
        this.incentivoService.getIncentivos().subscribe({
            next: (data: Incentivo[]) => {
                const incentivosWithImagePromises = data.map((incentivo) => {
                    if (incentivo.id) {
                        return new Promise<Incentivo>((resolve) => {
                            this.incentivoService.getIncentivoImagen(Number(incentivo.id)).subscribe({
                                next: (blob: Blob) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        incentivo.imagen = reader.result as string;
                                        resolve(incentivo);
                                    };
                                    reader.readAsDataURL(blob);
                                },
                                error: () => {
                                    resolve(incentivo);
                                }
                            });
                        });
                    }
                    return Promise.resolve(incentivo);
                });

                Promise.all(incentivosWithImagePromises).then((incentivosWithImages) => {
                    this.incentivos.set(incentivosWithImages);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Carga Exitosa',
                        detail: 'Datos del incentivo cargados correctamente.'
                    });
                });
            },
            error: (err) => {
                if (err.status === 401 || err.status === 403) {
                    this.isAuthorized = false;
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No autorizado',
                        detail: 'No tiene los permisos necesarios para ver la lista de incentivos.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error de Carga',
                        detail: 'Error al cargar los datos de los incentivos.'
                    });
                }
            }
        });

        this.cols = [
            { field: 'id', header: 'ID', customExportHeader: 'Incentivos id' },
            { field: 'nombre', header: 'NOMBRE' },
            { field: 'descripcion', header: 'DESCRIPCION' },
            { field: 'cantidad', header: 'CANTIDAD' },
            { field: 'imagen', header: 'IMAGEN' },
            { field: 'estado', header: 'ESTADO' }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    saveIncentivo() {
        this.submitted = true;
        if (!this.incentivo.nombre || !this.incentivo.descripcion || this.incentivo.cantidad === undefined || this.incentivo.cantidad === null || !this.selectedFile) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre, descripción, cantidad e imagen son obligatorios.'
            });
            return;
        }
        const formData = new FormData();
        formData.append(
            'incentivo',
            new Blob(
                [
                    JSON.stringify({
                        nombre: this.incentivo.nombre,
                        descripcion: this.incentivo.descripcion,
                        cantidad: this.incentivo.cantidad
                    })
                ],
                { type: 'application/json' }
            )
        );

        if (this.selectedFile) {
            formData.append('imagen', this.selectedFile);
        }

        this.incentivoService.createIncentivos(formData).subscribe({
            next: (res: any) => {
                this.submitted = false;
                this.incentivoDialog = false;
                this.resetForm();
                this.loadDemoData();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Incentivo registrado',
                    detail: 'El incentivo fue registrado exitosamente.'
                });
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al registrar',
                    detail: err?.error?.message || 'No se pudo registrar el incentivo. Intenta nuevamente.'
                });
            }
        });
    }
    openNew() {
        this.submitted = false;
        this.tituloDialog = 'Registro de Incentivo';
        this.incentivoDialog = false;
        this.incentivo = {
            nombre: '',
            descripcion: '',
            cantidad: 0,
            imagen: '',
            estado: true
        };
        this.selectedFile = null;
        this.selectedImageURL = null;
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
        setTimeout(() => {
            this.incentivoDialog = true;
            this.showPreview.set(true);
        }, 100);
        this.messageService.add({
            severity: 'info',
            summary: 'Nuevo Incentivo',
            detail: 'Creando un nuevo registro de Incentivo.'
        });
    }

    updateIncentivo() {
        this.submitted = true;
        if (!this.incentivo.nombre || !this.incentivo.descripcion || this.incentivo.cantidad === undefined || this.incentivo.cantidad === null) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre, descripción y cantidad son obligatorios.'
            });
            return;
        }
        const formData = new FormData();
        formData.append(
            'incentivo',
            new Blob(
                [
                    JSON.stringify({
                        nombre: this.incentivo.nombre,
                        descripcion: this.incentivo.descripcion,
                        cantidad: this.incentivo.cantidad
                    })
                ],
                { type: 'application/json' }
            )
        );

        if (this.selectedFile) {
            formData.append('imagen', this.selectedFile);
        }
        this.incentivoService.updateIncentivo(Number(this.incentivo.id), formData).subscribe({
            next: (response) => {
                this.incentivoDialog = false;
                this.resetForm();
                this.loadDemoData();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Incentivo actualizado correctamente.'
                });
            },
            error: (incentivoErr) => {
                console.error('Error al actualizar los datos del incentivo:', incentivoErr);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al actualizar el incentivo',
                    detail: incentivoErr?.error?.message || 'No se pudo actualizar los datos.'
                });
            }
        });
    }

    onFileSelect(event: any) {
        if (event.target.files.length > 0) {
            this.selectedFile = event.target.files[0];
            if (this.selectedFile) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.selectedImageURL = e.target.result;
                };
                reader.readAsDataURL(this.selectedFile);
            } else {
                this.selectedImageURL = null;
            }
        } else {
            this.selectedFile = null;
            this.selectedImageURL = null;
        }
    }

    updateForm() {
        this.incentivo = { cantidad: 0 };
        this.selectedFile = null;
        this.selectedImageURL = null;
    }

    deleteSelectedIncentivos() {
        if (!this.selectedIncentivos || this.selectedIncentivos.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No se han seleccionado incentivos para eliminar.' });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los incentivos seleccionados?',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete: number[] = this.selectedIncentivos!.map((incentivo) => (typeof incentivo.id === 'string' ? parseInt(incentivo.id) : typeof incentivo.id === 'number' ? incentivo.id : 0));
                forkJoin(idsToDelete.map((id) => this.incentivoService.deleteIncentivo(id))).subscribe({
                    next: (responses: any[]) => {
                        this.incentivos.set(this.incentivos().filter((incentivo) => !this.selectedIncentivos?.some((selectedIncentivo) => selectedIncentivo.id === incentivo.id)));
                        this.selectedIncentivos = null;
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Incentivos eliminados.' });
                    },
                    error: (error: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se eliminaron los incentivos seleccionados.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: 'La eliminación de los incentivos seleccionados fue cancelada.' });
            }
        });
    }

    resetForm() {
        this.submitted = false;
        this.incentivo = {
            nombre: '',
            descripcion: '',
            cantidad: 0,
            imagen: '',
            estado: true
        };
        this.selectedFile = null;
        this.selectedImageURL = null;
        this.showPreview.set(false);
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    hideDialog() {
        this.submitted = false;
        this.incentivoDialog = false;
        this.resetForm();
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
        this.messageService.add({
            severity: 'info',
            summary: 'Diálogo Cerrado',
            detail: 'Se cerró el diálogo de incentivo.'
        });
    }

    toggleEstado(incentivo: any) {
        if (!incentivo.estado) {
            this.incentivoService.estadoTruIncentivo(incentivo.id).subscribe(() => {
                this.loadDemoData();
                this.messageService.add({ severity: 'success', summary: 'Estado Activado', detail: `Incentivo ${incentivo.nombre} activado.` });
            });
        } else {
            this.incentivoService.estadoFalseIncentivo(incentivo.id).subscribe(() => {
                this.loadDemoData();
                this.messageService.add({ severity: 'warn', summary: 'Estado Desactivado', detail: `Incentivo ${incentivo.nombre} desactivado.` });
            });
        }
        incentivo.estado = !incentivo.estado;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    editIncentivo(incentivo: Incentivo) {
        this.incentivo = { ...incentivo };
        this.tituloDialog = 'Actualización de Incentivo';
        this.selectedFile = null;

        if (incentivo.imagen) {
            this.selectedImageURL = incentivo.imagen;
        } else if (incentivo.id) {
            this.incentivoService.getIncentivoImagen(Number(incentivo.id)).subscribe({
                next: (blob: Blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        this.selectedImageURL = reader.result as string;
                    };
                    reader.readAsDataURL(blob);
                },
                error: (err) => {
                    this.selectedImageURL = null;
                }
            });
        } else {
            this.selectedImageURL = null;
        }
        this.selectedImageURL = incentivo.imagen || null;
        this.incentivoDialog = true;
        this.submitted = false;
        this.showPreview.set(true);
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
        this.messageService.add({
            severity: 'info',
            summary: 'Editar Incentivo',
            detail: `Editando incentivo: ${incentivo.nombre}.`
        });
    }

    deleteIncentivo(incentivo: Incentivo) {
        this.confirmationService.confirm({
            message: `Desea Eliminar el incentivo: ${incentivo.nombre}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const id = typeof incentivo.id === 'string' ? parseInt(incentivo.id) : typeof incentivo.id === 'number' ? incentivo.id : 0;
                this.incentivoService.deleteIncentivo(id).subscribe({
                    next: (response) => {
                        this.incentivos.set(this.incentivos().filter((val) => val.id !== incentivo.id));
                        this.resetForm();
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Incentivo eliminado permanentemente.' });
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el incentivo.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: `La eliminación del incentivo ${incentivo.nombre} fue cancelada.` });
            }
        });
    }
}
