import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent {
  @Input() collapsed = false;

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
