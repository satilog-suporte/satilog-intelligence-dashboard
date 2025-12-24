import React, { useMemo, useState } from 'react';
import { Eye, X, Search, AlertCircle } from 'lucide-react';
import { Shipment } from '../types';
import { DataEngine } from '../utils/dataEngine';

interface ListDetailsModalProps {
  title: string;
  icon: any;
  shipments: Shipment[];
  onClose: () => void;
  onSelectShipment: (s: Shipment) => void;
  isPriorityView?: boolean;
}

const ListDetailsModal: React.FC<ListDetailsModalProps> = ({ title, icon: Icon, shipments, onClose, onSelectShipment, isPriorityView = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShipments = useMemo(() => {
    if (!searchTerm) return shipments;
    const lower = searchTerm.toLowerCase();
    return shipments.filter(s => 
      (s.CTE && s.CTE.toLowerCase().includes(lower)) ||
      (s.DESTINATARIO && s.DESTINATARIO.toLowerCase().includes(lower)) ||
      (s.REMETENTE && s.REMETENTE.toLowerCase().includes(lower))
    );
  }, [shipments, searchTerm]);

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-scale">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-7xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white/50 gap-6">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className={`p-5 rounded-[1.8rem] shadow-xl text-white ${isPriorityView ? 'bg-red-500 shadow-red-200' : 'bg-slate-800 shadow-slate-200'}`}>
                <Icon size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">{filteredShipments.length} Registos Encontrados</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative group w-full md:w-72">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-100/50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-200 transition-all outline-none placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={onClose} className="p-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-red-500 hover:border-red-100 shadow-sm active:scale-95"><X size={24} /></button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-separate border-spacing-y-3 px-2">
            <thead className="sticky top-0 z-10">
              <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md rounded-l-2xl shadow-sm border-b border-slate-100">CTE</th>
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">Destinatário</th>
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 text-right">Valor NF</th>
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 text-center">Diagnóstico</th>
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">Prev. Entrega</th>
                <th className="px-6 py-4 bg-white/95 backdrop-blur-md rounded-r-2xl shadow-sm border-b border-slate-100 text-center">Acções</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s, i) => {
                const isLate = DataEngine.isLateDeadline(s.PREV_ENTREGA, s.OCORRENCIA, s.STATUS_PERECIVEL);
                const isExpired = DataEngine.isTrulyExpired(s.STATUS_PERECIVEL, s.OCORRENCIA);
                const reason = DataEngine.getAlertReason(s);
                return (
                  <tr key={i} className={`
                    ${isExpired ? 'bg-red-50/50 hover:bg-red-50' : isLate ? 'bg-slate-100/50 hover:bg-slate-100' : 'bg-white hover:bg-orange-50'} 
                    transition-all group rounded-2xl shadow-sm hover:shadow-md
                  `}>
                    <td className="px-6 py-5 first:rounded-l-2xl font-black text-slate-800 text-xs border-y border-l border-transparent group-hover:border-orange-100/50">{s.CTE || "N/A"}</td>
                    <td className="px-6 py-5 border-y border-transparent group-hover:border-orange-100/50">
                      <p className="font-bold text-slate-600 text-[11px] truncate max-w-[200px] uppercase">{s.DESTINATARIO}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-700 text-xs border-y border-transparent group-hover:border-orange-100/50">{DataEngine.parseNumeric(s.VALOR_NF).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                    <td className="px-6 py-5 text-center border-y border-transparent group-hover:border-orange-100/50">
                        <div className="flex flex-col items-center justify-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${isExpired ? 'bg-red-100 text-red-600 border-red-200' : isLate ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {reason}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-500 text-[11px] uppercase border-y border-transparent group-hover:border-orange-100/50">{s.PREV_ENTREGA || "--"}</td>
                    <td className="px-6 py-5 last:rounded-r-2xl text-center border-y border-r border-transparent group-hover:border-orange-100/50">
                      <button onClick={() => onSelectShipment(s)} className="p-2.5 bg-white border border-slate-200 rounded-xl transition-all shadow-sm text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:scale-95"><Eye size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredShipments.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-24">
                        <div className="flex flex-col items-center text-slate-300">
                            <div className="p-4 bg-slate-50 rounded-full mb-4"><AlertCircle size={32} className="opacity-50"/></div>
                            <p className="text-sm font-black uppercase tracking-widest">Nenhum registo encontrado</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50 backdrop-blur-sm">
          <button onClick={onClose} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all active:scale-95 hover:shadow-2xl hover:-translate-y-1">Fechar Lista</button>
        </div>
      </div>
    </div>
  );
};

export default ListDetailsModal;