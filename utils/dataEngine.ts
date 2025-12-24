import { Shipment, DashboardStats } from '../types';

export const DataEngine = {
  mapHeaders: (headers: any[]): Record<number, string> => {
    const mapping: Record<number, string> = {};
    let dataOccurrences = 0;
    let cidadeOccurrences = 0;

    headers.forEach((h, index) => {
      if (!h) return;
      const clean = h.toString().toUpperCase()
        .replace(/['"]/g, '')
        .replace(/&AACUTE;/g, 'A')
        .replace(/&[A-Z0-9]+;/gi, '')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();

      if (clean === 'DATA') {
        dataOccurrences++;
        if (dataOccurrences === 1) mapping[index] = 'DATA_EMISSAO';
        else if (dataOccurrences === 2) mapping[index] = 'DATA_COLETA';
        else mapping[index] = 'DATA_OCORRENCIA';
      } else if (clean === 'CIDADE') {
        cidadeOccurrences++;
        mapping[index] = cidadeOccurrences === 1 ? 'CIDADE_ORIGEM' : 'CIDADE_DESTINO';
      } else if (clean.includes('M D')) mapping[index] = 'MANIFESTO';
      else if (clean === 'CTE') mapping[index] = 'CTE';
      else if (clean.includes('REMETENT')) mapping[index] = 'REMETENTE';
      else if (clean.includes('DESTINAT')) mapping[index] = 'DESTINATARIO';
      else if (clean.includes('NF VALOR') || clean === 'VALOR_NF') mapping[index] = 'VALOR_NF';
      else if (clean === 'PESO') mapping[index] = 'PESO';
      else if (clean === 'VOLUMES') mapping[index] = 'VOLUMES';
      else if (clean.includes('OCORRENCIA')) mapping[index] = 'OCORRENCIA';
      else if (clean.includes('PREV')) mapping[index] = 'PREV_ENTREGA';
      else if (clean.includes('STATUS PEREC')) mapping[index] = 'STATUS_PERECIVEL';
      else if (clean.includes('DATA STATUS')) mapping[index] = 'DATA_STATUS';
      else if (clean.includes('CIA TRANSF')) mapping[index] = 'CIA_TRANSF';
      else if (clean.includes('RESP') && clean.includes('ENTREGA')) mapping[index] = 'RESP_ENTREGA';
      else if (clean.includes('NFS/DOC')) mapping[index] = 'DOCUMENTOS';
      else {
        mapping[index] = clean.replace(/\s+/g, '_').replace(/[./-]/g, '');
      }
    });
    return mapping;
  },

  isDelivered: (occurrence?: string, statusPerecivel?: string): boolean => {
    const occ = (occurrence || "").toString().toUpperCase();
    const status = (statusPerecivel || "").toString().toUpperCase();
    
    // Se o status do perecível for FINALIZADO, considera entregue
    if (status.includes("FINALIZADO")) return true;

    // Lista expandida de termos que indicam sucesso na entrega na ocorrência
    return (
        occ.includes("ENTREGUE") || 
        occ.includes("FINALIZADO") || 
        occ.includes("EFETUADA") || 
        occ.includes("REALIZADA") || 
        occ.includes("CONCLUIDA") || 
        occ.includes("CONCLUÍDA") || 
        occ.includes("COMPROVANTE") || 
        occ.includes("BAIXA") ||
        occ.includes("F ORIAS COLETIVAS")
    );
  },

  isLateDeadline: (prevEntrega?: string, occurrence?: string, statusPerecivel?: string): boolean => {
    // Se já foi entregue (considerando ocorrência e status perecível), não é atraso
    if (DataEngine.isDelivered(occurrence, statusPerecivel)) return false;
    if (!prevEntrega) return false;
    try {
      const s = String(prevEntrega).trim();
      let deadline: Date | undefined;
      
      // Handle Date/Time string "DD/MM/YYYY HH:MM"
      if (s.includes('/') && s.includes(':')) {
        const [datePart, timePart] = s.split(' ');
        const [d, m, y] = datePart.split('/');
        deadline = new Date(`${y}-${m}-${d}T${timePart}`);
      } 
      // Handle "YYYY-MM-DD"
      else if (s.includes('-')) {
        deadline = new Date(s.replace(' ', 'T'));
      } 
      // Handle Excel Serial Date
      else {
        const num = parseFloat(s);
        if (!isNaN(num) && num > 30000) {
            // Excel base date (Dec 30 1899) correction
            deadline = new Date(Math.round((num - 25569) * 86400 * 1000));
        }
      }
      
      if (deadline && !isNaN(deadline.getTime())) {
          return new Date() > deadline;
      }
      return false;
    } catch (e) { return false; }
  },

  isTrulyExpired: (status?: string, occurrence?: string): boolean => {
    // Passamos status como segundo argumento para verificar se está finalizado via status perecível
    if (DataEngine.isDelivered(occurrence, status)) return false;
    const s = String(status || "").toUpperCase();
    return s.includes("VENCIDO") && !s.includes("NAO VENCIDO") && !s.includes("NAO APLICAVEL");
  },

  getAlertReason: (row: Shipment): string => {
    const isLate = DataEngine.isLateDeadline(row.PREV_ENTREGA, row.OCORRENCIA, row.STATUS_PERECIVEL);
    const isExpired = DataEngine.isTrulyExpired(row.STATUS_PERECIVEL, row.OCORRENCIA);
    
    if (isLate && isExpired) return "ATRASO + VENCIMENTO";
    if (isExpired) return "PERECÍVEL VENCIDO";
    if (isLate) return "PRAZO EXCEDIDO";
    if (String(row.STATUS_PERECIVEL).toUpperCase().includes("HORAS")) return "RISCO VENCIMENTO";
    return "EM FLUXO";
  },

  formatDisplayDate: (val?: any): string => {
    if (!val) return "N/A";
    let s = String(val).trim().replace(/['"]/g, '');
    if (s === "" || s === "N/A" || s === "0" || s === "NAO APLICAVEL" || s === "NÃO APLICÁVEL") return "N/A";
    
    const num = parseFloat(s);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      try {
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        return date.toLocaleDateString('pt-BR');
      } catch (e) { return s; }
    }
    if (s.includes('-')) {
        // Assume YYYY-MM-DD
        try {
            const parts = s.split(' ')[0].split('-');
            if(parts.length === 3) return parts.reverse().join('/');
        } catch(e) { return s; }
    }
    return s.substring(0, 10);
  },

  parseNumeric: (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let clean = val.toString().replace(/['"]/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    let num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  },

  sanitize: (val: any): string => {
    if (val === null || val === undefined) return "";
    let s = String(val).replace(/['"]/g, '').replace(/&[A-Z0-9]+;/gi, '').trim();
    return s.toUpperCase();
  },

  processDataRows: (headers: any[], rows: any[]): DashboardStats => {
    const mapping = DataEngine.mapHeaders(headers);
    const stats: DashboardStats = {
      totalCtes: 0, valor: 0, peso: 0, volumes: 0,
      deliveredCount: 0, delayedCount: 0, onTimeCount: 0, expiredPerecivelCount: 0,
      alerts: [], carriers: {}, occurrences: {}, clients: {}, receivers: {},
      allRecords: []
    };
    
    rows.forEach((rowArray) => {
      if (!rowArray || rowArray.length < 5) return;
      const row: any = {};
      rowArray.forEach((cell: any, idx: number) => { 
          if (mapping[idx]) row[mapping[idx]] = cell; 
      });
      
      if (!row.CTE && !row.MANIFESTO) return;
      
      row.CIDADE_ORIGEM = DataEngine.sanitize(row.CIDADE_ORIGEM);
      row.CIDADE_DESTINO = DataEngine.sanitize(row.CIDADE_DESTINO);
      row.REMETENTE = DataEngine.sanitize(row.REMETENTE);
      row.DESTINATARIO = DataEngine.sanitize(row.DESTINATARIO);

      stats.allRecords.push(row);

      const val = DataEngine.parseNumeric(row.VALOR_NF);
      const p = DataEngine.parseNumeric(row.PESO);
      const v = parseInt(row.VOLUMES) || 0;
      const carrier = DataEngine.sanitize(row.CIA_TRANSF || "PRÓPRIO");
      const client = row.REMETENTE || "NÃO INFORMADO";
      const receiver = row.DESTINATARIO || "NÃO INFORMADO";
      const occurrence = DataEngine.sanitize(row.OCORRENCIA || "SEM OCORRÊNCIA");
      const statusP = DataEngine.sanitize(row.STATUS_PERECIVEL || "");

      stats.totalCtes++;
      stats.valor += val;
      stats.peso += p;
      stats.volumes += v;

      const isDelivered = DataEngine.isDelivered(occurrence, statusP);
      const isLate = DataEngine.isLateDeadline(row.PREV_ENTREGA, occurrence, statusP);
      const isExpired = DataEngine.isTrulyExpired(statusP, occurrence);
      
      if (isDelivered) stats.deliveredCount++;
      if (isLate) stats.delayedCount++;
      // Se não está atrasado, está no prazo (seja entregue ou em trânsito dentro do prazo)
      if (!isLate) stats.onTimeCount++;
      if (isExpired) stats.expiredPerecivelCount++;

      const isRisco = statusP.includes("HORAS") && !isDelivered;

      if (isLate || isExpired || isRisco) {
        stats.alerts.push({ ...row, status: statusP, val: val, urgent: isExpired || isLate });
      }

      // Carriers Aggregation
      if (!stats.carriers[carrier]) stats.carriers[carrier] = { count: 0, valor: 0, peso: 0, delays: 0 };
      stats.carriers[carrier].count++;
      stats.carriers[carrier].valor += val;
      stats.carriers[carrier].peso += p;
      if (isLate || isExpired) stats.carriers[carrier].delays++;

      // Clients Aggregation
      if (!stats.clients[client]) stats.clients[client] = { count: 0, valor: 0 };
      stats.clients[client].count++;
      stats.clients[client].valor += val;

      // Receivers Aggregation
      if (!stats.receivers[receiver]) stats.receivers[receiver] = { count: 0, valor: 0 };
      stats.receivers[receiver].count++;
      stats.receivers[receiver].valor += val;

      // Occurrence Aggregation
      if (occurrence && occurrence !== "NAO APLICAVEL") {
        stats.occurrences[occurrence] = (stats.occurrences[occurrence] || 0) + 1;
      }
    });
    return stats;
  }
};