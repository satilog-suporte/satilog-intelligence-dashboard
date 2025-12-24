import React from 'react';
import { ArrowUpRight, User, Calendar, MoreHorizontal, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Shipment } from '../types';
import { DataEngine } from '../utils/dataEngine';

interface MarqueeAlertsProps {
  alerts: Shipment[];
  onSelectShipment: (s: Shipment) => void;
  onShowAll: () => void;
}

const MarqueeAlerts: React.FC<MarqueeAlertsProps> = ({ alerts, onSelectShipment, onShowAll }) => {
  // Triple the list to ensure smooth infinite loop for wider screens
  const marqueeList = [...alerts, ...alerts, ...alerts].slice(0, 30); 

  return (
    <section className="glass-panel rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border-l-[6px] border-l-red-500 flex flex-col relative">
      <div className="px-6 py-4 border-b border-red-50/50 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-red-50/50 to-transparent relative z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl text-red-500 shadow-md shadow-red-100 ring-1 ring-red-50"><ShieldAlert size={18} /></div>
          <div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Painel de Prioridades</h3>
              <p className="text-[9px] text-red-400 font-bold uppercase mt-0.5 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Tempo Real
              </p>
          </div>
        </div>
        <button onClick={onShowAll} className="flex items-center gap-2 px-5 py-1.5 bg-white/50 border border-white rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-red-500 hover:bg-white transition-all shadow-sm group">
            <MoreHorizontal size={12} className="group-hover:rotate-90 duration-500" /> Ver Todos ({alerts.length})
        </button>
      </div>
      
      <div className="relative w-full overflow-hidden py-6">
        {alerts.length > 0 ? (
           <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-4 px-6">
            {marqueeList.map((alert, i) => {
              const reason = DataEngine.getAlertReason(alert);
              const urgent = alert.urgent;
              
              return (
                <div 
                  key={`${alert.CTE}-${i}`} 
                  onClick={() => onSelectShipment(alert)} 
                  className={`
                    w-[280px] shrink-0 p-4 rounded-[1.5rem] border transition-all cursor-pointer bg-white relative overflow-hidden group
                    ${urgent ? 'border-red-100 shadow-lg shadow-red-500/5' : 'border-orange-100 shadow-lg shadow-orange-500/5'} 
                    hover:-translate-y-1 hover:shadow-2xl hover:z-10
                  `}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${urgent ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-3 pl-3">
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">CT-E ID</span>
                        <span className="text-sm font-black tracking-tight text-slate-800">{alert.CTE || "N/A"}</span>
                    </div>
                    <div className={`p-1.5 rounded-full transition-colors duration-300 ${urgent ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'}`}>
                        <ArrowUpRight size={14} />
                    </div>
                  </div>
                  
                  <div className="pl-3 mb-4">
                    <p className={`text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg inline-block ${urgent ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                        {reason}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-50 pl-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase truncate text-slate-600">
                        <div className="p-1 bg-slate-100 rounded-md text-slate-400"><User size={10} /></div>
                        {alert.DESTINATARIO}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-600">
                        <div className="p-1 bg-slate-100 rounded-md text-slate-400"><Calendar size={10} /></div>
                        Prev: {alert.PREV_ENTREGA || "N/A"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full text-center py-2 flex flex-col items-center justify-center text-emerald-500/50">
             <CheckCircle2 size={32} className="mb-2" />
             <p className="font-black uppercase text-[10px] tracking-widest">Operação sem alertas críticos</p>
          </div>
        )}
        
        {/* Gradients for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#f0f4f8] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#f0f4f8] to-transparent z-10 pointer-events-none"></div>
      </div>
    </section>
  );
};

export default MarqueeAlerts;