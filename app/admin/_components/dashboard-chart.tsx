"use client";

import { Badge } from "@/components/ui/badge";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  date: string;
  borrows: number;
  returns: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ opacity: 0.1 }}
            content={(props) => {
              if (!props.active || !props.payload || !props.label) {
                return null;
              }

              return (
                <div className="min-w-xs rounded border bg-background p-4">
                  <div className="mb-2 text-sm font-medium">
                    {new Date(props.label).toLocaleDateString()}
                  </div>
                  {props.payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                      <div className="flex w-full justify-between">
                        <p className="text-sm text-muted-foreground">
                          {entry.dataKey === "borrows" ? "Borrows" : "Returns"}
                        </p>
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: entry.color }}
                        >
                          {entry.value}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="borrows"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="returns"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
