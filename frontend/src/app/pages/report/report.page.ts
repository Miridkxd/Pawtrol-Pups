import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterModule 
  ]
})
export class ReportPage implements OnInit {

  @ViewChild(IonContent) content!: IonContent;

  isModalOpen = false; // 👈 control del modal

  constructor() { }

  ngOnInit() {}

  // --- OPEN ---
  openModal(): void {
    this.isModalOpen = true;
  }

  // --- CLOSE (general) ---
  closeModal(): void {
    this.isModalOpen = false;
  }

  // --- CLOSE clicking outside ---
  onOverlayClick(event: any): void {
    if (event.target.classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

}
