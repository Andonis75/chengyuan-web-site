"use client";

import type { CSSProperties, ReactNode } from "react";
import { Component, useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  LineChart,
  RadarChart,
  ScatterChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  VisualMapComponent,
  DatasetComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// Register the required components
echarts.use([
  BarChart,
  LineChart,
  RadarChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  VisualMapComponent,
  DatasetComponent,
  CanvasRenderer,
]);
type ChartErrorBoundaryProps = {
  children: ReactNode;
};

type ChartErrorBoundaryState = {
  hasError: boolean;
};

type SafeEChartProps = {
  className?: string;
  option: object;
  style?: CSSProperties;
};

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ECharts render failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-orange-200 bg-white/40 px-6 text-center text-sm leading-6 text-foreground/55">
          当前图表暂时无法渲染，但页面其他内容仍可正常查看。
        </div>
      );
    }

    return this.props.children;
  }
}

function EChartCanvas({ className, option, style }: SafeEChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.setOption(option as any);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    chartRef.current.setOption(option as any, true);
    chartRef.current.resize();
  }, [option]);

  return <div ref={containerRef} className={className} style={style} />;
}

export function SafeEChart(props: SafeEChartProps) {
  return (
    <ChartErrorBoundary>
      <EChartCanvas {...props} />
    </ChartErrorBoundary>
  );
}
