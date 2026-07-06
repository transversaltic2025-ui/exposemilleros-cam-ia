"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TendenciaArea } from "@/types";

export function TendenciasChart({ data }: { data: TendenciaArea[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(23,19,33,0.1)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="area" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#5F5968" }} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "#5F5968" }} />
          <Tooltip
            cursor={{ fill: "rgba(109,63,169,0.06)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(23,19,33,0.12)",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 18px 44px rgba(23,19,33,0.1)",
            }}
          />
          <Bar dataKey="proyectos" name="Proyectos" fill="#2E7D5B" radius={[8, 8, 0, 0]} />
          <Bar
            dataKey="puntajePromedio"
            name="Puntaje promedio humano"
            fill="#A37AD9"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="puntajePromedioIA"
            name="Puntaje promedio IA"
            fill="#6D3FA9"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
