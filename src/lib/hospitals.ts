import fs from 'fs';
import path from 'path';

export interface Hospital {
  name: string;
  address: string;
  postalcode: string;
  city: string;
}

export class Hospitals {
  static load(): Hospital[] {
    const file = path.join(process.cwd(), 'old', 'hospitals.csv');
    if (!fs.existsSync(file)) throw new Error('hospitals.csv not found');
    const lines = fs.readFileSync(file, 'utf-8').trim().split(/\r?\n/);
    lines.shift();
    const hospitals: Hospital[] = [];
    for (const line of lines) {
      const row = line.split(';');
      if (row[4] === 'Buitenpolikliniek') continue;
      hospitals.push({
        name: row[3],
        address: row[5],
        postalcode: row[6],
        city: row[7],
      });
    }
    return hospitals;
  }

  static find(location: string): Hospital | undefined {
    const index: Record<string, number> = {};
    const hospitals = Hospitals.load();
    hospitals.forEach((h, i) => {
      index[h.name.toLowerCase()] = i;
      index[`${h.name.toLowerCase()}, ${h.city.toLowerCase()}`] = i;
    });
    const key = location.toLowerCase();
    return index[key] !== undefined ? hospitals[index[key]] : undefined;
  }

  static findAddress(location: string): string | undefined {
    const hospital = Hospitals.find(location);
    return hospital ? `${hospital.address}, ${hospital.city}` : undefined;
  }
}
