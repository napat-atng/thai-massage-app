'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueChartProps {
  data: { date: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#78716c' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#78716c' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `฿${(v as number).toLocaleString()}`}
          width={70}
        />
        <Tooltip
          formatter={(value: number) => [`฿${value.toLocaleString()}`, 'รายได้']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
        />
        <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
