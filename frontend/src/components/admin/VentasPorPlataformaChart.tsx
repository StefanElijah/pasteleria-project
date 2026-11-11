'use client';

import * as React from 'react';
import { memo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const chartConfig = {
  mobile: { label: 'Mobile', color: '#3b82f6' },
  desktop: { label: 'Desktop', color: '#22c55e' },
} satisfies ChartConfig;

type ActiveKey = 'all' | 'mobile' | 'desktop';

interface Props {
  revenueByPlatform: { date: string; mobile: number; desktop: number }[];
}

const VentasPorPlataformaChart = memo(function VentasPorPlataformaChart({ revenueByPlatform }: Props) {
  const [activeChart, setActiveChart] = React.useState<ActiveKey>('all');

  const total = React.useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    for (const d of revenueByPlatform) {
      mobile += d.mobile;
      desktop += d.desktop;
    }
    return {
      all: Math.round(mobile + desktop),
      mobile: Math.round(mobile),
      desktop: Math.round(desktop),
    };
  }, [revenueByPlatform]);

  const empty = revenueByPlatform.every((d) => d.mobile === 0 && d.desktop === 0);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
          <CardTitle className="text-base">Ventas por plataforma</CardTitle>
          <CardDescription>Comparativa Mobile vs Desktop</CardDescription>
        </div>
        <div className="flex">
          {(['all', 'mobile', 'desktop'] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-muted-foreground">
                {key === 'all' ? 'Ambas' : chartConfig[key].label}
              </span>
              <span className="text-base leading-none font-bold sm:text-xl tabular-nums">
                ${total[key].toLocaleString('es-CL')}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {empty ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay ventas en el período seleccionado.</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={revenueByPlatform}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                angle={-30}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 10 }}
                tickFormatter={(value: string) => {
                  const date = new Date(value + 'T12:00:00');
                  return date.toLocaleDateString('es-CL', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => value.toLocaleString('es-CL')}
                domain={[0, (dataMax: number) => {
                  const padded = Math.round(dataMax * 1.15);
                  return padded === 0 ? 100 : padded;
                }]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    labelFormatter={(value: string) => {
                      return new Date(value + 'T12:00:00').toLocaleDateString('es-CL', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                  />
                }
              />
              {(activeChart === 'all' || activeChart === 'mobile') && (
                <Line
                  dataKey="mobile"
                  type="monotone"
                  stroke="var(--color-mobile)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {(activeChart === 'all' || activeChart === 'desktop') && (
                <Line
                  dataKey="desktop"
                  type="monotone"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
});
export default VentasPorPlataformaChart;
