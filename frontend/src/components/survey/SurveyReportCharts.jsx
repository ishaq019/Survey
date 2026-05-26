import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0f62fe', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export function PieDistribution({ data, title }) {
  const series = Object.entries(data || {}).map(([k, v]) => ({ name: k, value: Number(v) }));

  if (!series.length) {
    return (
      <div className="survey-chart-inner">
        <p className="survey-chart-title">{title}</p>
        <div className="survey-chart-empty">
          <p className="muted">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-chart-inner">
      <p className="survey-chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={series}
            dataKey="value"
            nameKey="name"
            outerRadius={75}
            paddingAngle={3}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {series.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, 'Count']} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarDistribution({ data, title }) {
  const series = Object.entries(data || {}).map(([k, v]) => ({ name: k, value: Number(v) }));

  if (!series.length) {
    return (
      <div className="survey-chart-inner">
        {title && <p className="survey-chart-title">{title}</p>}
        <div className="survey-chart-empty">
          <p className="muted">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-chart-inner">
      {title && <p className="survey-chart-title">{title}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={series} margin={{ top: 18, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f62fe" radius={[6, 6, 0, 0]} maxBarSize={50}>
            <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
