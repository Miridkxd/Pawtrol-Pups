import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, chatbubbleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-n-user',
  templateUrl: './n-user.page.html',
  styleUrls: ['./n-user.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class NUserPage implements OnInit {

  @ViewChild(IonContent) content!: IonContent;

  constructor(private router: Router) {
    addIcons({ personCircleOutline, chatbubbleOutline });
  }

  ngOnInit() {}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToSignIn() {
    this.router.navigate(['/sign-in']);
  }

  // Método de scroll suave (opcional, conservado)
  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (!el) return;

    this.content.getScrollElement().then(scrollEl => {
      const start    = scrollEl.scrollTop;
      const end      = el.offsetTop - 80;
      const duration = 700;
      let startTime  = 0;

      const easeInOut = (t: number) =>
        t < 0.5
          ? 2 * t * t
          : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const animate = (time: number) => {
        if (!startTime) startTime = time;

        const progress = (time - startTime) / duration;
        const eased    = easeInOut(Math.min(progress, 1));

        scrollEl.scrollTop = start + (end - start) * eased;

        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }
}