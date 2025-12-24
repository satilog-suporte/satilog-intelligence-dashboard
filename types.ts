export interface Shipment {
  CTE: string;
  DATA_EMISSAO?: string;
  DATA_COLETA?: string;
  DATA_OCORRENCIA?: string;
  CIDADE_ORIGEM: string;
  CIDADE_DESTINO: string;
  MANIFESTO?: string;
  REMETENTE: string;
  DESTINATARIO: string;
  VALOR_NF: number;
  PESO: number;
  VOLUMES: number;
  OCORRENCIA: string;
  PREV_ENTREGA?: string;
  STATUS_PERECIVEL?: string;
  DATA_STATUS?: string;
  CIA_TRANSF: string;
  RESP_ENTREGA?: string;
  DOCUMENTOS?: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalCtes: number;
  valor: number;
  peso: number;
  volumes: number;
  deliveredCount: number;
  delayedCount: number;
  onTimeCount: number;
  expiredPerecivelCount: number;
  alerts: Shipment[];
  carriers: Record<string, { count: number; valor: number; peso: number; delays: number }>;
  occurrences: Record<string, number>;
  clients: Record<string, { count: number; valor: number }>;
  receivers: Record<string, { count: number; valor: number }>;
  allRecords: Shipment[];
}

export interface KpiModalState {
  show: boolean;
  title: string;
  icon: any;
  list: Shipment[];
}

// Augment window for CDN libraries
declare global {
  interface Window {
    XLSX: any;
    Papa: any;
  }
}