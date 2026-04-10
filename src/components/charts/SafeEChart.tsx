"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsReactProps } from "echarts-for-react";
import type { ReactNode } from "react";
import { Component, useEffect, useState } from "react";

type ChartErrorBoundaryProps = {
  children: ReactNode;
};

type ChartErrorBoundaryState = {
  hasError: boolean;
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
          当前图表暂时无法渲染，但页面其余内容仍可正常查看。
        </div>
      );
    }

    return this.props.children;
  }
}

export function SafeEChart(props: EChartsReactProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-orange-200 bg-white/40 text-sm text-foreground/45">
        图表加载中...
      </div>
    );
  }

  return (
    <ChartErrorBoundary>
      <ReactECharts {...props} />
    </ChartErrorBoundary>
  );
}
