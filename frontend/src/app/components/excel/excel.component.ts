import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ExcelService, Socio, ResponseDTO } from '../../service/excel.service';
import * as XLSX from 'xlsx';
import { Actividad, ActividadService } from '../../service/actividad.service';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-excel',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, TableModule, FileUploadModule, ButtonModule, CardModule, InputTextModule, ProgressSpinnerModule, SelectModule, DialogModule, CheckboxModule, ConfirmDialogModule],
    providers: [MessageService, ExcelService, ActividadService, ConfirmationService],
    templateUrl: './excel.component.html',
    host: {
        '(document:keydown.enter)': 'onEnterKey($event)'
    }
})
export class ExcelComponent implements OnInit {
    socios: Socio[] = [];
    sociosSeleccionados: Socio[] = [];
    cargando: boolean = false;
    busquedaNumeroSocio: string = '';
    socioDetalle: Socio = {
        id: 0,
        numeroSocio: '',
        nombres: '',
        habilitado: false,
        entregado: false,
        idActividad: 0
    };
    mostrarDialogoDetalle: boolean = false;
    mostrarDialogoConfirmacionMultiple: boolean = false; 
    excelData: any[][] = [];
    mostrarVistaPrevia: boolean = false;
    archivoSeleccionado: File | null = null;
    nuevoSocio: Socio = {
        numeroSocio: '',
        nombres: '',
        habilitado: true,
        entregado: false,
        idActividad: undefined
    };
    actividadHabilitada: Actividad | null = null;
    actividadesHabilitadas: Actividad[] = [];
    actividadSeleccionada: Actividad | null = null;
    mostrarFormularioNuevoSocio: boolean = false;
    isAuthorized: boolean = true;
    filtroActividad: number = 0;
    timeoutId: any;
    socioExistente: boolean = false;
    actividadesIds: number[] = [];
    todasLasActividades: any[] = [];
    actividadesId: number[] = [];
    opcionesActividades: { label: string; value: number }[] = []; 
    selectedActividadId: number | null = null;

    constructor(
        private excelService: ExcelService,
        private messageService: MessageService,
        private actividadService: ActividadService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.checkAuthorization();
        this.cargarSocios();
        this.loadActividades();
        this.obtenerActividades();
    }

    onEnterKey(event: KeyboardEvent) {
        this.buscarSocio();
    }

    obtenerActividades(): void {
        this.excelService.getActividades().subscribe({
            next: (response) => {
                if (response.exito) {
                    this.actividadesId = response.datos;
                    const promises = this.actividadesId.map((id) => {
                        return new Promise<{ label: string; value: number }>((resolve) => {
                            this.actividadService.getActividadById(id).subscribe({
                                next: (actividad) => {
                                    const nombreActividad = actividad.nombre || `Actividad ${id}`;
                                    resolve({ label: nombreActividad, value: id });
                                },
                                error: (err) => {
                                    resolve({ label: `Actividad ${id}`, value: id });
                                }
                            });
                        });
                    });
                    Promise.all(promises).then((opciones) => {
                        this.opcionesActividades = opciones;
                        if (this.actividadSeleccionada && this.actividadSeleccionada.id) {
                            this.selectedActividadId = Number(this.actividadSeleccionada.id);
                        }
                    });
                }
            }
        });
    }

    onActividadDropdownChange(event: any): void {
        let idActividad: number | null = null;
        if (event && event.value !== undefined) {
            idActividad = Number(event.value);
        } else if (typeof event === 'number') {
            idActividad = event;
        } else if (event && typeof event === 'object') {
            idActividad = Number(event.value || event.id);
        }
        if (idActividad !== null && !isNaN(idActividad)) {
            this.selectedActividadId = idActividad;
            this.filtrarPorActividad(idActividad);
        } else {
            this.selectedActividadId = null;
            this.cargarSocios();
        }
    }

