import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialog } from '../../../../pages/dashboard/settings-dialog/settings-dialog';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent {
  @Input() collapsed = false;

  constructor(private dialog: MatDialog) {}

  openSettings() {
    this.dialog.open(SettingsDialog, { width: '95vw', maxWidth: '400px' });
  }

  featureList: Array<{
    featureCode: string;
    featureName: string;
    featureIcon: string;
    featureRoute: string;
    subFeatureList?: Array<{
      featureCode: string;
      featureName: string;
      featureRoute: string;
    }>;
  }> = [
    {
      featureCode: 'DASHBOARD',
      featureName: 'Dashboard',
      featureIcon: 'dashboard',
      featureRoute: '/dashboard',
    },
    {
      featureCode: 'BILLING',
      featureName: 'Billing',
      featureIcon: 'receipt_long',
      featureRoute: '/billing',
    },
    {
      featureCode: 'PATIENT_LISTING',
      featureName: 'Patients',
      featureIcon: 'group',
      featureRoute: '/patient-listing',
    },
    {
      featureCode: 'DOCTOR_LISTING',
      featureName: 'Doctors',
      featureIcon: 'medical_services',
      featureRoute: '/doctor-listing',
    },
    {
      featureCode: 'PRODUCT_LISTING',
      featureName: 'Inventory',
      featureIcon: 'inventory_2',
      featureRoute: '/items',
    },
  ];
}
