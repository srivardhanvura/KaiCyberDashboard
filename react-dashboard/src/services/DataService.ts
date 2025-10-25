import { db } from "../db/db";

export interface IngestionStatus {
  isIngesting: boolean;
  progress: number;
  totalRows: number;
  error: string | null;
}

class DataService {
  private worker: Worker | null = null;
  private status: IngestionStatus = {
    isIngesting: false,
    progress: 0,
    totalRows: 0,
    error: null
  };
  private listeners: ((status: IngestionStatus) => void)[] = [];

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      const count = await db.vulns.count();
      const aggCount = await db.aggSeverity.count();
      console.log(`Found ${count} existing vulnerabilities and ${aggCount} aggregate records in database`);
      
      if (count > 0) {
        this.status.totalRows = count;
        this.status.isIngesting = false;
        this.status.progress = 100;
        this.status.error = null;
        
        // Check if aggregates exist, if not regenerate them
        if (aggCount === 0) {
          console.log('No aggregates found, regenerating...');
          await this.regenerateAggregates();
        }
        
        this.notifyListeners();
        console.log('Data already exists, skipping ingestion');
      } else {
        console.log('No existing data found');
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      this.status.error = 'Failed to check existing data';
      this.notifyListeners();
    }
  }

  public async hasData(): Promise<boolean> {
    try {
      const count = await db.vulns.count();
      return count > 0;
    } catch (error) {
      console.error('Error checking for data:', error);
      return false;
    }
  }

  public startIngestion(): void {
    if (this.status.isIngesting) {
      console.log('Ingestion already in progress');
      return;
    }

    console.log('Starting data ingestion...');
    this.status = {
      isIngesting: true,
      progress: 0,
      totalRows: 0,
      error: null
    };
    this.notifyListeners();

    try {
      this.worker = new Worker(new URL("../worker/worker-streaming.ts", import.meta.url), {
        type: "module",
      });

      this.worker.onmessage = (e: MessageEvent<any>) => {
        const msg = e.data;
        if (msg?.type === "PROGRESS") {
          this.status.progress = Math.min((msg.rowsWritten / 250000) * 100, 100);
          this.status.totalRows = msg.rowsWritten;
          this.notifyListeners();
        } else if (msg?.type === "DONE") {
          this.status.isIngesting = false;
          this.status.progress = 100;
          this.status.totalRows = msg.rowsWritten;
          this.notifyListeners();
          this.cleanup();
        } else if (msg?.type === "ERROR") {
          this.status.isIngesting = false;
          this.status.error = msg.message;
          this.notifyListeners();
          this.cleanup();
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.status.isIngesting = false;
        this.status.error = `Worker error: ${error.message || 'Unknown error'}`;
        this.notifyListeners();
        this.cleanup();
      };

      this.worker.postMessage({ type: "START" });
    } catch (error) {
      console.error('Failed to create worker:', error);
      this.status.isIngesting = false;
      this.status.error = `Failed to create worker: ${error}`;
      this.notifyListeners();
    }
  }

  public getStatus(): IngestionStatus {
    return { ...this.status };
  }

  public subscribe(listener: (status: IngestionStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.status }));
  }

  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  public async regenerateAggregates(): Promise<void> {
    try {
      console.log('Regenerating severity aggregates...');
      
      // Get all vulnerabilities and count by severity
      const allVulns = await db.vulns.toArray();
      const sevCounts = new Map<string, number>();
      
      allVulns.forEach(vuln => {
        const severity = vuln.severity;
        sevCounts.set(severity, (sevCounts.get(severity) || 0) + 1);
      });
      
      console.log('Calculated severity counts:', Object.fromEntries(sevCounts));
      
      // Clear and repopulate aggregates
      await db.transaction("rw", db.aggSeverity, async () => {
        await db.aggSeverity.clear();
        const rows = Array.from(sevCounts.entries()).map(([severity, count]) => ({
          severity: severity as any,
          count
        }));
        
        if (rows.length) {
          await db.aggSeverity.bulkPut(rows);
          console.log('Aggregates regenerated successfully:', rows);
        }
      });
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error regenerating aggregates:', error);
    }
  }

  public async clearData(): Promise<void> {
    try {
      await db.transaction("rw", db.vulns, db.aggSeverity, async () => {
        await db.vulns.clear();
        await db.aggSeverity.clear();
      });
      this.status = {
        isIngesting: false,
        progress: 0,
        totalRows: 0,
        error: null
      };
      this.notifyListeners();
      console.log('Data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.status.error = 'Failed to clear data';
      this.notifyListeners();
    }
  }

  public destroy(): void {
    this.cleanup();
    this.listeners = [];
  }
}

export const dataService = new DataService();
