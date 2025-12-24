import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, FileText, Package, Truck, DollarSign, ChevronRight, 
  Clock, CheckCircle2, AlertTriangle, Activity, Users, Target, ShieldAlert, X,
  LayoutDashboard, Search, CalendarCheck, BarChart3, Info, ArrowUpRight
} from 'lucide-react';
import { DashboardStats, Shipment, KpiModalState } from './types';
import { DataEngine } from './utils/dataEngine';
import KpiCard from './components/KpiCard';
import DetailsModal from './components/DetailsModal';
import ListDetailsModal from './components/ListDetailsModal';
import MarqueeAlerts from './components/MarqueeAlerts';

const SATILOG_LOGO = "https://i.imgur.com/PbEgdD4.png";

// Sub-component for Chart Items with Tooltip
const StatBarItem = ({ 
  label, 
  count, 
  total, // Used for Visual Bar Width scaling
  globalTotal, // Used for the actual Percentage Text
  colorClass, 
  barColorClass, 
  icon: Icon, 
  onClick,
  className = ""
}: { 
  label: string; 
  count: number; 
  total: number; 
  globalTotal?: number;
  colorClass: string; 
  barColorClass: string; 
  icon?: any; 
  onClick: () => void; 
  className?: string;
}) => {
  // Visual width calculation
  const visualPercent = total > 0 ? ((count / total) * 100) : 0;
  
  // Statistical percentage text
  const realBase = globalTotal || total;
  const statPercent = realBase > 0 ? ((count / realBase) * 100) : 0;
  
  return (
    <div onClick={onClick} className={`group relative cursor-pointer p-2.5 rounded-xl bg-white/40 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 ${className}`}>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-3 rounded-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-20 shadow-xl flex flex-col gap-1.5">
         <div className="font-bold text-xs border-b border-slate-600 pb-1 mb-1 leading-tight">{label}</div>
         <div className="flex justify-between items-center"><span className="text-slate-400">Volume:</span> <span className="font-mono font-bold text-xs">{count}</span></div>
         <div className="flex justify-between items-center"><span className="text-slate-400">% do Volume Total:</span> <span className="font-mono font-bold text-xs text-emerald-400">{statPercent.toFixed(1)}%</span></div>
         {/* Arrow */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
      </div>

      <div className="flex justify-between items-end mb-1.5 relative z-10">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
             {Icon && <div className={`p-1 rounded-md bg-white shadow-sm ${colorClass}`}><Icon size={10} /></div>}
             <span className="text-[10px] font-bold text-slate-600 truncate max-w-[180px]">{label}</span>
          </div>
          <span className={`text-[10px] font-black ${colorClass}`}>{count}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100/80 rounded-full overflow-hidden relative z-10">
          <div className={`h-full rounded-full ${barColorClass} transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${visualPercent}%` }}></div>
      </div>
    </div>
  );
};

