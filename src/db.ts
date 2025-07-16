import Dexie, { type Table } from 'dexie';   // legg til `type`

export interface CheckItemState {
  id: string;          // f.eks. "gelcoat"
  state: 'ok' | 'obs' | 'kritisk';
  note?: string;
  photo?: string;      // Base64‑url
}

class VVDatabase extends Dexie {
  items!: Table<CheckItemState>;

  constructor() {
    super('visningsveilederen');
    this.version(1).stores({
      items: 'id'
    });
  }
}

export const db = new VVDatabase();