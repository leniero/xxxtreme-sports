import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe } from '../../core/money.pipe';

@Component({
  selector: 'app-cart-drawer',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
  host: {
    '[class.open]': 'cart.isOpen()',
    '(document:keydown.escape)': 'cart.close()',
  },
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
}
