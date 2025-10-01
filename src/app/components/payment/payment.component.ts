import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-container">
      <div class="background-image"></div>
    </div>
  `,
  styles: [`
    .payment-container {
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .background-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/image-12.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  `]
})
export class PaymentComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.logout();
    localStorage.clear();
  }
}
