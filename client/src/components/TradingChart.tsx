import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
} from 'lightweight-charts';

interface CandleData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface IndicatorData {
  time: string | number;
  value: number;
}

interface TradingChartProps {
  candleData: CandleData[];
  rsiData?: IndicatorData[];
  macdData?: IndicatorData[];
  signalLine?: IndicatorData[];
  ma10?: IndicatorData[];
  ma30?: IndicatorData[];
  ma60?: IndicatorData[];
  buySignals?: Array<{ time: string | number; price: number }>;
  sellSignals?: Array<{ time: string | number; price: number }>;
  supportLevel?: number;
  resistanceLevel?: number;
  theme?: 'light' | 'dark';
}

export default function TradingChart({
  candleData,
  rsiData,
  macdData,
  signalLine,
  ma10,
  ma30,
  ma60,
  buySignals,
  sellSignals,
  supportLevel,
  resistanceLevel,
  theme = 'dark',
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !candleData.length) return;

    // Create main chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: theme === 'dark' ? '#0a0a0a' : '#ffffff',
        },
        textColor: theme === 'dark' ? '#d1d5db' : '#1f2937',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      grid: {
        horzLines: {
          style: LineStyle.Dashed,
        },
        vertLines: {
          style: LineStyle.Dashed,
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addSeries({
      type: 'candlestick',
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    } as any);

    candleSeriesRef.current = candleSeries;
    (candleSeries as any).setData(candleData);

    // Add Moving Averages
    if (ma10 && ma10.length > 0) {
      const ma10Series = chart.addSeries({
        color: '#3b82f6',
        lineWidth: 1,
        title: 'MA10',
      } as any);
      (ma10Series as any).setData(ma10);
    }

    if (ma30 && ma30.length > 0) {
      const ma30Series = chart.addSeries({
        color: '#f59e0b',
        lineWidth: 1,
        title: 'MA30',
      } as any);
      (ma30Series as any).setData(ma30);
    }

    if (ma60 && ma60.length > 0) {
      const ma60Series = chart.addSeries({
        color: '#8b5cf6',
        lineWidth: 1,
        title: 'MA60',
      } as any);
      (ma60Series as any).setData(ma60);
    }

    // Add support and resistance levels
    if (supportLevel !== undefined) {
      const supportSeries = chart.addSeries({
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: `Support: ${supportLevel}`,
      } as any);
      const maxTime = Math.max(
        ...candleData.map((d) => (typeof d.time === 'string' ? 0 : d.time))
      );
      const minTime = Math.min(
        ...candleData.map((d) => (typeof d.time === 'string' ? 0 : d.time))
      );
      (supportSeries as any).setData([
        { time: minTime, value: supportLevel },
        { time: maxTime, value: supportLevel },
      ]);
    }

    if (resistanceLevel !== undefined) {
      const resistanceSeries = chart.addSeries({
        color: '#22c55e',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: `Resistance: ${resistanceLevel}`,
      } as any);
      const maxTime = Math.max(
        ...candleData.map((d) => (typeof d.time === 'string' ? 0 : d.time))
      );
      const minTime = Math.min(
        ...candleData.map((d) => (typeof d.time === 'string' ? 0 : d.time))
      );
      (resistanceSeries as any).setData([
        { time: minTime, value: resistanceLevel },
        { time: maxTime, value: resistanceLevel },
      ]);
    }

    // Add buy signals
    if (buySignals && buySignals.length > 0) {
      const buyMarkers = buySignals.map((signal) => ({
        time: signal.time,
        position: 'belowBar' as const,
        color: '#22c55e',
        shape: 'arrowUp' as const,
        text: 'BUY',
      }));
      (candleSeries as any).setMarkers(buyMarkers);
    }

    // Add sell signals
    if (sellSignals && sellSignals.length > 0) {
      const sellMarkers = sellSignals.map((signal) => ({
        time: signal.time,
        position: 'aboveBar' as const,
        color: '#ef4444',
        shape: 'arrowDown' as const,
        text: 'SELL',
      }));
      (candleSeries as any).setMarkers((prev: any) => [...(prev || []), ...sellMarkers]);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candleData, rsiData, macdData, signalLine, ma10, ma30, ma60, buySignals, sellSignals, supportLevel, resistanceLevel, theme]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-2xl border border-white/10 overflow-hidden"
      style={{ height: '400px' }}
    />
  );
}
