import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { DropdownModule } from 'primeng/dropdown';
import { Actividad, User, ActividadService, IncentivoResponseDto } from '../../service/actividad.service';
import { IncentivoService, Incentivo } from '../../service/incentivo.service';
import { SociosService, Socios } from '../../service/socios.service';
import { RegistroService, Registro } from '../../service/registro.service';
import { ExcelService } from '../../service/excel.service';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-entrega',
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, CheckboxModule, DialogModule, TagModule, MessageModule, DropdownModule],
    templateUrl: './entrega.component.html',
    styleUrl: './entrega.component.scss',
    providers: [MessageService, ConfirmationService, ActividadService, IncentivoService, DatePipe, RegistroService]
})
export class EntregaComponent implements OnInit {
    busquedaSocio: string = '';
    actividades = signal<Actividad[]>([]);
    actividad!: Actividad;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    actividadHabilitada: Actividad | null = null;
    incentivosDeActividad: IncentivoResponseDto[] = [];
    vistaPreviaVisible: boolean = false;
    incentivoSeleccionado: IncentivoResponseDto | null = null;
    actividadesHabilitadas: Actividad[] = [];
    actividadSeleccionada: Actividad | null = null;
    userData: User | null = null;
    incentivoSeleccionadoMap: { [id: number]: boolean } = {};
    socios: Socios[] = [];
    loading: boolean = false;
    error: string | null = null;
    sociosFiltrados: Socios[] = [];
    socioSeleccionado: Socios | null = null;
    mostrarResultadosBusqueda: boolean = false;
    buscando: boolean = false;
    registrandoEntrega: boolean = false;
    verificandoSocio: boolean = false;
    socioYaRegistrado: boolean = false;
    proximoNumeroRegistro: string = '00000';
    numeroRegistro: string = '';
    imagenUrl: string | null = null;
    comprobanteVisible = false;
    fechaActual: string = '';
    horaActual: string = '';
    ultimoRegistro: Registro | null = null;
    socioSeleccionadoComprobante: Socios | null = null;
    incentivoParaComprobante: IncentivoResponseDto | null = null;
    Object = Object;
    habilitadosCount: number = 0;
    entregadosCount: number = 0;
    socioHabilitado: boolean = false;
    socioEntregado: boolean = false;
    verificandoHabilitacion: boolean = false;

    constructor(
        private actividadService: ActividadService,
        private incentivoService: IncentivoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe,
        private sociosService: SociosService,
        private registroService: RegistroService,
        private excelService: ExcelService
    ) {}

    ngOnInit(): void {
        this.actividad = {
            nombre: '',
            descripcion: '',
            incentivos: []
        };

        this.loadActividades();
        this.getUserData();
        this.loadSocios();
        this.loadHabilitadosCount();
        this.loadEntregadosCount();
    }

    loadHabilitadosCount(): void {
        if (this.actividadSeleccionada && this.actividadSeleccionada.id) {
            const actividadId = this.actividadSeleccionada.id;
            this.excelService.contarSociosPorActividad(actividadId).subscribe({
                next: (response) => {
                    if (response.exito) {
                        this.habilitadosCount = response.datos;
                    } else {
                        this.error = response.mensaje;
                    }
                },
                error: (err) => {
                    this.error = 'Error al cargar el conteo de socios. Por favor, inténtelo de nuevo.';
                }
            });
        } else {
            this.habilitadosCount = 0;
        }
    }

