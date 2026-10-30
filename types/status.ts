export interface SubsystemStatus {
  id: string;
  name: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN" | string;
  description: string;
}

export interface SystemTelemetry {
  status: "OPERATIONAL" | "DEGRADED" | "DOWN" | string;
  timestamp: string;
  gateway: {
    service: string;
    version: string;
    status: string;
    uptimeSeconds: number;
    usedMemoryMb: number;
    maxMemoryMb: number;
    activeThreads: number;
  };
  database: {
    provider: string;
    status: string;
    pingMs: number;
    error?: string;
  };
  subsystems: SubsystemStatus[];
  incidents: {
    id: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }[];
}
