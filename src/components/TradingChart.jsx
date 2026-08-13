import { createChart, ColorType, AreaSeries, HistogramSeries, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useAppTheme } from '../theme/ThemeContext';
import { Box } from '@mui/material';

export const TradingChart = ({ data, type = 'area', colors: customColors }) => {
  const chartContainerRef = useRef();
  const { mode } = useAppTheme();
  
  const isDark = mode === 'dark';

  const defaultColors = {
    backgroundColor: 'transparent',
    lineColor: isDark ? '#818cf8' : '#4f46e5',
    textColor: isDark ? '#94a3b8' : '#64748b',
    areaTopColor: isDark ? 'rgba(129, 140, 248, 0.4)' : 'rgba(79, 70, 229, 0.2)',
    areaBottomColor: isDark ? 'rgba(129, 140, 248, 0.0)' : 'rgba(79, 70, 229, 0.0)',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    upColor: '#10b981',
    downColor: '#ef4444',
  };

  const colors = { ...defaultColors, ...customColors };

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
        fontFamily: '"Inter", sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 300,
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          width: 1,
          style: 1,
          labelBackgroundColor: colors.lineColor,
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          width: 1,
          style: 1,
          labelBackgroundColor: colors.lineColor,
        },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: false,
        pinch: true,
      },
    });

    chart.timeScale().fitContent();

    let series;
    if (type === 'area') {
      series = chart.addSeries(AreaSeries, {
        lineColor: colors.lineColor,
        topColor: colors.areaTopColor,
        bottomColor: colors.areaBottomColor,
        lineWidth: 2,
      });
    } else if (type === 'histogram') {
      series = chart.addSeries(HistogramSeries, {
        color: colors.lineColor,
      });
    } else if (type === 'candlestick') {
      series = chart.addSeries(CandlestickSeries, {
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });
    }

    if (series && data && data.length > 0) {
      series.setData(data);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, colors, type, isDark]);

  return (
    <Box
      ref={chartContainerRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        '& .tv-lightweight-charts': {
          fontFamily: '"Inter", sans-serif !important',
        }
      }}
    />
  );
};