export default function App() {
  const [rawData, setRawData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [kpiModal, setKpiModal] = useState<KpiModalState>({ show: false, title: '', icon: null, list: [] });
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Load scripts dynamically (legacy support)
  useEffect(() => {
    const loadScripts = async () => {
      const scripts = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js', id: 'papa' },
        { url: 'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js', id: 'xlsx' }
      ];
      for (const s of scripts) {
        if (!document.getElementById(s.id)) {
          const script = document.createElement('script');
          script.src = s.url; script.id = s.id;
          script.async = true;
          await new Promise((r) => { script.onload = r; document.head.appendChild(script); });
        }
      }
    };
    loadScripts();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    
    // Tiny delay to allow UI to update loading state
    setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (evt) => {
        try {
            if (file.name.match(/\.(xlsx|xls)$/)) {
            const workbook = window.XLSX.read(evt.target?.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            if (rawRows.length > 0) {
                const processed = DataEngine.processDataRows(rawRows[0], rawRows.slice(1));
                setRawData(processed);
            }
            } else {
            const text = new TextDecoder("iso-8859-1").decode(evt.target?.result as ArrayBuffer);
            window.Papa.parse(text, { 
                skipEmptyLines: true, 
                complete: (results: any) => { 
                if (results.data.length > 0) {
                    const processed = DataEngine.processDataRows(results.data[0], results.data.slice(1));
                    setRawData(processed);
                } 
                } 
            });
            }
        } catch (err) { 
            alert("Erro no processamento do ficheiro. Verifique o formato."); 
            console.error(err);
        } finally { 
            setLoading(false); 
        }
        };
        if (file.name.match(/\.(xlsx|xls)$/)) reader.readAsBinaryString(file);
        else reader.readAsArrayBuffer(file);
    }, 800); // Artificial delay for better UX feeling
  };

  const openDeliveredKpi = () => setKpiModal({ 
      show: true, 
      title: 'Remessas Entregues', 
      icon: CheckCircle2, 
      list: rawData?.allRecords.filter(r => DataEngine.isDelivered(r.OCORRENCIA, r.STATUS_PERECIVEL)) || [] 
  });
  
  const openDelayedKpi = () => setKpiModal({ 
      show: true, 
      title: 'Atrasos de Entrega', 
      icon: Clock, 
      list: rawData?.allRecords.filter(r => DataEngine.isLateDeadline(r.PREV_ENTREGA, r.OCORRENCIA, r.STATUS_PERECIVEL)) || []
  });
  
  const openExpiredKpi = () => setKpiModal({ 
      show: true, 
      title: 'Perecíveis Vencidos', 
      icon: AlertTriangle, 
      list: rawData?.allRecords.filter(r => DataEngine.isTrulyExpired(r.STATUS_PERECIVEL, r.OCORRENCIA)) || []
  });

  const openOnTimeKpi = () => setKpiModal({ 
      show: true, 
      title: 'Dentro do Prazo', 
      icon: CalendarCheck, 
      list: rawData?.allRecords.filter(r => !DataEngine.isLateDeadline(r.PREV_ENTREGA, r.OCORRENCIA, r.STATUS_PERECIVEL)) || []
  });

  const carrierShipments = useMemo(() => (!rawData || !selectedCarrier) ? [] : rawData.allRecords.filter(r => DataEngine.sanitize(r.CIA_TRANSF || "PRÓPRIO") === selectedCarrier), [rawData, selectedCarrier]);
  const occurrenceShipments = useMemo(() => (!rawData || !selectedOccurrence) ? [] : rawData.allRecords.filter(r => DataEngine.sanitize(r.OCORRENCIA || "SEM OCORRÊNCIA") === selectedOccurrence), [rawData, selectedOccurrence]);
  const clientShipments = useMemo(() => (!rawData || !selectedClient) ? [] : rawData.allRecords.filter(r => DataEngine.sanitize(r.REMETENTE) === selectedClient), [rawData, selectedClient]);
  const receiverShipments = useMemo(() => (!rawData || !selectedReceiver) ? [] : rawData.allRecords.filter(r => DataEngine.sanitize(r.DESTINATARIO) === selectedReceiver), [rawData, selectedReceiver]);

  // Background decoration component
  const BgDecoration = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-pulse"></div>
      <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70"></div>
      <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[100px] mix-blend-multiply opacity-70"></div>
    </div>
  );

  // Helper to abbreviate large currency values
  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (!rawData) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <BgDecoration />
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="glass-panel p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden group animate-fade-up">
            
            {/* Logo area */}
            <div className="mb-8 flex flex-col items-center justify-center relative">
               <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full"></div>
               <img src={SATILOG_LOGO} alt="Satilog" className="h-16 object-contain relative z-10 drop-shadow-sm mb-4" />
               <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100/80 rounded-full border border-white">
                  <Activity size={12} className="text-orange-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Painel de Inteligência v7.4</span>
               </div>
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Análise Operacional</h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-[90%] mx-auto">
              Visualização de métricas de performance, prazos e validade.
            </p>

            {/* Instructions Box */}
            <div className="mb-8 bg-slate-50/80 border border-slate-100 p-5 rounded-3xl text-left">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                        <Info size={20} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Como Importar?</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Retire no <span className="text-slate-800 font-bold bg-white px-1 py-0.5 rounded border border-slate-200">Atalho 126</span> da Brudam um relatório em Excel e importe para o painel.
                        </p>
                    </div>
                </div>
                
                <a 
                    href="https://satilog.brudam.com.br/operacional/lista_minuta.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm group"
                >
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Abrir Rastreamento de Remessas
                </a>
            </div>

            <label className="group/btn relative block w-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 duration-200">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-30 group-hover/btn:opacity-60 transition duration-500"></div>
              <button className="relative w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-orange-600 hover:to-orange-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl">
                  {loading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-xs uppercase tracking-widest">Processando...</span>
                    </div>
                  ) : (
                    <>
                        <div className="p-1.5 bg-white/20 rounded-lg"><FileText size={18} /></div>
                        <span className="text-xs uppercase tracking-widest">Carregar Relatório Excel</span>
                    </>
                  )}
              </button>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".csv,.xlsx,.xls" disabled={loading} />
            </label>

            <p className="mt-6 text-[10px] text-slate-400 font-medium flex items-center justify-center gap-2">
               <ShieldAlert size={12} /> Dados processados localmente e com segurança.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-700 p-4 md:p-6 lg:p-8 font-sans relative selection:bg-orange-100/50">
      <BgDecoration />
      
      {/* MODALS */}
      <DetailsModal shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />
      <ListDetailsModal title={selectedCarrier || ''} icon={Truck} shipments={carrierShipments} onClose={() => setSelectedCarrier(null)} onSelectShipment={setSelectedShipment} />
      <ListDetailsModal title={selectedOccurrence || ''} icon={Activity} shipments={occurrenceShipments} onClose={() => setSelectedOccurrence(null)} onSelectShipment={setSelectedShipment} />
      <ListDetailsModal title={selectedClient || ''} icon={Users} shipments={clientShipments} onClose={() => setSelectedClient(null)} onSelectShipment={setSelectedShipment} />
      <ListDetailsModal title={selectedReceiver || ''} icon={Target} shipments={receiverShipments} onClose={() => setSelectedReceiver(null)} onSelectShipment={setSelectedShipment} />
      {kpiModal.show && <ListDetailsModal title={kpiModal.title} icon={kpiModal.icon} shipments={kpiModal.list} onClose={() => setKpiModal({ ...kpiModal, show: false })} onSelectShipment={setSelectedShipment} />}
      {showAllAlerts && <ListDetailsModal title="Auditoria de Prioridades" icon={ShieldAlert} shipments={rawData.alerts} onClose={() => setShowAllAlerts(false)} onSelectShipment={setSelectedShipment} isPriorityView={true} />}

      {/* HEADER - Compact Version */}
      <header className="max-w-[1800px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-4">
           {/* Logo sem container branco */}
           <img src={SATILOG_LOGO} alt="Satilog" className="h-8 md:h-10 object-contain drop-shadow-sm" />
           <div>
               <div className="flex items-center gap-2 mb-0.5">
                   <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                   </span>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sistema Online</p>
               </div>
               <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Painel <span className="text-orange-500">Operacional</span></h1>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end border-r border-slate-300 pr-4 mr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Base Ativa</span>
                <span className="text-sm font-black text-slate-700">{rawData.allRecords.length.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">Registos</span></span>
            </div>
            <button 
                onClick={() => setRawData(null)} 
                className="group pl-3 pr-5 py-2.5 bg-white/80 hover:bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm hover:shadow-lg"
            >
                <div className="p-1 bg-slate-100 group-hover:bg-red-50 rounded-lg transition-colors"><X size={14} /></div>
                NOVA ANÁLISE
            </button>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto space-y-6 pb-20">
        
        {/* KPIs - 6 Cols (Single Row on Large Screens) Layout - Compacted */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <KpiCard delay={100} title="Volume Total" value={rawData.totalCtes} icon={Package} color="bg-slate-800" subtitle="CT-es Ingeridos" />
          <KpiCard delay={150} onClick={openDeliveredKpi} title="Entregues" value={rawData.deliveredCount} icon={CheckCircle2} color="bg-emerald-500" subtitle="Finalizados OK" />
          <KpiCard delay={175} onClick={openOnTimeKpi} title="No Prazo" value={rawData.onTimeCount} icon={CalendarCheck} color="bg-cyan-600" subtitle="Dentro da Meta" />
          <KpiCard delay={200} onClick={openDelayedKpi} title="Atrasos" value={rawData.delayedCount} icon={Clock} color="bg-orange-500" subtitle="Entrega Excedida" />
          <KpiCard delay={250} onClick={openExpiredKpi} title="Vencidos" value={rawData.expiredPerecivelCount} icon={AlertTriangle} color="bg-red-500" subtitle="Risco Crítico" />
          <KpiCard delay={300} title="Valor Carga" value={formatCompactCurrency(rawData.valor)} icon={DollarSign} color="bg-blue-600" subtitle="Total Consolidado" />
        </section>

        {/* ALERTS - Compact Marquee */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
             <MarqueeAlerts alerts={rawData.alerts} onSelectShipment={setSelectedShipment} onShowAll={() => setShowAllAlerts(true)} />
        </div>

        {/* CIAs TABLE - MOVED UP */}
        <section className="glass-panel rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden animate-fade-up border border-white/80" style={{ animationDelay: '300ms' }}>
          <div className="p-6 border-b border-slate-100/50 bg-white/40 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 text-white rounded-[1rem] shadow-xl shadow-slate-300">
                    <Truck size={20} />
                </div>
                <div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Performance de Transportadoras</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Monitoramento de eficiência por parceiro</p>
                </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b border-slate-100">
                <tr><th className="px-6 py-4 pl-8">Companhia</th><th className="px-6 py-4 text-center">Volume</th><th className="px-6 py-4 text-right pr-8">Status de Risco</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 text-xs">
                {Object.entries(rawData.carriers).sort((a,b) => b[1].count - a[1].count).map(([name, data], i) => (
                  <tr key={i} onClick={() => setSelectedCarrier(name)} className="hover:bg-orange-50/40 transition-all group cursor-pointer text-slate-700">
                    <td className="px-6 py-4 pl-8 font-bold text-slate-800 uppercase flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-orange-200 group-hover:text-orange-500 transition-colors shadow-sm">
                            <ChevronRight size={12} />
                        </div>
                        {name}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                        <span className="px-3 py-1 bg-slate-100 rounded-full font-black text-slate-600 shadow-sm text-[10px]">{data.count}</span>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                      {data.delays > 0 ? 
                        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full font-black uppercase text-[9px] border border-red-100 shadow-sm">
                            <AlertTriangle size={10} className="animate-pulse" /> {data.delays} Em Alerta
                        </div> : 
                        <span className="text-emerald-500 font-black text-[9px] uppercase tracking-wider flex items-center justify-end gap-1 bg-emerald-50/50 px-3 py-1 rounded-full w-fit ml-auto border border-emerald-100/50 shadow-sm">
                            <CheckCircle2 size={10}/> Normalizado
                        </span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ANALYTICS SECTION - REVERTED TO VERTICAL LISTS */}
        <section className="glass-panel rounded-[2rem] shadow-xl shadow-slate-200/40 p-6 md:p-8 animate-fade-up border border-white/80 overflow-visible" style={{ animationDelay: '400ms' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Occurrences Stats */}
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2 border-b border-orange-100 pb-3">
                   <div className="p-2 bg-orange-50 rounded-xl text-orange-600 shadow-sm"><Activity size={16}/></div>
                   <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-700">Top Ocorrências</h4>
               </div>
               <div className="flex flex-col gap-2">
                 {Object.entries(rawData.occurrences).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([occ, count], i) => (
                   <StatBarItem 
                     key={i} 
                     label={occ} 
                     count={count} 
                     total={rawData.totalCtes} // Scaling relative to total volume
                     globalTotal={rawData.totalCtes} 
                     colorClass="text-orange-500" 
                     barColorClass="bg-gradient-to-r from-orange-400 to-orange-500" 
                     icon={Activity}
                     onClick={() => setSelectedOccurrence(occ)}
                   />
                 ))}
               </div>
            </div>

            {/* Clients Stats */}
            <div className="space-y-4 lg:border-x lg:border-slate-100 lg:px-8">
               <div className="flex items-center gap-3 mb-2 border-b border-blue-100 pb-3">
                   <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shadow-sm"><Users size={16}/></div>
                   <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-700">Top Remetentes</h4>
               </div>
               <div className="flex flex-col gap-2">
                 {Object.entries(rawData.clients).sort((a,b) => b[1].count - a[1].count).slice(0, 10).map(([client, data], i) => {
                   return (
                     <StatBarItem 
                       key={i} 
                       label={client} 
                       count={data.count} 
                       total={rawData.totalCtes} // Scaling relative to total volume
                       globalTotal={rawData.totalCtes} 
                       colorClass="text-blue-500" 
                       barColorClass="bg-gradient-to-r from-blue-400 to-blue-500" 
                       icon={Users}
                       onClick={() => setSelectedClient(client)}
                     />
                   );
                 })}
               </div>
            </div>

            {/* Receivers Stats */}
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2 border-b border-emerald-100 pb-3">
                   <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm"><Target size={16}/></div>
                   <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-700">Top Destinatários</h4>
               </div>
               <div className="flex flex-col gap-2">
                 {Object.entries(rawData.receivers).sort((a,b) => b[1].count - a[1].count).slice(0, 10).map(([recv, data], i) => {
                   return (
                     <StatBarItem 
                       key={i} 
                       label={recv} 
                       count={data.count} 
                       total={rawData.totalCtes} // Scaling relative to total volume
                       globalTotal={rawData.totalCtes} 
                       colorClass="text-emerald-500" 
                       barColorClass="bg-gradient-to-r from-emerald-400 to-emerald-500" 
                       icon={Target}
                       onClick={() => setSelectedReceiver(recv)}
                     />
                   );
                 })}
               </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="max-w-[1800px] mx-auto mt-8 mb-10 flex flex-col md:flex-row justify-between items-center px-8 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-fade-up" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-6">
            <img src={SATILOG_LOGO} alt="Satilog" className="h-5 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500" />
            <div className="h-3 w-px bg-slate-300"></div>
            <span>Painel de Inteligência v7.4</span>
        </div>
        <p className="opacity-50 mt-4 md:mt-0">© 2025 Sistema Operacional Inteligente</p>
      </footer>
    </div>
  );
}