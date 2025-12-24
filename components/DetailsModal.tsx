import React from 'react';
import { 
  FileCheck, X, Clock, Thermometer, User, Target, 
  MapPinned, MapPin, Calendar, Truck, Layers, DollarSign, 
  ClipboardList, LucideIcon 
} from 'lucide-react';
import { Shipment } from '../types';
import { DataEngine } from '../utils/dataEngine';

interface DetailsModalProps {
  shipment: Shipment | null;
  onClose: () => void;
}

const DetailRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) => (
  <div className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white hover:bg-white transition-colors hover:shadow-md hover:shadow-slate-200/50 group">
    <div className="text-slate-400 shrink-0 p-2.5 bg-white rounded-xl shadow-sm group-hover:text-orange-500 transition-colors"><Icon size={18} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800 truncate">{value || "N/A"}</p>
    </div>
  </div>
);

const DetailsModal: React.FC<DetailsModalProps> = ({ shipment, onClose }) => {
  if (!shipment) return null;
  const docs = shipment.DOCUMENTOS ? String(shipment.DOCUMENTOS).replace(/^['"]/, '').split(',').map(i => i.trim()).filter(i => i) : [];
  
  const isLate = DataEngine.isLateDeadline(shipment.PREV_ENTREGA, shipment.OCORRENCIA, shipment.STATUS_PERECIVEL);
  const isExpired = DataEngine.isTrulyExpired(shipment.STATUS_PERECIVEL, shipment.OCORRENCIA);
  const isDelivered = DataEngine.isDelivered(shipment.OCORRENCIA, shipment.STATUS_PERECIVEL);
  const isRisco = String(shipment.STATUS_PERECIVEL).toUpperCase().includes("HORAS") && !isDelivered;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-scale">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-5">
             <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-300"><FileCheck size={24} /></div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Prontuário Operacional</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[10px] font-bold uppercase">CTE</span>
                    <span className="text-sm font-bold text-slate-600">{shipment.CTE || "N/A"}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-slate-400 border border-transparent hover:border-red-100"><X size={24} /></button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               {isLate && (
                  <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 rounded-[2rem] text-white shadow-xl shadow-slate-300 flex flex-col justify-between relative overflow-hidden group border border-slate-700/50">
                     <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform"><Clock size={80} /></div>
                     <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md shadow-inner shadow-white/10"><Clock size={20} /></div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-red-300 drop-shadow-sm">Atraso de Entrega</h4>
                     </div>
                     <div className="relative z-10">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Previsão de Chegada</p>
                        <p className="text-2xl font-black">{shipment.PREV_ENTREGA || "NÃO INFORMADA"}</p>
                     </div>
                  </div>
               )}
               {(isExpired || isRisco) && (
                  <div className={`p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group border border-white/10 ${isExpired ? 'bg-gradient-to-br from-red-600 via-red-500 to-orange-600 shadow-red-200' : 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-orange-200'}`}>
                     <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform"><Thermometer size={80} /></div>
                     <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md shadow-inner shadow-white/10"><Thermometer size={20} /></div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest drop-shadow-sm">{isExpired ? 'Perecível Vencido' : 'Risco de Validade'}</h4>
                     </div>
                     <div className="relative z-10">
                        <p className="text-xs text-white/70 font-bold uppercase mb-1">Situação do Lote</p>
                        <p className="text-2xl font-black tracking-tight">{shipment.STATUS_PERECIVEL}</p>
                        <p className="text-[10px] font-bold text-white/50 uppercase mt-2 border-t border-white/20 pt-2 inline-block">Data Limite: {shipment.DATA_STATUS || "N/A"}</p>
                     </div>
                  </div>
               )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailRow label="Remetente" value={DataEngine.sanitize(shipment.REMETENTE)} icon={User} />
            <DetailRow label="Destinatário" value={DataEngine.sanitize(shipment.DESTINATARIO)} icon={Target} />
            <DetailRow label="Valor Mercadoria" value={DataEngine.parseNumeric(shipment.VALOR_NF).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})} icon={DollarSign} />
            
            <DetailRow label="Origem" value={DataEngine.sanitize(shipment.CIDADE_ORIGEM)} icon={MapPinned} />
            <DetailRow label="Destino" value={DataEngine.sanitize(shipment.CIDADE_DESTINO)} icon={MapPin} />
            <DetailRow label="Emissão" value={DataEngine.formatDisplayDate(shipment.DATA_EMISSAO)} icon={Calendar} />
            
            <DetailRow label="Peso Real" value={`${shipment.PESO} KG`} icon={Truck} />
            <DetailRow label="Volumes" value={shipment.VOLUMES} icon={Layers} />
            <DetailRow label="CIA Transf." value={shipment.CIA_TRANSF} icon={Truck} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <div className="p-6 bg-slate-50/80 rounded-[2rem] border border-white">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ClipboardList size={16} /> Notas Fiscais vinculadas</p>
               <div className="flex flex-wrap gap-2">
                 {docs.length > 0 ? docs.map((d, i) => <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-600 shadow-sm">{d}</span>) : <span className="text-slate-400 text-xs italic">Sem documentos listados</span>}
               </div>
            </div>
            <div className={`p-6 rounded-[2rem] border ${isDelivered ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDelivered ? 'text-emerald-500' : 'text-blue-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></span>
                Último Status
              </p>
              <p className={`text-lg font-black leading-tight ${isDelivered ? 'text-emerald-800' : 'text-blue-800'}`}>{shipment.OCORRENCIA || "SEM INFORMAÇÃO"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50 backdrop-blur-sm">
          <button onClick={onClose} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center gap-2 hover:shadow-2xl hover:-translate-y-1">
            <X size={16} /> Fechar Documento
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;