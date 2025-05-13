import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../layout/component/app.floatingconfigurator';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, HttpClientModule, CommonModule], // Agrega HttpClientModule y CommonModule
    templateUrl: './auth.component.html',
    styleUrl: './auth.component.scss',
    host: {
        '(document:keydown.enter)': 'onEnterKey($event)'
    }
})
export class AuthComponent implements OnInit {
    onEnterKey(event: KeyboardEvent) {
        this.onSubmit();
    }
    username: string = '';
    password: string = '';
    checked: boolean = false;
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {}

    onSubmit(): void {
        this.authService.login(this.username, this.password).subscribe({
            next: (response) => {
                sessionStorage.setItem('token', response.token);
                this.router.navigate(['/layout']);
            },
            error: (error) => {
                this.errorMessage = 'Credenciales inválidas';
                console.error('Error de autenticación:', error);
            }
        });
    }
}
