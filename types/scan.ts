export type ScanStatus = "pending" | "running" | "completed" | "failed";

export type FindingSeverity = "info" | "low" | "medium" | "high";

export interface Finding {
  id: string;
  category:
    | "dns"
    | "ssl"
    | "hibp"
    | "headers"
    | "robots"
    | "whois"
    | "general"
    /** Eski kayıtlar (modül kaldırıldı) */
    | "shodan";
  severity: FindingSeverity;
  title: string;
  detail: string;
}

export interface ScanRawPayload {
  dns?: unknown;
  sslLabs?: unknown;
  hibp?: unknown;
  httpHeaders?: unknown;
  robots?: unknown;
  whois?: unknown;
}

export interface ScanRecord {
  id: string;
  user_id: string;
  domain: string;
  status: ScanStatus;
  score: number | null;
  findings: Finding[];
  raw_payload: ScanRawPayload | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
