'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo, memo } from 'react';

const chartConfig = {
  cantidad: { label: 'Unidades reservadas', color: '#e11d48' },
};

const COLORS = [
  '#e11d48',
  '#f43f5e',
  '#fb7185',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
];

interface Props {
  products: { id: string; nombre: string; cantidad: number; imagenPrincipal?: string | null }[];
}

const TopReservadosChart = memo(function TopReservadosChart({ products }: Props) {
  const data = useMemo(() => {
    return [...products]
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)
      .map((p) => ({
        nombre: p.nombre.length > 30 ? p.nombre.slice(0, 27) + '...' : p.nombre,
        cantidad: p.cantidad,
      }));
  }, [products]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aún no hay reservas en los últimos 30 días.
      </p>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(200, data.length * 36) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32 }}>
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) => value.toString()}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={180}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {Number(value ?? 0).toLocaleString('es-CL')} uds.
                </span>
              )}
            />
          }
        />
        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
});
export default TopReservadosChart;
