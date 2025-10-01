import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { PremierComponent } from './components/premier/premier.component';
import { BillsComponent } from './components/bills/bills.component';
import { PaymentComponent } from './components/payment/payment.component';
import { SmallBusinessComponent } from './components/small-business/small-business.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'premier', component: PremierComponent, canActivate: [AuthGuard] },
  { path: 'bills', component: BillsComponent },
  { path: 'payment', component: PaymentComponent },
  { path: 'small-business', component: SmallBusinessComponent },
  { path: '**', redirectTo: '' }
];