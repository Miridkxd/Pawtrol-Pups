import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterModule 
  ]
})
export class RegisterPage implements OnInit {

  @ViewChild(IonContent) content!: IonContent;

  constructor() { }

  ngOnInit() {}

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
