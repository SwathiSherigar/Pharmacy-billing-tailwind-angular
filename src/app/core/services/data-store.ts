import { Injectable, signal, computed, effect } from '@angular/core';
import { IndexedDbService } from './indexed-db';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  patients = signal<any[]>([]);
  doctors  = signal<any[]>([]);
  bills    = signal<any[]>([]);

  constructor(private db: IndexedDbService) {
    this.loadAll();
  }

  async loadAll() {
    this.patients.set(await this.db.getAll('patients'));
    this.doctors.set(await this.db.getAll('doctors'));
    this.bills.set(await this.db.getAll('bills'));
  }

  async updatePatient(patient: any) {
    await this.db.update('patients', patient);
    this.patients.update(p =>
      p.map(x => x.id === patient.id ? patient : x)
    );
  }

  async updateDoctor(doctor: any) {
    await this.db.update('doctors', doctor);
    this.doctors.update(d =>
      d.map(x => x.id === doctor.id ? doctor : x)
    );
  }

  async addBill(bill: any) {
    const id = await this.db.add('bills', bill);
    this.bills.update(b => [...b, { ...bill, id }]);
  }

enrichedBills = computed(() => {
  const patientMap = new Map(
    this.patients().map(p => [p.id, p])
  );
  const doctorMap = new Map(
    this.doctors().map(d => [d.id, d])
  );

  return this.bills()
    .map(b => {
      const patient = patientMap.get(b.patientId);
      const doctor = doctorMap.get(b.doctorId);

      if (!patient || !doctor) return null;

      return {
        ...b,
        patient,
        doctor
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
});


async saveOrGetPatient(patient: any) {
  const saved = await this.db.saveIfNotExists('patients', patient, 'name');

  this.patients.update(p =>
    p.some(x => x.id === saved.id) ? p : [...p, saved]
  );

  return saved;
}

async saveOrGetDoctor(doctor: any) {
  const saved = await this.db.saveIfNotExists('doctors', doctor, 'name');

  this.doctors.update(d =>
    d.some(x => x.id === saved.id) ? d : [...d, saved]
  );

  return saved;
}


}
