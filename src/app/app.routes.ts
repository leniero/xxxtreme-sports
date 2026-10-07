import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'XXXtreme Sports' },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop),
    title: 'Shop all — XXXtreme Sports',
  },
  {
    path: 'p/:handle',
    loadComponent: () => import('./pages/product/product').then((m) => m.ProductPage),
  },
  { path: '**', redirectTo: '' },
];
