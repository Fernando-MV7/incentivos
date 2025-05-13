import { Component, OnInit, signal, ViewChild } from '@angular/core';
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
import { User, UserService } from '../../service/user.service';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { forkJoin, Observable } from 'rxjs';
import { MessageModule } from 'primeng/message';
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

@Component({
    selector: 'app-crud',
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
        MessageModule
    ],
    templateUrl: './crud-users.component.html',
    styleUrl: './crud-users.component.scss',
    providers: [MessageService, ConfirmationService, UserService]
})
export class CrudUsersComponent implements OnInit {
    userDialog: boolean = false;
    users = signal<User[]>([]);
    user!: User;
    selectedUsers!: User[] | null;
    selectedRole: string = '';
    selectedRoles: string[] = [];
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    isAuthorized: boolean = true;
    newPassword: string = '';
    showPassword: boolean = false;
    tituloDialog: string = 'Registro de Usuario';

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportPDF() {
        const doc = new jsPDF();
        doc.text('USUARIOS REGISTRADOS', 105, 15, { align: 'center' });
        const head = [['ID', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Rol']];
        const usuarios = this.users() as User[];
        const sortedUsers = [...usuarios].sort((a: User, b: User) => {
            const idA = typeof a.id === 'number' ? a.id : 0;
            const idB = typeof b.id === 'number' ? b.id : 0;
            return idA - idB;
        });

        const data = sortedUsers.map((user: User) => [String(user.id), user.nombre ?? '', user.apellidoPaterno ?? '', user.apellidoMaterno ?? '', user.userRoles?.[0]?.role?.name ?? '']);
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

        doc.save('usuarios.pdf');
    }

    ngOnInit() {
        this.user = {
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            email: '',
            username: '',
            password: '',
            userRoles: [],
            estado: true
        };
        this.loadDemoData();
    }

    loadDemoData() {
        this.userService.getUsers().subscribe({
            next: (data: User[]) => {
                this.users.set(data);
                this.messageService.add({ severity: 'info', summary: 'Carga Exitosa', detail: 'Datos de usuarios cargados correctamente.' });
            },
            error: (err) => {
                if (err.status === 401 || err.status === 403) {
                    this.isAuthorized = false;
                    this.messageService.add({ severity: 'warn', summary: 'No autorizado', detail: 'No tiene los permisos necesarios para ver la lista de usuarios.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error de Carga', detail: 'Error al cargar los datos de usuarios.' });
                }
            }
        });

        this.cols = [
            { field: 'id', header: 'ID', customExportHeader: 'Users id' },
            { field: 'nombre', header: 'NOMBRE' },
            { field: 'appat', header: 'APELLIDO PATERNO' },
            { field: 'apmat', header: 'APELLIDO MATERNO' },
            { field: 'email', header: 'EMAIL' },
            { field: 'fechcrea', header: 'FECHA DE CREACION' },
            { field: 'fechmod', header: 'FECHA DE MODIFICACION' },
            { field: 'user', header: 'USUARIO' },
            { field: 'password', header: 'PASSWORD' },
            { field: 'estado', header: 'ESTADO' },
            { field: 'rol', header: 'ROL' }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    saveUser() {
        this.submitted = true;
        if (!this.user.nombre || !this.user.email || !this.user.username || !this.user.password || !this.selectedRole) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre, email, nombre de usuario, contraseña y rol son obligatorios.'
            });
            return;
        }
        this.user.userRoles = [
            {
                role: {
                    name: this.selectedRole
                }
            }
        ];

        const estado = this.user.estado !== undefined ? this.user.estado : true;
        const isAdmin = this.selectedRole === 'ADMIN';
        const apellidoPaterno = this.user.apellidoPaterno ?? '';
        const apellidoMaterno = this.user.apellidoMaterno ?? '';
        const saveCall = isAdmin
            ? this.userService.createAdmin(this.user.nombre, apellidoPaterno, apellidoMaterno, this.user.email, this.user.username, this.user.password, estado, this.selectedRole)
            : this.userService.createUser(this.user.nombre, apellidoPaterno, apellidoMaterno, this.user.email, this.user.username, this.user.password, estado, this.selectedRole);

        this.loadDemoData();
        saveCall.subscribe({
            next: (res) => {
                this.userDialog = false;
                this.user = {
                    nombre: '',
                    apellidoPaterno: '',
                    apellidoMaterno: '',
                    email: '',
                    username: '',
                    password: '',
                    userRoles: [],
                    estado: true
                };
                this.selectedRole = '';
                this.submitted = false;
                this.loadDemoData();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Usuario creado',
                    detail: 'El usuario fue registrado exitosamente.'
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al registrar',
                    detail: err?.error?.message || 'No se pudo registrar el usuario. Intenta nuevamente.'
                });
            }
        });
    }

    openNew() {
        this.user = {};
        this.submitted = false;
        this.tituloDialog = 'Registro de Usuario';
        this.userDialog = true;
        this.messageService.add({ severity: 'info', summary: 'Nuevo Usuario', detail: 'Creando un nuevo usuario.' });
    }

    updateUser() {
        if (!this.user.nombre || !this.user.email || !this.user.username || this.selectedRoles.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Nombre, email, username y al menos un rol son obligatorios.'
            });
            return;
        }
        const userUpdateDto: any = {
            nombre: this.user.nombre,
            apellidoPaterno: this.user.apellidoPaterno,
            apellidoMaterno: this.user.apellidoMaterno,
            email: this.user.email,
            username: this.user.username
        };
        if (this.newPassword && this.newPassword.trim() !== '') {
            userUpdateDto.password = this.newPassword;
        }
        this.userService.updateUser(Number(this.user.id), userUpdateDto).subscribe({
            next: (userRes) => {
                this.userService.updateUserRoles(Number(this.user.id!), this.selectedRoles).subscribe({
                    next: (rolesRes) => {
                        this.userDialog = false;
                        this.updateForm();
                        this.loadDemoData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Actualizado',
                            detail: 'El usuario y sus roles fueron actualizados correctamente.'
                        });
                    },
                    error: (rolesErr) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error al actualizar roles',
                            detail: rolesErr?.error?.message || 'No se pudieron actualizar los roles.'
                        });
                    }
                });
            },
            error: (userErr) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al actualizar usuario',
                    detail: userErr?.error?.message || 'No se pudo actualizar el usuario.'
                });
            }
        });
    }

    editUser(user: User) {
        this.user = { ...user, password: '' };
        this.tituloDialog = 'Actualizar Datos de Usuario';
        this.userDialog = true;
        this.submitted = false;
        this.selectedRoles = user.userRoles?.map((userRole) => userRole?.role?.name) || [];
        this.messageService.add({ severity: 'info', summary: 'Editar Usuario', detail: `Editando usuario: ${user.nombre}.` });
    }

    updateForm() {
        this.user = {};
        this.newPassword = '';
        this.selectedRoles = [];
    }

    deleteSelectedUsers() {
        if (!this.selectedUsers || this.selectedUsers.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No se han seleccionado usuarios para eliminar.' });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los usuarios seleccionados permanentemente?',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete: number[] = this.selectedUsers!.map((user) => +user.id!);
                forkJoin(idsToDelete.map((id) => this.userService.deleteUser(id))).subscribe({
                    next: (responses: any[]) => {
                        this.users.set(this.users().filter((user) => !this.selectedUsers?.some((selectedUser) => selectedUser.id === user.id)));
                        this.selectedUsers = null;
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuarios eliminados.' });
                    },
                    error: (error: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se eliminaron los usuarios seleccionados.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: 'La eliminación de los usuarios seleccionados fue cancelada.' });
            }
        });
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: `Desea Eliminar al usuario: ${user.nombre}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.deleteUser(+user.id!).subscribe({
                    next: (response) => {
                        this.users.set(this.users().filter((val) => val.id !== user.id));
                        this.user = {};
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado permanentemente.' });
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Eliminación Cancelada', detail: `La eliminación del usuario ${user.nombre} fue cancelada.` });
            }
        });
    }

    resetForm() {
        this.user = {
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            email: '',
            username: '',
            password: '',
            userRoles: [],
            estado: true
        };
        this.selectedRoles = [];
        this.submitted = false;
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
        this.resetForm();
        this.messageService.add({ severity: 'info', summary: 'Diálogo Cerrado', detail: 'Se cerró el diálogo de usuario.' });
    }

    toggleEstado(user: any) {
        if (!user.estado) {
            this.userService.estadoTruUser(user.id).subscribe(() => {
                this.loadDemoData();
                this.messageService.add({ severity: 'success', summary: 'Estado Activado', detail: `Usuario ${user.nombre} activado.` });
            });
        } else {
            this.userService.estadoFalseUser(user.id).subscribe(() => {
                this.loadDemoData();
                this.messageService.add({ severity: 'warn', summary: 'Estado Desactivado', detail: `Usuario ${user.nombre} desactivado.` });
            });
        }
        user.estado = !user.estado;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}
