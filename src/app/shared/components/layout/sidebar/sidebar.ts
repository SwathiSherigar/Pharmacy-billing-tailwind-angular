import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [MatIconModule, RouterModule],
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
        featureIcon: 'person',
        featureRoute: '/dashboard',
      },
      {
        featureCode: 'BILLING',
        featureName: 'Billing',
        featureIcon: 'receipt_long',
        featureRoute: '/billing',
        // subFeatureList: [
        //   {
        //     featureCode: 'BILLING_MAIN',
        //     featureName: 'Billing',
        //     featureRoute: '/billing',
        //   },
        // ],
      },
      {
        featureCode: 'PATIENT_LISTING',
        featureName: 'Patients',
        featureIcon: 'receipt_long',
        featureRoute: '/patient-listing'
      },
      {
        featureCode: 'DOCTOR_LISTING',
        featureName: 'Doctor',
        featureIcon: 'person',
        featureRoute: '/doctor-listing'
      }
    ];

}
