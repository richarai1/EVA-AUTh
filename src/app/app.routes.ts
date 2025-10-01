import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { PremierComponent } from './components/premier/premier.component';
import { BillsComponent } from './components/bills/bills.component';
import { PaymentComponent } from './components/payment/payment.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'premier', component: PremierComponent, canActivate: [AuthGuard] },
  { path: 'bills', component: BillsComponent },
  { path: 'small-business', component: PaymentComponent },
  { path: '**', redirectTo: '' }
];