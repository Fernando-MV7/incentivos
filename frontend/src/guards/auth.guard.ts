import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const token = sessionStorage.getItem('token');

        if (!token) {
            this.router.navigate(['/']);
            return false;
        }

        try {
            const decoded: any = jwtDecode(token);
            const now = Date.now().valueOf() / 1000;

            if (decoded.exp < now) {
                sessionStorage.removeItem('token');
                this.router.navigate(['/']);
                return false;
            }

            return true;
        } catch (e) {
            sessionStorage.removeItem('token');
            this.router.navigate(['/']);
            return false;
        }
    }
}
