import { Component, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexMarkers,
  ApexLegend,
  ApexFill,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexResponsive,
  NgApexchartsModule
} from "ng-apexcharts";

// Tipo personalizado para opciones del gráfico de área
export type AreaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  markers: ApexMarkers;
  legend: ApexLegend;
  fill: ApexFill;
  yaxis: ApexYAxis | ApexYAxis[];
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  responsive?: ApexResponsive[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;

  public areaChartOptions!: AreaChartOptions; // Solo gráfico de área

  years = [2001, 2005, 2010, 2015, 2020, 2024];

  // Datos de porcentaje de usuarios por sistema operativo
  osData = {
    Windows: [90, 85, 80, 76, 72, 68],
    Linux:   [5, 10, 12, 13, 15, 10],
    macOS:   [5, 5, 8, 11, 13, 22]
  };

  // Filtros para mostrar u ocultar sistemas operativos
  filters = {
    Windows: true,
    Linux: false,
    macOS: false
  };

  ngOnInit(): void {
    // Inicializa el gráfico al cargar el componente
    this.initChart();
    // Aplica los filtros seleccionados
    this.updateChartFromFilters();
  }

  // Inicializa la configuración del gráfico de área
  initChart() {
    const baseChart: Partial<AreaChartOptions> = {
      chart: {
        type: 'area',
        height: 420,
        toolbar: { show: true },
        zoom: { enabled: false },
        stacked: false,
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      grid: { borderColor: '#e6eef7', strokeDashArray: 4 },
      legend: { position: 'bottom', horizontalAlign: 'center' },
      xaxis: { categories: this.years.map(String), labels: { style: { colors: '#64748b' } } },
      yaxis: { title: { text: '%' }, labels: { style: { colors: '#64748b' } }, min: 0, max: 100 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0,90,100] } },
      tooltip: { theme: 'light' }
    };

    this.areaChartOptions = {
      ...baseChart as any,
      series: [{ name: 'Windows', data: this.osData.Windows }] as any, // Serie inicial
      title: { text: 'Tendencia de uso (%)', align: 'left', style: { color: '#0f172a', fontWeight: 700 } }
    } as AreaChartOptions;
  }

  // Actualiza la serie del gráfico según los filtros seleccionados
  updateChartFromFilters() {
    const selected = Object.keys(this.filters).filter(k => (this.filters as any)[k]);
    if (selected.length === 0) {
      // Si no hay filtros seleccionados, limpia la serie
      this.areaChartOptions.series = [];
      return;
    }

    const seriesArea = selected.map(name => ({ name, data: (this.osData as any)[name] }));
    this.areaChartOptions = { ...this.areaChartOptions, series: seriesArea as any };
  }

  // Alterna los filtros de cada sistema operativo
  toggleFilter(key: 'Windows' | 'Linux' | 'macOS') {
    this.filters[key] = !this.filters[key];
    this.updateChartFromFilters();
  }

  // Obtiene el último valor del sistema operativo para mostrar en el widget
  getCurrentValue(os: 'Windows' | 'Linux' | 'macOS') {
    const arr = (this.osData as any)[os] as number[];
    return arr[arr.length - 1];
  }
}