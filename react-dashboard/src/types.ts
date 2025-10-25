export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export type VulnRow = {
  id: string;              // imageId|cve|packageName|packageVersion
  group: string;
  repo: string;
  imageId: string;
  imageName: string;
  imageVersion?: string;

  cve: string;
  severity: Severity;
  cvss?: number;
  status?: string;
  packageName?: string;
  packageVersion?: string;
  packageType?: string;
  publishedAt?: number;    // epoch ms
  fixDate?: number;        // epoch ms
  riskFactors: string[];   // keys of riskFactors object
};

export type AggSeverity = { severity: Severity | 'unknown'; count: number };

export type WorkerIn =
  | { type: 'START' };

export type WorkerOut =
  | { type: 'PROGRESS'; rowsWritten: number }
  | { type: 'DONE'; rowsWritten: number }
  | { type: 'ERROR'; message: string };
