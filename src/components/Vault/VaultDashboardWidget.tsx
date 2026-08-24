import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { VaultItem } from '../../types';

interface VaultDashboardWidgetProps {
  items: VaultItem[];
}

const COLORS = {
  password: '#06b6d4', // claw-cyan
  note: '#e4048a', // lobster-red (or pink)
  key: '#8b5cf6', // purple
  attachment: '#f59e0b', // amber
};

const LABELS = {
  password: 'Logins',
  note: 'Secure Notes',
  key: 'SSH & Keys',
  attachment: 'Attachments'
};

export function VaultDashboardWidget({ items }: VaultDashboardWidgetProps) {
  const data = useMemo(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(LABELS).map(type => ({
      name: LABELS[type as keyof typeof LABELS],
      value: counts[type] || 0,
      color: COLORS[type as keyof typeof COLORS]
    })).filter(d => d.value > 0);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="bg-theme-surface/50 border border-theme-subtle p-6 rounded-2xl mb-8">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Vault Composition</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
