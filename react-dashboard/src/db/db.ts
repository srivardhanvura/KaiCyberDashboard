import Dexie, { Table } from "dexie";

export type Chunk = {
  id?: number;
  seq: number;
  data: string;
};

class DemoDB extends Dexie {
  chunks!: Table<Chunk, number>;

  constructor() {
    super("ui-dashboard-db");
    this.version(1).stores({
      chunks: "++id, seq"
    });
  }
}

export const db = new DemoDB();
