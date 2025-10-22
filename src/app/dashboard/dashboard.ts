import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as ss from 'simple-statistics';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexMarkers,
  ApexTitleSubtitle,
  ApexFill,
  ApexPlotOptions,
  NgApexchartsModule
} from "ng-apexcharts";
import { Excel } from '../excel/excel';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  markers: ApexMarkers;
  fill: ApexFill;
  plotOptions?: ApexPlotOptions;
  colors?: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, NgApexchartsModule, CommonModule, Excel],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  excelData: any[] = [];
  countries: string[] = [];
  availableYears: string[] = [];
  selectedCountry = '';
  selectedYear = '';
  private countryHeader = '';

  // Variables para comparación
  comparisonMode: 'single' | 'compareCountries' | 'compareYears' = 'single';
  selectedCountry1 = '';
  selectedCountry2 = '';
  selectedYear1 = '';
  selectedYear2 = '';
  
  comparisonStats: any = {};
  yearComparisonStats: any = {};

  // Configuración de gráficos
  scatterChartOptions: ChartOptions = {
    series: [],
    chart: { type: 'scatter', height: 350, zoom: { enabled: true } },
    xaxis: { title: { text: 'Años' } },
    yaxis: { title: { text: 'Créditos' } },
    dataLabels: { enabled: false },
    title: { text: 'Gráfico de Dispersión', align: 'center' },
    markers: { size: 6, colors: ['#1e3a8a'] },
    fill: { colors: ['#1e3a8a'] }
  };

  histChartOptions: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 350 },
    xaxis: { categories: [], title: { text: 'Rango de Valores' } },
    yaxis: { title: { text: 'Frecuencia' } },
    dataLabels: { enabled: true },
    title: { text: 'Histograma', align: 'center' },
    markers: { size: 6, colors: ['#16a34a'] },
    fill: { colors: ['#16a34a'] }
  };

  // Gráfico comparativo de países
  comparisonChartOptions: ChartOptions = {
    series: [],
    chart: { type: 'line', height: 350 },
    xaxis: { title: { text: 'Años' } },
    yaxis: { title: { text: 'Créditos' } },
    dataLabels: { enabled: false },
    title: { text: 'Comparación entre Países', align: 'center' },
    markers: { size: 4 },
    fill: { opacity: 0.3 }
  };

  // Gráfico comparativo de años
  yearComparisonChartOptions: ChartOptions = {
    series: [],
    chart: { 
      type: 'bar', 
      height: 350,
      toolbar: { show: false }
    },
    xaxis: { 
      categories: [],
      title: { text: 'Años' }
    },
    yaxis: { 
      title: { text: 'Créditos' }
    },
    dataLabels: { 
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#000']
      }
    },
    title: { 
      text: 'Comparación entre Años', 
      align: 'center' 
    },
    markers: { size: 0 },
    fill: { opacity: 1 },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '50%',
      }
    },
    colors: ['#1e3a8a', '#dc2626']
  };

  stats: any = {};

  onDataLoaded(data: any[][]) {
    if (!data?.length) return;

    const headers = data[0];
    this.excelData = data.slice(1).map(row => {
      const obj: any = {};
      row.forEach((cell, idx) => obj[headers[idx]] = cell);
      return obj;
    });

    this.processData();
  }

  private detectCountryColumn(headers: string[]): string {
    const countryKeywords = ['país', 'pais', 'country', 'nation', 'nombre', 'name'];
    const found = headers.find(h => 
      countryKeywords.some(keyword => h.toLowerCase().includes(keyword))
    );
    return found || headers.find(h => isNaN(Number(h))) || headers[0];
  }

  private processData() {
    if (!this.excelData.length) return;

    const headers = Object.keys(this.excelData[0]);
    this.countryHeader = this.detectCountryColumn(headers);

    this.countries = [...new Set(
      this.excelData.map(row => row[this.countryHeader]?.toString().trim())
    )].filter(Boolean);

    this.availableYears = headers
      .filter(header => {
        const year = Number(header);
        return !isNaN(year) && year >= 1900 && year <= 2100;
      })
      .sort((a, b) => Number(a) - Number(b));

    // Valores iniciales
    this.selectedCountry = this.countries[0] || '';
    this.selectedCountry1 = this.countries[0] || '';
    this.selectedCountry2 = this.countries[1] || '';
    this.selectedYear = this.availableYears[0] || '';
    this.selectedYear1 = this.availableYears[0] || '';
    this.selectedYear2 = this.availableYears[1] || '';

    if (this.countries.length && this.availableYears.length) {
      this.updateAll();
    }
  }

  private getCountryData(country?: string): number[] {
    const targetCountry = country || this.selectedCountry;
    const countryData = this.excelData.find(row =>
      row[this.countryHeader]?.toString().trim() === targetCountry.trim()
    );

    if (!countryData) return [];

    return this.availableYears
      .map(year => {
        const value = Number(countryData[year]);
        return isNaN(value) ? 0 : value;
      })
      .filter(val => val !== 0);
  }

  private getYearData(country: string, year: string): number {
    const countryData = this.excelData.find(row =>
      row[this.countryHeader]?.toString().trim() === country.trim()
    );

    if (!countryData) return 0;

    const value = Number(countryData[year]);
    return isNaN(value) ? 0 : value;
  }

  updateAll() {
    if (this.comparisonMode === 'single') {
      this.calculateStats();
      this.generateScatter();
      this.generateHistogram();
    } else if (this.comparisonMode === 'compareCountries') {
      this.calculateComparisonStats();
      this.generateComparisonChart();
    } else if (this.comparisonMode === 'compareYears') {
      this.calculateYearComparisonStats();
      this.generateYearComparisonChart();
    }
  }

  private calculateStats() {
    const data = this.getCountryData();
    if (!data.length) {
      this.stats = this.getEmptyStats();
      return;
    }

    try {
      const modeResult = ss.mode(data);
      
      this.stats = {
        max: this.formatSimple(ss.max(data)),
        min: this.formatSimple(ss.min(data)),
        sum: this.formatSimple(ss.sum(data)),
        mean: this.formatSimple(ss.mean(data)),
        mode: this.formatSimpleMode(modeResult),
        variance: this.formatSimple(ss.variance(data)),
        stdDev: this.formatSimple(ss.standardDeviation(data))
      };
    } catch {
      this.stats = this.getEmptyStats('Error');
    }
  }

  private calculateComparisonStats() {
    const data1 = this.getCountryData(this.selectedCountry1);
    const data2 = this.getCountryData(this.selectedCountry2);

    if (!data1.length || !data2.length) {
      this.comparisonStats = { country1: this.getEmptyStats(), country2: this.getEmptyStats() };
      return;
    }

    try {
      this.comparisonStats = {
        country1: this.calculateCountryStats(data1, this.selectedCountry1),
        country2: this.calculateCountryStats(data2, this.selectedCountry2)
      };
    } catch {
      this.comparisonStats = {
        country1: this.getEmptyStats('Error'),
        country2: this.getEmptyStats('Error')
      };
    }
  }

  private calculateYearComparisonStats() {
    if (!this.selectedCountry || !this.selectedYear1 || !this.selectedYear2) {
      this.yearComparisonStats = {};
      return;
    }

    const creditsYear1 = this.getYearData(this.selectedCountry, this.selectedYear1);
    const creditsYear2 = this.getYearData(this.selectedCountry, this.selectedYear2);

    const difference = creditsYear2 - creditsYear1;
    const percentageDifference = creditsYear1 !== 0 ? (difference / creditsYear1) * 100 : 0;

    this.yearComparisonStats = {
      year1: {
        credits: creditsYear1,
        year: this.selectedYear1
      },
      year2: {
        credits: creditsYear2,
        year: this.selectedYear2
      },
      difference: difference,
      percentageDifference: percentageDifference.toFixed(2)
    };
  }

  private calculateCountryStats(data: number[], countryName: string) {
    const modeResult = ss.mode(data);
    return {
      name: countryName,
      max: this.formatSimple(ss.max(data)),
      min: this.formatSimple(ss.min(data)),
      sum: this.formatSimple(ss.sum(data)),
      mean: this.formatSimple(ss.mean(data)),
      mode: this.formatSimpleMode(modeResult),
      variance: this.formatSimple(ss.variance(data)),
      stdDev: this.formatSimple(ss.standardDeviation(data))
    };
  }

  private getEmptyStats(value: string = 'N/A') {
    return { max: value, min: value, sum: value, mean: value, mode: value, variance: value, stdDev: value };
  }

  // Formateo simple - máximo 2 decimales
  private formatSimple(value: number): string {
    if (value === 0) return '0';
    if (isNaN(value)) return 'N/A';
    
    // Siempre 2 decimales máximo
    return value.toFixed(2);
  }

  private formatSimpleMode(modeResult: any): string {
    if (Array.isArray(modeResult)) {
      return modeResult.map(val => this.formatSimple(val)).join(', ');
    }
    return this.formatSimple(modeResult);
  }

  private generateScatter() {
    const data = this.getCountryData();
    const scatterData = data.map((y, i) => ({
      x: this.availableYears[i],
      y
    }));

    this.scatterChartOptions = {
      ...this.scatterChartOptions,
      series: [{
        name: this.selectedCountry,
        data: scatterData
      }]
    };
  }

  private generateHistogram() {
    const data = this.getCountryData();
    if (!data.length) {
      this.histChartOptions = { ...this.histChartOptions, series: [] };
      return;
    }

    const validData = data.filter(val => !isNaN(val) && val !== 0);
    const minVal = Math.min(...validData);
    const maxVal = Math.max(...validData);
    const binSize = Math.ceil((maxVal - minVal) / 10) || 1;
    
    const bins: Record<string, number> = {};

    validData.forEach(val => {
      const bin = Math.floor(val / binSize) * binSize;
      const binKey = `${bin}-${bin + binSize - 1}`;
      bins[binKey] = (bins[binKey] || 0) + 1;
    });

    const categories = Object.keys(bins).sort(
      (a, b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])
    );

    this.histChartOptions = {
      ...this.histChartOptions,
      series: [{ name: 'Frecuencia', data: categories.map(c => bins[c]) }],
      xaxis: { ...this.histChartOptions.xaxis, categories }
    };
  }

  private generateComparisonChart() {
    const data1 = this.getCountryData(this.selectedCountry1);
    const data2 = this.getCountryData(this.selectedCountry2);

    const series1 = data1.map((y, i) => ({
      x: this.availableYears[i],
      y
    }));

    const series2 = data2.map((y, i) => ({
      x: this.availableYears[i],
      y
    }));

    this.comparisonChartOptions = {
      ...this.comparisonChartOptions,
      series: [
        {
          name: this.selectedCountry1,
          data: series1,
          color: '#1e3a8a'
        },
        {
          name: this.selectedCountry2,
          data: series2,
          color: '#dc2626'
        }
      ]
    };
  }

  private generateYearComparisonChart() {
    if (!this.yearComparisonStats.year1) return;

    this.yearComparisonChartOptions = {
      ...this.yearComparisonChartOptions,
      series: [{
        name: 'Créditos',
        data: [this.yearComparisonStats.year1.credits, this.yearComparisonStats.year2.credits]
      }],
      xaxis: {
        ...this.yearComparisonChartOptions.xaxis,
        categories: [this.selectedYear1, this.selectedYear2]
      }
    };
  }

  changeCountry(country: string) {
    this.selectedCountry = country;
    this.updateAll();
  }

  changeYear(year: string) {
    this.selectedYear = year;
    this.updateAll();
  }

  compareCountries() {
    if (this.selectedCountry1 && this.selectedCountry2) {
      this.updateAll();
    }
  }

  compareYears() {
    if (this.selectedCountry && this.selectedYear1 && this.selectedYear2) {
      this.updateAll();
    }
  }

  toggleComparisonMode() {
    // Rotar entre los modos: single -> compareCountries -> compareYears -> single
    if (this.comparisonMode === 'single') {
      this.comparisonMode = 'compareCountries';
    } else if (this.comparisonMode === 'compareCountries') {
      this.comparisonMode = 'compareYears';
    } else {
      this.comparisonMode = 'single';
    }
    this.updateAll();
  }
}