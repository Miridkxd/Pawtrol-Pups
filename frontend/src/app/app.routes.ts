import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'maps',
    loadComponent: () => import('./pages/maps/maps.page').then( m => m.MapsPage)
  },
  {
    path: 'report',
    loadComponent: () => import('./pages/report/report.page').then( m => m.ReportPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'n-user',
    loadComponent: () => import('./auth/n-user/n-user.page').then( m => m.NUserPage)
  },
  {
    path: 'user',
    loadComponent: () => import('./auth/user/user.page').then( m => m.UserPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./auth/chat/chat.page').then( m => m.ChatPage)
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./auth/sign-in/sign-in.page').then( m => m.SignInPage)
  },
];
