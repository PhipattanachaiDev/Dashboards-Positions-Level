import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  setBackground(color: string) {
    document.body.style.backgroundColor = color;
  }
}
