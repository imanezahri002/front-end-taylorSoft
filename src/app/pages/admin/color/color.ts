import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { ColorService } from '../../../shared/services/color.service';
import { Color } from '../../../core/models/color.model';

@Component({
  selector: 'app-color',
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './color.html',
  styleUrl: './color.css',
  standalone: true
})
export class ColorComponent implements OnInit {
  colors = signal<Color[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  colorForm: FormGroup;

  constructor(
    private colorService: ColorService,
    private fb: FormBuilder
  ) {
    this.colorForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      codeHex: ['', [Validators.required, Validators.pattern(/^#[0-9A-F]{6}$/i)]],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.colorService.getAll().subscribe({
      next: (data: Color[]) => {
        console.log('Couleurs recues:', data);
        this.colors.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des couleurs:', err);
        this.error.set('Impossible de charger les couleurs. Verifiez votre connexion au serveur.');
        this.isLoading.set(false);
      },
    });
  }

  addColor(): void {
    if (this.colorForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.colorForm.value;

    this.colorService.create(formValue).subscribe({
      next: (newColor: Color) => {
        console.log('Couleur creee:', newColor);
        const currentColors = this.colors();
        this.colors.set([...currentColors, newColor]);
        this.colorForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        console.error('Erreur lors de la creation:', err);
        this.error.set('Erreur lors de la creation de la couleur.');
        this.isSubmitting.set(false);
      },
    });
  }

  deleteColor(id: number | undefined, name: string): void {
    if (!id) {
      this.error.set('ID de la couleur invalide');
      return;
    }

    if (confirm(`Etes-vous sur de vouloir supprimer "${name}" ?`)) {
      this.colorService.delete(id).subscribe({
        next: () => {
          console.log('Couleur supprimee');
          const currentColors = this.colors();
          this.colors.set(currentColors.filter((item) => item.id !== id));
        },
        error: (err: any) => {
          console.error('Erreur lors de la suppression:', err);
          this.error.set('Erreur lors de la suppression de la couleur.');
        },
      });
    }
  }

  getFormError(fieldName: string): string | null {
    const control = this.colorForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 3 caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName} ne doit pas depasser 500 caracteres`;
    }
    if (control?.hasError('pattern')) {
      return `${fieldName} doit avoir le format valide #RRGGBB`;
    }
    return null;
  }

  openPalette(picker: HTMLInputElement): void {
    picker.click();
  }

  onPaletteChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toUpperCase();
    this.colorForm.patchValue({ codeHex: value });
    this.colorForm.get('codeHex')?.markAsTouched();
    this.colorForm.get('codeHex')?.markAsDirty();
  }

  getPaletteValue(): string {
    const rawValue = (this.colorForm.get('codeHex')?.value ?? '').toString().trim();
    return /^#[0-9A-Fa-f]{6}$/.test(rawValue) ? rawValue : '#2E5090';
  }
}

