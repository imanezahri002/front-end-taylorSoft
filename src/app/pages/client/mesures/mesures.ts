import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MesureService } from '../../../shared/services/mesure.service';
import { Mesure } from '../../../core/models/mesure.model';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-mesures',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './mesures.html',
  styleUrls: ['./mesures.css']
})
export class MesuresComponent implements OnInit {
  private mesureService = inject(MesureService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  mesureForm!: FormGroup;
  mesure: Mesure | null = null;
  clientId: number | null = null;

  ngOnInit(): void {
    // Get client ID from localStorage
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      this.router.navigate(['/login']);
      return;
    }

    this.clientId = Number(userIdStr);
    this.initializeForm();
    this.loadMesure();
  }

  private initializeForm(): void {
    this.mesureForm = this.fb.group({
      tourCou: [''],
      poitrine: [''],
      taille: [''],
      manche: [''],
      longueurDos: [''],
      jambe: [''],
      epaule: [''],
      bras: [''],
    });
  }

  private loadMesure(): void {
    if (!this.clientId) return;

    this.loading.set(true);
    this.mesureService.getByClientId(this.clientId).subscribe({
      next: (mesure) => {
        this.loading.set(false);
        this.mesure = mesure;
        this.mesureForm.patchValue({
          tourCou: mesure.tourCou || '',
          poitrine: mesure.poitrine || '',
          taille: mesure.taille || '',
          manche: mesure.manche || '',
          longueurDos: mesure.longueurDos || '',
          jambe: mesure.jambe || '',
          epaule: mesure.epaule || '',
          bras: mesure.bras || '',
        });
      },
      error: (err) => {
        this.loading.set(false);
        // If 404 (no mesure found), that's okay - they can create a new one
        if (err.status !== 404) {
          this.errorMessage.set('Erreur lors du chargement des mesures.');
        }
      }
    });
  }

  onSubmit(): void {
    if (!this.mesureForm.valid || !this.clientId) {
      this.errorMessage.set('Veuillez remplir le formulaire correctement.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.mesureForm.value;
    const mesureData: Mesure = {
      clientId: this.clientId,
      tourCou: formValue.tourCou ? Number(formValue.tourCou) : undefined,
      poitrine: formValue.poitrine ? Number(formValue.poitrine) : undefined,
      taille: formValue.taille ? Number(formValue.taille) : undefined,
      manche: formValue.manche ? Number(formValue.manche) : undefined,
      longueurDos: formValue.longueurDos ? Number(formValue.longueurDos) : undefined,
      jambe: formValue.jambe ? Number(formValue.jambe) : undefined,
      epaule: formValue.epaule ? Number(formValue.epaule) : undefined,
      bras: formValue.bras ? Number(formValue.bras) : undefined,
    };

    if (this.mesure && this.mesure.id) {
      // Update existing mesure
      this.mesureService.update(this.mesure.id, mesureData).subscribe({
        next: (updatedMesure) => {
          this.submitting.set(false);
          this.mesure = updatedMesure;
          this.successMessage.set('Mesures mises à jour avec succès !');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Erreur lors de la mise à jour des mesures.');
        }
      });
    } else {
      // Create new mesure
      this.mesureService.create(mesureData).subscribe({
        next: (newMesure) => {
          this.submitting.set(false);
          this.mesure = newMesure;
          this.successMessage.set('Mesures enregistrées avec succès !');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Erreur lors de l\'enregistrement des mesures.');
        }
      });
    }
  }

  onCancel(): void {
    this.mesureForm.reset();
    if (this.mesure) {
      this.mesureForm.patchValue({
        tourCou: this.mesure.tourCou || '',
        poitrine: this.mesure.poitrine || '',
        taille: this.mesure.taille || '',
        manche: this.mesure.manche || '',
        longueurDos: this.mesure.longueurDos || '',
        jambe: this.mesure.jambe || '',
        epaule: this.mesure.epaule || '',
        bras: this.mesure.bras || '',
      });
    } else {
      this.mesureForm.reset();
    }
  }
}