    onNumeroSocioChange(): void {
        this.socioExistente = false;
        if (!this.nuevoSocio.numeroSocio || this.nuevoSocio.numeroSocio.trim().length === 0) {
            return;
        }
        if (!this.actividadSeleccionada?.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor, seleccione una actividad primero'
            });
            return;
        }
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            this.verificarSocioExistente();
        }, 500);
    }

    verificarSocioExistente(): void {
        if (!this.nuevoSocio.numeroSocio || !this.actividadSeleccionada?.id) {
            return;
        }
        const id = typeof this.actividadSeleccionada.id === 'number' ? this.actividadSeleccionada.id : Number(this.actividadSeleccionada.id);
        this.excelService.verificarSocioExistente(this.nuevoSocio.numeroSocio, id).subscribe({
            next: (response) => {
                if (response.exito && response.datos === true) {
                    this.socioExistente = true;
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Socio ya registrado',
                        detail: `El socio con número ${this.nuevoSocio.numeroSocio} ya está registrado en la actividad seleccionada.`
                    });
                } else {
                    this.socioExistente = false;
                }
            },
            error: (error) => {
                this.socioExistente = false;
            }
        });
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
                this.actividadesHabilitadas = data.filter((a) => a.estado === true);
                if (this.actividadesHabilitadas.length > 0) {
                    this.actividadSeleccionada = this.actividadesHabilitadas[0];
                    this.actividadHabilitada = this.actividadSeleccionada;
                    if (this.actividadSeleccionada && this.actividadSeleccionada.id) {
                        const idActividad = Number(this.actividadSeleccionada.id);
                        this.filtrarPorActividad(idActividad);
                    }
                } else {
                    this.actividadSeleccionada = null;
                    this.actividadHabilitada = null;
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Sin actividades disponibles',
                        detail: 'No se encontraron actividades habilitadas para realizar entregas. Por favor contacte al administrador.',
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de sistema',
                    detail: 'No se pudieron cargar las actividades. Por favor intente refrescar la página.',
                    life: 5000
                });
            }
        });
    }
    onActividadChange(event: any) {
        const actividad = event.value;
        this.actividadSeleccionada = actividad;
        this.actividadHabilitada = actividad;
        if (actividad && actividad.id) {
            const idActividad = Number(actividad.id);
            this.filtrarPorActividad(idActividad);
        }
        this.messageService.add({
            severity: 'info',
            summary: 'Actividad seleccionada',
            detail: `Se ha seleccionado la actividad "${actividad.nombre}"`,
            life: 3000
        });
    }

    cargarSocios(): void {
        this.cargando = true;
        this.excelService.getSocios().subscribe({
            next: (data) => {
                this.socios = data;
                this.cargando = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los socios: ' + error.message
                });
                this.cargando = false;
            }
        });
    }

    filtrarPorActividad(idActividad: number): void {
        if (!idActividad) {
            this.cargarSocios();
            return;
        }
        this.cargando = true;
        this.excelService.getSociosPorActividad(idActividad).subscribe({
            next: (response) => {
                if (response.exito) {
                    this.socios = response.datos;
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Filtro aplicado',
                        detail: `Mostrando ${this.socios.length} socios para la actividad seleccionada`
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: response.mensaje || 'No se encontraron socios para esta actividad'
                    });
                }
                this.cargando = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al filtrar socios: ' + error.message
                });
                this.cargando = false;
            }
        });
    }

    habilitarSocio(socio: Socio): void {
        this.confirmationService.confirm({
            message: `¿Está seguro que desea habilitar al socio ${socio.nombres}?`,
            header: 'Confirmar habilitación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.cargando = true;
                const idActividad: number = Number(this.actividadSeleccionada?.id) || Number(socio.idActividad) || 0;
                if (isNaN(idActividad) || idActividad === 0) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se ha seleccionado una actividad válida'
                    });
                    this.cargando = false;
                    return;
                }
                this.excelService.habilitarSocio(socio.numeroSocio, idActividad).subscribe({
                    next: (response) => {
                        if (response.exito) {
                            const index = this.socios.findIndex((s) => s.numeroSocio === socio.numeroSocio);
                            if (index !== -1) {
                                this.socios[index].habilitado = true;
                            }
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: response.mensaje || 'Socio habilitado correctamente'
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.mensaje || 'Error al habilitar el socio'
                            });
                        }
                        this.cargando = false;
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al habilitar el socio: ' + (error.error?.mensaje || error.error?.error || error.message || 'Error desconocido')
                        });
                        this.cargando = false;
                    }
                });
            }
        });
    }

    deshabilitarSocio(socio: Socio): void {
        this.confirmationService.confirm({
            message: `¿Está seguro que desea inhabilitar al socio ${socio.nombres}?`,
            header: 'Confirmar inhabilitación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.cargando = true;
                const idActividad: number = Number(this.actividadSeleccionada?.id) || Number(socio.idActividad) || 0;
                if (isNaN(idActividad) || idActividad === 0) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se ha seleccionado una actividad válida'
                    });
                    this.cargando = false;
                    return;
                }
                this.excelService.inhabilitarSocio(socio.numeroSocio, idActividad).subscribe({
                    next: (response) => {
                        if (response.exito) {
                            const index = this.socios.findIndex((s) => s.numeroSocio === socio.numeroSocio);
                            if (index !== -1) {
                                this.socios[index].habilitado = false;
                            }
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: response.mensaje || 'Socio inhabilitado correctamente'
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.mensaje || 'Error al inhabilitar el socio'
                            });
                        }
                        this.cargando = false;
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al inhabilitar el socio: ' + (error.error?.mensaje || error.error?.error || error.message || 'Error desconocido')
                        });
                        this.cargando = false;
                    }
                });
            }
        });
    }

    eliminarSocio(socio: Socio): void {
        this.confirmationService.confirm({
            message: `¿Está seguro que desea eliminar al socio ${socio.nombres}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.cargando = true;
                const idActividad: number = Number(this.actividadSeleccionada?.id) || Number(socio.idActividad) || 0;
                if (isNaN(idActividad) || idActividad === 0) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se ha seleccionado una actividad válida'
                    });
                    this.cargando = false;
                    return;
                }

                this.excelService.eliminarSocio(socio.numeroSocio, idActividad).subscribe({
                    next: (response) => {
                        if (response.exito) {
                            this.socios = this.socios.filter((s) => s.numeroSocio !== socio.numeroSocio);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: response.mensaje || 'Socio eliminado correctamente'
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.mensaje || 'Error al eliminar el socio'
                            });
                        }
                        this.cargando = false;
                    },
                    error: (error) => {
                        console.error('Error al eliminar socio:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar el socio: ' + (error.error?.mensaje || error.error?.error || error.message || 'Error desconocido')
                        });
                        this.cargando = false;
                    }
                });
            }
        });
    }

    onSeleccionSociosChange(event: any): void {
    }

    confirmarEliminarMultiples(): void {
        if (!this.sociosSeleccionados || this.sociosSeleccionados.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No ha seleccionado ningún socio para eliminar'
            });
            return;
        }
        this.mostrarDialogoConfirmacionMultiple = true;
    }

    eliminarMultiplesSocios(): void {
        if (!this.sociosSeleccionados || this.sociosSeleccionados.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No ha seleccionado ningún socio para eliminar'
            });
            return;
        }
        const numerosSocios = this.sociosSeleccionados.map((socio) => socio.numeroSocio);
        this.cargando = true;
        this.excelService.eliminarMultiplesSocios(numerosSocios).subscribe({
            next: (response) => {
                if (response.exito) {
                    this.socios = this.socios.filter((socio) => !numerosSocios.includes(socio.numeroSocio));
                    this.sociosSeleccionados = [];
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `Se han eliminado ${numerosSocios.length} socios correctamente`
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.mensaje || 'Error al eliminar los socios seleccionados'
                    });
                }
                this.mostrarDialogoConfirmacionMultiple = false;
                this.cargando = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al eliminar los socios seleccionados: ' + error.message
                });
                this.mostrarDialogoConfirmacionMultiple = false;
                this.cargando = false;
            }
        });
    }

    cancelarEliminacionMultiple(): void {
        this.mostrarDialogoConfirmacionMultiple = false;
    }

    onFileSelect(event: any): void {
        this.excelData = [];
        this.mostrarVistaPrevia = false;
        this.archivoSeleccionado = null;

        if (event.files && event.files.length > 0) {
            this.archivoSeleccionado = event.files[0];
            const file = event.files[0];
            const allowedExtensions = ['.xls', '.xlsx'];
            const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Formato de archivo no válido. Por favor, seleccione un archivo Excel (.xls o .xlsx).'
                });
                return;
            }

            const fileReader = new FileReader();
            fileReader.onload = (e: any) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                this.excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                this.mostrarVistaPrevia = true;
            };
            fileReader.readAsArrayBuffer(file);
        }
    }

    onUpload(): void {
        if (!this.archivoSeleccionado) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor, seleccione un archivo Excel primero.'
            });
            return;
        }

        if (!this.actividadSeleccionada) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor, seleccione una actividad antes de cargar el archivo.'
            });
            return;
        }

        if (this.excelData.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay datos para cargar. Por favor, seleccione un archivo Excel y visualice la vista previa.'
            });
            return;
        }

        this.cargando = true;
        const id = Number(this.actividadSeleccionada?.id);
        if (!isNaN(id)) {
            this.excelService.cargarExcel(this.archivoSeleccionado, id).subscribe({
                next: (response) => {
                    if (response.exito) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: response.mensaje
                        });
                        this.cargarSocios();
                        this.excelData = [];
                        this.mostrarVistaPrevia = false;
                        this.archivoSeleccionado = null;
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.mensaje || 'Error al procesar el archivo'
                        });
                    }
                    this.cargando = false;
                },
                error: (error) => {
                    let errorMessage = 'Error al procesar el archivo: ';
                    if (error.error instanceof ErrorEvent) {
                        errorMessage += error.error.message;
                    } else if (typeof error.error === 'string') {
                        errorMessage += error.error;
                    } else if (error.error && error.error.mensaje) {
                        errorMessage += error.error.mensaje;
                    } else {
                        errorMessage += error.message || 'Error desconocido';
                    }
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorMessage
                    });
                    this.cargando = false;
                }
            });
        }
    }

    verDetalleSocio(socio: Socio): void {
        this.socioDetalle = socio;
        this.mostrarDialogoDetalle = true;
    }

    buscarSocio(): void {
        if (this.busquedaNumeroSocio.trim()) {
            if (!this.actividadSeleccionada || !this.actividadSeleccionada.id) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'Debe seleccionar una actividad para realizar la búsqueda'
                });
                return;
            }
            const idActividad = Number(this.actividadSeleccionada.id);
            this.excelService.getSocioPorNumeroYActividad(this.busquedaNumeroSocio, idActividad).subscribe({
                next: (response) => {
                    if (response.exito && response.datos) {
                        this.socioDetalle = response.datos as Socio;
                        this.mostrarDialogoDetalle = true;
                    } else {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Información',
                            detail: 'No se encontró el socio con número: ' + this.busquedaNumeroSocio + ' en la actividad seleccionada'
                        });
                    }
                },
                error: (error) => {
                    if (error.status === 404) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Información',
                            detail: 'No se encontró el socio con número: ' + this.busquedaNumeroSocio + ' en la actividad seleccionada'
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al buscar socio: ' + error.message
                        });
                    }
                }
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Ingrese un número de socio para buscar'
            });
        }
    }

    abrirFormularioNuevoSocio(): void {
        this.nuevoSocio = {
            numeroSocio: '',
            nombres: '',
            habilitado: true,
            entregado: false,
            idActividad: typeof this.actividadSeleccionada?.id === 'number' ? this.actividadSeleccionada.id : undefined
        };
        this.mostrarFormularioNuevoSocio = true;
    }

    guardarNuevoSocio(): void {
        if (!this.nuevoSocio.numeroSocio || !this.nuevoSocio.nombres) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos incompletos',
                detail: 'Por favor, complete todos los campos requeridos.'
            });
            return;
        }
        if (!this.actividadSeleccionada) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Actividad no seleccionada',
                detail: 'Por favor, seleccione una actividad.'
            });
            return;
        }
        if (this.socioExistente) {
            this.messageService.add({
                severity: 'error',
                summary: 'Socio duplicado',
                detail: 'El socio ya está registrado en esta actividad.'
            });
            return;
        }

        const id = this.actividadSeleccionada?.id;
        this.nuevoSocio.idActividad = typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : undefined;
        this.cargando = true;
        this.excelService.verificarSocioExistente(this.nuevoSocio.numeroSocio, this.nuevoSocio.idActividad).subscribe({
            next: (response) => {
                if (response.exito && response.datos === true) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Socio duplicado',
                        detail: 'El socio ya está registrado en esta actividad.'
                    });
                    this.cargando = false;
                } else {
                    this.crearNuevoSocio();
                }
            },
            error: (error) => {
                this.crearNuevoSocio();
            }
        });
    }
    
    cancelarNuevoSocio(): void {
        this.mostrarFormularioNuevoSocio = false;
    }

    private crearNuevoSocio(): void {
        this.excelService.crearSocio(this.nuevoSocio).subscribe({
            next: (response) => {
                if (response.exito) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Socio creado correctamente'
                    });
                    this.mostrarFormularioNuevoSocio = false;
                    this.cargarSocios();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.mensaje || 'Error al crear el socio'
                    });
                }
                this.cargando = false;
            },
            error: (error) => {
                let errorMessage = 'Error al crear el socio: ';
                if (error.error instanceof ErrorEvent) {
                    errorMessage += error.error.message;
                } else if (typeof error.error === 'string') {
                    errorMessage += error.error;
                } else if (error.error && error.error.mensaje) {
                    errorMessage += error.error.mensaje;
                } else {
                    errorMessage += error.message || 'Error desconocido';
                }
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage
                });
                this.cargando = false;
            }
        });
    }

    cancelarArchivoSeleccionado(): void {
        this.excelData = [];
        this.mostrarVistaPrevia = false;
        this.archivoSeleccionado = null;
        this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: 'Se ha cancelado la selección del archivo'
        });
    }

    limpiarFiltro() {
        this.actividadSeleccionada = null;
        this.cargarSocios();
    }
}
