import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, subtitle, onClick, delay = 0 }) => (
  <div 
    onClick={onClick}
    style={{ animationDelay: `${delay}ms` }}
    className={`
        glass-panel p-5 rounded-[1.8rem] shadow-lg shadow-slate-200/50 
        hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/60
        transition-all duration-300 group relative overflow-hidden border border-white/60
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
    `}
  >
    {/* Background Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
        <Icon size={80} className="text-slate-900" />
    </div>

    <div className="flex flex-col h-full justify-between relative z-10">
      <div className="flex justify-between items-start mb-3">
          <div className={`p-2.5 rounded-[0.8rem] ${color} text-white shadow-md shadow-gray-200/50 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/80`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          {onClick && (
             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                <ChevronRight size={14} />
             </div>
          )}
      </div>
      
      <div className="min-w-0">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 truncate">{title}</p>
        <p className="text-2xl xl:text-3xl font-black text-slate-800 leading-none tracking-tight truncate group-hover:text-slate-900 transition-colors" title={String(value)}>
            {value}
        </p>
        
        <div className="h-px w-8 bg-slate-200 mt-3 mb-2"></div>

        {subtitle && (
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0 animate-pulse`}></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate opacity-80">{subtitle}</p>
            </div>
        )}
      </div>
    </div>
  </div>
);

export default KpiCard;