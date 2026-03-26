import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent],
})
export class HomePage {
  // Home page logic (scroll, navigation actions, etc.)
  constructor() {}

  scrollToNext() {
    const next = document.getElementById('next-section');
    if (next) {
      next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Fallback si no existe sección objetivo
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  }
}