    loadEntregadosCount(): void {
        if (this.actividadSeleccionada && this.actividadSeleccionada.id) {
            const actividadId = this.actividadSeleccionada.id.toString();
            this.registroService.countDeliveriesByActivity(actividadId).subscribe({
                next: (response) => {
                    this.entregadosCount = typeof response.count === 'number' ? response.count : Number(response.count);
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error de contador',
                        detail: 'No se pudo cargar el número de entregas realizadas.',
                        life: 3000
                    });
                    this.entregadosCount = 0;
                }
            });
        } else {
            this.entregadosCount = 0;
        }
    }

    buscarSocios(): void {
        if (!this.busquedaSocio.trim()) {
            this.sociosFiltrados = [];
            this.mostrarResultadosBusqueda = false;
            this.socioSeleccionado = null;
            this.socioYaRegistrado = false;
            return;
        }
        this.buscando = true;
        const textoBusqueda = this.busquedaSocio.trim();
        this.sociosService.buscarSocio(textoBusqueda).subscribe({
            next: (socios) => {
                this.sociosFiltrados = socios;
                this.mostrarResultadosBusqueda = true;
                this.buscando = false;
                const coincidenciasExactas = socios.filter((s) => s.esCoincidenciaExacta);
                if (coincidenciasExactas.length > 0) {
                    this.seleccionarSocio(coincidenciasExactas[0]);
                    if (coincidenciasExactas.length > 1) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Múltiples coincidencias exactas',
                            detail: `Se encontraron ${coincidenciasExactas.length} coincidencias exactas. Se ha seleccionado la primera.`,
                            life: 5000
                        });
                    }
                } else if (socios.length === 1) {
                    this.seleccionarSocio(socios[0]);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Coincidencia aproximada',
                        detail: `Se encontró un socio que coincide parcialmente con "${textoBusqueda}".`,
                        life: 4000
                    });
                } else if (socios.length > 1) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Múltiples resultados',
                        detail: `Se encontraron ${socios.length} coincidencias parciales. Por favor seleccione el socio correcto.`,
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.buscando = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en la búsqueda',
                    detail: 'No se pudieron encontrar socios con ese criterio de búsqueda.',
                    life: 3000
                });
            }
        });
    }

    seleccionarSocio(socios: Socios): void {
        this.socioSeleccionado = socios;
        if (socios && socios.Nsocio) {
            this.cargarImagenSocio(socios.Nsocio);
        }
        this.socioSeleccionado = { ...socios };
        this.busquedaSocio = socios.Nombre || '';
        this.mostrarResultadosBusqueda = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Socio encontrado',
            detail: `Se ha seleccionado a ${socios.Nombre} (N° Socio: ${socios.Nsocio})`,
            life: 3000
        });
        this.verificarSocioActividad();
        this.verificarHabilitacionSocio();
    }

    verificarHabilitacionSocio(): void {
        if (!this.socioSeleccionado || !this.actividadSeleccionada || !this.socioSeleccionado.Nsocio || !this.actividadSeleccionada.id) {
            this.socioHabilitado = false;
            return;
        }
        this.verificandoHabilitacion = true;
        const numeroSocio = this.socioSeleccionado.Nsocio.toString();
        const idActividad = this.actividadSeleccionada.id;
        this.excelService.getSocioPorNumeroYActividad(numeroSocio, idActividad).subscribe({
            next: (response) => {
                if (response.exito) {
                    this.socioHabilitado = response.datos.habilitado;
                    this.socioEntregado = response.datos.entregado;
                    if (this.socioHabilitado && !this.socioEntregado) {
                        this.sociosService.buscarSocioCIvencido(Number(numeroSocio)).subscribe({
                            next: (socio) => {
                                if (socio && socio.ciVigente === false) {
                                    this.messageService.add({
                                        severity: 'warn',
                                        summary: 'Actualización de CI requerida',
                                        detail: `El socio ${this.socioSeleccionado?.Nombre} está habilitado pero necesita actualizar su carnet de identidad.`,
                                        life: 5000
                                    });
                                    this.excelService.inhabilitarSocio(numeroSocio, idActividad).subscribe({
                                        next: (inhabResponse) => {
                                            if (inhabResponse.exito) {
                                                this.socioHabilitado = false;
                                                this.messageService.add({
                                                    severity: 'info',
                                                    summary: 'Socio inhabilitado',
                                                    detail: `Se ha inhabilitado al socio ${this.socioSeleccionado?.Nombre} hasta que actualice su CI.`,
                                                    life: 3000
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    this.messageService.add({
                                        severity: 'info',
                                        summary: 'Socio habilitado',
                                        detail: `El socio ${this.socioSeleccionado?.Nombre} está habilitado para recibir incentivos en esta actividad.`,
                                        life: 3000
                                    });
                                }
                            },
                            error: (err) => {
                                if (this.socioHabilitado) {
                                    this.messageService.add({
                                        severity: 'info',
                                        summary: 'Socio habilitado',
                                        detail: `El socio ${this.socioSeleccionado?.Nombre} está habilitado para recibir incentivos en esta actividad.`,
                                        life: 3000
                                    });
                                }
                            },
                            complete: () => {
                                this.verificandoHabilitacion = false;
                            }
                        });
                    } else {
                        this.verificandoHabilitacion = false;
                        if (!this.socioHabilitado) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Socio inhabilitado',
                                detail: `El socio ${this.socioSeleccionado?.Nombre} no está habilitado para recibir incentivos en esta actividad.`,
                                life: 5000
                            });
                        } else if (this.socioEntregado) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Incentivo ya entregado',
                                detail: `El socio ${this.socioSeleccionado?.Nombre} ya recibió un incentivo para esta actividad.`,
                                life: 5000
                            });
                        }
                    }
                } else {
                    this.verificandoHabilitacion = false;
                    this.socioHabilitado = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Socio no encontrado',
                        detail: `El socio ${this.socioSeleccionado?.Nombre} no está registrado para esta actividad.`,
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.verificandoHabilitacion = false;
                this.socioHabilitado = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de verificación',
                    detail: `El socio ${this.socioSeleccionado?.Nombre} no está registrado para esta actividad.`,
                    life: 5000
                });
            }
        });
    }

    verificarSocioActividad(): void {
        if (!this.socioSeleccionado || !this.actividadSeleccionada) {
            return;
        }
        this.verificandoSocio = true;
        this.socioYaRegistrado = false;
        this.registroService.checkMemberIncentive(this.socioSeleccionado.Nsocio?.toString(), this.socioSeleccionado.CI, this.actividadSeleccionada.id?.toString() || '').subscribe({
            next: (response) => {
                this.verificandoSocio = false;
                this.socioYaRegistrado = response.hasReceived;
                if (this.socioYaRegistrado) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Entrega previa detectada',
                        detail: `El socio ${this.socioSeleccionado?.Nombre} ya ha recibido un incentivo para la actividad "${this.actividadSeleccionada?.nombre}". No es posible registrar una nueva entrega.`,
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.verificandoSocio = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de verificación',
                    detail: 'No se pudo verificar el historial de entregas del socio. Por favor, intente nuevamente.',
                    life: 5000
                });
            }
        });
    }

    loadSocios(): void {
        this.loading = true;
        this.error = null;
        this.sociosService.getSocios().subscribe({
            next: (data) => {
                this.socios = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Ocurrió un error al cargar los socios. Por favor intente nuevamente.';
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de carga',
                    detail: 'No se pudieron cargar los datos de socios. Por favor, refresque la página e intente nuevamente.',
                    life: 5000
                });
            }
        });
    }

    loadActividades() {
        this.actividadService.getActividades().subscribe({
            next: (data: Actividad[]) => {
                this.actividadesHabilitadas = data.filter((a) => a.estado === true);
                if (this.actividadesHabilitadas.length > 0) {
                    this.actividadSeleccionada = this.actividadesHabilitadas[0];
                    this.actividadHabilitada = this.actividadSeleccionada;
                    this.actividades.set([this.actividadSeleccionada]);
                    this.cargarIncentivosDeActividad(this.actividadSeleccionada);
                    this.obtenerProximoNumeroRegistro(this.actividadSeleccionada.id?.toString() || '');
                    this.loadEntregadosCount();
                    this.loadHabilitadosCount();

                    if (this.socioSeleccionado) {
                        this.verificarSocioActividad();
                    }
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Actividades disponibles',
                        detail: `Se han cargado ${this.actividadesHabilitadas.length} actividades habilitadas para entrega de incentivos.`,
                        life: 3000
                    });
                } else {
                    this.actividadSeleccionada = null;
                    this.actividadHabilitada = null;
                    this.incentivosDeActividad = [];
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

    cargarIncentivosDeActividad(actividad: Actividad) {
        if (!actividad || !actividad.incentivos) {
            this.incentivosDeActividad = [];
            return;
        }

        this.incentivosDeActividad = actividad.incentivos
            .filter((i) => i.cantidad !== 0 && i.cantidad !== null)
            .map((i) => ({
                id: i.id,
                nombre: i.nombre,
                descripcion: i.descripcion,
                cantidad: i.cantidad ?? 0,
                imagenBase64: i.imagenBase64
            }));
        if (this.incentivosDeActividad.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin incentivos disponibles',
                detail: `La actividad "${actividad.nombre}" no tiene incentivos disponibles para entrega.`,
                life: 4000
            });
        }
    }

    onActividadChange(event: any) {
        const actividad = event.value;
        this.actividadSeleccionada = actividad;
        this.actividadHabilitada = actividad;
        this.cargarIncentivosDeActividad(actividad);
        if (actividad && actividad.id) {
            this.obtenerProximoNumeroRegistro(actividad.id.toString());
            this.loadEntregadosCount();
            this.loadHabilitadosCount();
        }

        if (this.socioSeleccionado) {
            this.verificarSocioActividad();
            this.verificarHabilitacionSocio();
        }

        this.messageService.add({
            severity: 'info',
            summary: 'Actividad seleccionada',
            detail: `Se ha seleccionado la actividad "${actividad.nombre}"`,
            life: 3000
        });
    }

    obtenerProximoNumeroRegistro(actividadId: string): void {
        if (!actividadId) {
            return;
        }

        this.registroService.getNextRegistrationNumber(actividadId).subscribe({
            next: (response) => {
                this.proximoNumeroRegistro = response.nextRegistrationNumber;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de numeración',
                    detail: 'No se pudo obtener el número de registro para la entrega. Por favor contacte al administrador.',
                    life: 5000
                });
            }
        });
    }

    mostrarVistaPrevia(incentivo: IncentivoResponseDto) {
        this.incentivoSeleccionado = incentivo;
        this.vistaPreviaVisible = true;
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
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error de autenticación',
                            detail: 'No se pudieron obtener sus datos de usuario. Es posible que necesite iniciar sesión nuevamente.',
                            life: 5000
                        });
                    }
                });
            } catch (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de sesión',
                    detail: 'Hubo un problema con su sesión. Por favor, inicie sesión nuevamente.',
                    life: 5000
                });
            }
        }
    }

    toggleSeleccion(inc: any, event: MouseEvent): void {
        event.stopPropagation();
        const idSeleccionado = inc.id;
        if (this.incentivoSeleccionadoMap[idSeleccionado]) {
            delete this.incentivoSeleccionadoMap[idSeleccionado];
        } else {
            this.incentivoSeleccionadoMap = {};
            this.incentivoSeleccionadoMap[idSeleccionado] = true;
            this.messageService.add({
                severity: 'info',
                summary: 'Incentivo seleccionado',
                detail: `Se ha seleccionado el incentivo "${inc.nombre}" para entrega`,
                life: 3000
            });
        }
    }

    registrarEntrega(): void {
        if (!this.socioSeleccionado) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: 'Debe seleccionar un socio para continuar.',
                life: 3000
            });
            return;
        }
        if (!this.socioHabilitado) {
            this.messageService.add({
                severity: 'error',
                summary: 'Socio inhabilitado',
                detail: 'No se puede registrar la entrega porque el socio no está habilitado para esta actividad.',
                life: 5000
            });
            return;
        }

        const incentivoIdSeleccionado = Object.keys(this.incentivoSeleccionadoMap)[0];
        if (!incentivoIdSeleccionado) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: 'Debe seleccionar un incentivo para continuar.',
                life: 3000
            });
            return;
        }

        const incentivoSeleccionado = this.incentivosDeActividad.find((inc) => inc.id?.toString() === incentivoIdSeleccionado);
        if (!incentivoSeleccionado) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de sistema',
                detail: 'No se pudo encontrar el incentivo seleccionado.',
                life: 3000
            });
            return;
        }
        if (this.socioYaRegistrado || this.socioEntregado) {
            this.messageService.add({
                severity: 'error',
                summary: 'Entrega duplicada',
                detail: 'Este socio ya ha recibido un incentivo para esta actividad.',
                life: 3000
            });
            return;
        }
        this.registrandoEntrega = true;

        const nuevoRegistro: Registro = {
            registrationNumber: this.proximoNumeroRegistro,
            memberNumber: this.socioSeleccionado?.Nsocio?.toString() || '',
            memberCI: this.socioSeleccionado?.CI || '',
            memberName: this.socioSeleccionado?.Nombre || '',
            phoneNumber: this.socioSeleccionado?.Celular || '',
            email: this.socioSeleccionado?.Correo || '',
            incentiveId: incentivoSeleccionado?.id?.toString() || '',
            incentiveName: incentivoSeleccionado?.nombre || '',
            activityId: this.actividadSeleccionada?.id?.toString() || '',
            activityName: this.actividadSeleccionada?.nombre || '',
            responsibleId: this.userData?.id?.toString() || '',
            responsibleName: `${this.userData?.nombre || ''} ${this.userData?.apellidoPaterno || ''} ${this.userData?.apellidoMaterno || ''}`.trim()
        };

        this.registroService.registerDelivery(nuevoRegistro).subscribe({
            next: (response) => {
                this.ultimoRegistro = nuevoRegistro;
                if (this.socioSeleccionado?.Nsocio && this.actividadSeleccionada?.id) {
                    this.excelService.marcarSocioEntregado(this.socioSeleccionado.Nsocio.toString(), Number(this.actividadSeleccionada.id)).subscribe({
                        error: (marcadoError) => {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Advertencia',
                                detail: 'La entrega se registró, pero hubo un problema al actualizar el estado del socio.',
                                life: 5000
                            });
                        }
                    });
                }
                if (this.actividadSeleccionada?.id) {
                    this.obtenerProximoNumeroRegistro(this.actividadSeleccionada.id.toString());
                    this.loadEntregadosCount();
                }
                if (incentivoSeleccionado?.id) {
                    this.incentivoService.decrementarIncentivo(Number(incentivoSeleccionado.id)).subscribe({
                        next: (updatedIncentivo) => {
                            if (this.actividadSeleccionada) {
                                this.cargarIncentivosDeActividad(this.actividadSeleccionada);
                            }
                            this.loadActividades();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Advertencia de inventario',
                                detail: 'La entrega se registró correctamente, pero no se pudo actualizar la cantidad disponible del incentivo.',
                                life: 5000
                            });
                        }
                    });
                }
                this.registrandoEntrega = false;
                this.socioEntregado = true;
                this.socioYaRegistrado = true;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Entrega registrada exitosamente',
                    detail: `Se ha registrado la entrega N° ${response.registrationNumber} para el socio ${this.socioSeleccionado?.Nombre}. La actividad "${this.actividadSeleccionada?.nombre}" ha sido procesada correctamente.`,
                    life: 5000
                });
            },
            error: (err) => {
                this.registrandoEntrega = false;
                console.error('Error al registrar la entrega:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en el registro de entrega',
                    detail: 'No se pudo completar el registro de entrega. Por favor verifique los datos e intente nuevamente.',
                    life: 5000
                });
            }
        });
    }

    resetFormulario(): void {
        this.socioSeleccionado = null;
        this.sociosFiltrados = [];
        this.busquedaSocio = '';
        this.socioYaRegistrado = false;
        this.socioHabilitado = false;
        this.socioEntregado = false;
        this.incentivoSeleccionadoMap = {};
        this.imagenUrl = null;
        this.mostrarResultadosBusqueda = false;
    }

    imprimirDatosSocio(): void {
        if (!this.socioSeleccionado) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay datos de socio para imprimir.',
                life: 3000
            });
            return;
        }

        const contenidoImprimir = document.createElement('div');
        contenidoImprimir.style.padding = '20px';
        contenidoImprimir.style.fontFamily = 'Arial';
        contenidoImprimir.innerHTML = `
          <div style="margin-left: 40px; margin-bottom: 20px;">
            <h4 style="margin: 5px 0;">DATOS DEL SOCIO</h4>
          </div>
          <div style="margin-bottom: 10px;">
            <p><strong>Nombre:</strong> ${this.socioSeleccionado.Nombre || 'No disponible'}</p>
            <p><strong>N° de Socio:</strong> ${this.socioSeleccionado.Nsocio || 'No disponible'}</p>
            <p><strong>CI:</strong> ${this.socioSeleccionado.CI || 'No disponible'}</p>
            <p><strong>Celular:</strong> ${this.socioSeleccionado.Celular || 'No disponible'}</p>
            <p><strong>Correo:</strong> ${this.socioSeleccionado.Correo || 'No disponible'}</p>
          </div>
        `;

        const ventanaImpresion = window.open('', '_blank', 'width=600,height=600');
        if (ventanaImpresion) {
            ventanaImpresion.document.write('<html><head><title>Datos del Socio</title>');
            ventanaImpresion.document.write('<style>body { font-family: Arial; font-size: 12px; } p { margin: 5px 0; }</style>');
            ventanaImpresion.document.write('</head><body>');
            ventanaImpresion.document.write(contenidoImprimir.innerHTML);
            ventanaImpresion.document.write('</body></html>');
            ventanaImpresion.document.close();

            setTimeout(() => {
                ventanaImpresion.print();
            }, 500);
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo abrir la ventana de impresión. Por favor, verifique la configuración de bloqueo de ventanas emergentes.',
                life: 5000
            });
        }
    }

    convertImageToBase64(imgUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = imgUrl;
        });
    }

    cargarDatosDesdeBD() {
        if (!this.socioSeleccionado || !this.actividadSeleccionada) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Faltan datos',
                detail: 'Debe seleccionar un socio y una actividad.',
                life: 3000
            });
            return;
        }
        const actividadId = this.actividadSeleccionada?.id?.toString() || '';
        if (!actividadId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'La actividad seleccionada no tiene un ID válido.',
                life: 3000
            });
            return;
        }
        this.registroService.checkMemberIncentive(this.socioSeleccionado.Nsocio?.toString(), this.socioSeleccionado.CI, actividadId).subscribe({
            next: (response) => {
                if (response.hasReceived) {
                    this.registroService.getDeliveriesByActivity(actividadId).subscribe({
                        next: (registros) => {
                            const numeroSocio = this.socioSeleccionado?.Nsocio?.toString() || '';
                            const ciSocio = this.socioSeleccionado?.CI || '';
                            const registroEncontrado = registros.find((r) => (r.memberNumber === numeroSocio || r.memberCI === ciSocio) && r.activityId === actividadId);
                            if (registroEncontrado) {
                                this.ultimoRegistro = registroEncontrado;
                                this.numeroRegistro = registroEncontrado.registrationNumber || '';
                                this.socioSeleccionadoComprobante = {
                                    Nsocio: Number(registroEncontrado.memberNumber || 0),
                                    CI: registroEncontrado.memberCI || '',
                                    Nombre: registroEncontrado.memberName || '',
                                    Celular: registroEncontrado.phoneNumber || '',
                                    Correo: registroEncontrado.email || ''
                                };
                                this.incentivoParaComprobante = {
                                    id: Number(registroEncontrado.incentiveId || 0),
                                    nombre: registroEncontrado.incentiveName || '',
                                    descripcion: '',
                                    cantidad: 0,
                                    imagenBase64: ''
                                };

                                if (registroEncontrado.deliveryDate) {
                                    this.fechaActual = this.datePipe.transform(new Date(registroEncontrado.deliveryDate), 'dd/MM/yyyy', 'UTC') || '';
                                }

                                if (registroEncontrado.deliveryTime) {
                                    this.horaActual = registroEncontrado.deliveryTime || '';
                                }
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Datos cargados',
                                    detail: 'Se han cargado los datos del registro existente.',
                                    life: 3000
                                });

                                this.comprobanteVisible = true;
                            } else {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: 'No se encontró el registro para este socio y actividad.',
                                    life: 3000
                                });
                            }
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al obtener los registros de la actividad.',
                                life: 3000
                            });
                        }
                    });
                } else {
                    this.registroService.getNextRegistrationNumber(actividadId).subscribe({
                        next: (response) => {
                            this.proximoNumeroRegistro = response.nextRegistrationNumber;
                            this.socioSeleccionadoComprobante = this.socioSeleccionado;
                            const incentivoId = Object.keys(this.incentivoSeleccionadoMap)[0];
                            this.incentivoParaComprobante = this.incentivosDeActividad.find((inc) => inc.id?.toString() === incentivoId) || null;
                            const now = new Date();
                            this.fechaActual = this.datePipe.transform(now, 'dd/MM/yyyy') || '';
                            this.horaActual = this.datePipe.transform(now, 'HH:mm:ss') || '';
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Datos preparados',
                                detail: 'Se han preparado los datos para un nuevo registro.',
                                life: 3000
                            });
                            this.comprobanteVisible = true;
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al obtener el próximo número de registro.',
                                life: 3000
                            });
                        }
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al verificar si el socio ya recibió incentivo.',
                    life: 3000
                });
            }
        });
    }

    mostrarComprobante() {
        const now = new Date();
        this.fechaActual = this.datePipe.transform(now, 'dd/MM/yyyy') || '';
        this.horaActual = this.datePipe.transform(now, 'HH:mm:ss') || '';
        if (!this.socioSeleccionado && this.ultimoRegistro) {
            this.socioSeleccionadoComprobante = {
                Nsocio: Number(this.ultimoRegistro.memberNumber),
                CI: this.ultimoRegistro.memberCI,
                Nombre: this.ultimoRegistro.memberName
            };
            this.incentivoParaComprobante = {
                id: Number(this.ultimoRegistro.incentiveId),
                nombre: this.ultimoRegistro.incentiveName || '',
                descripcion: '',
                cantidad: 0,
                imagenBase64: ''
            };
        } else {
            this.socioSeleccionadoComprobante = this.socioSeleccionado;
            const incentivoId = Object.keys(this.incentivoSeleccionadoMap)[0];
            this.incentivoParaComprobante = this.incentivosDeActividad.find((inc) => inc.id?.toString() === incentivoId) || null;
        }
        this.comprobanteVisible = true;
    }

    async imprimirComprobante() {
        const contenidoComprobante = document.getElementById('comprobante-content');
        if (!contenidoComprobante) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de impresión',
                detail: 'No se pudo encontrar el contenido del comprobante.',
                life: 3000
            });
            return;
        }

        const contenidoClonado = contenidoComprobante.cloneNode(true) as HTMLElement;
        const imgLogo = contenidoClonado.querySelector('img[src*="sanmartin.png"]') as HTMLImageElement;
        if (imgLogo) {
            try {
                const logoBase64 = await this.convertImageToBase64(imgLogo.src);
                imgLogo.src = logoBase64;
            } catch (error) {}
        }

        const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
        if (!ventanaImpresion) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de impresión',
                detail: 'No se pudo abrir la ventana de impresión. Compruebe que no tenga bloqueadores de ventanas emergentes.',
                life: 5000
            });
            return;
        }
        ventanaImpresion.document.open();
        ventanaImpresion.document.write(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 10px; font-size: 14px; }
              .flex { display: flex; }
              .text-center { text-align: center; font-size: 20px; }
              .pl-80 { padding-left: 80px; }
              .pt-20 { padding-top: 20px; }

              .text-4xl.text-primary.font-bold {
                font-size: 40px !important;
                font-weight: bold !important;
                text-align: right !important;
              }
            </style>
          </head>
          <body onload="window.print()">
            ${contenidoClonado.outerHTML}
          </body>
        </html>
      `);
        ventanaImpresion.document.close();
        setTimeout(() => {
            this.resetFormulario();
        }, 1000);
    }

    handleImageError(event: any) {
        event.target.onerror = () => {
            const parentElement = event.target.parentElement;
            if (parentElement) {
                const newElement = document.createElement('div');
                newElement.className = 'border-circle shadow-3 flex align-items-center justify-content-center bg-gray-100';
                newElement.style.width = '100px';
                newElement.style.height = '100px';
                const icon = document.createElement('i');
                icon.className = 'pi pi-user';
                icon.style.fontSize = '2rem';
                icon.style.color = 'var(--primary-color)';
                newElement.appendChild(icon);
                parentElement.replaceChild(newElement, event.target);
            } else {
                event.target.style.display = 'none';
            }
        };
    }

    cargarImagenSocio(socioId: number) {
        if (socioId) {
            this.sociosService.getImagenSocio(socioId).subscribe((url) => {
                if (url) this.imagenUrl = url;
            });
        }
    }
}
