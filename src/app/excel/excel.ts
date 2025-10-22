import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel.html',
  styleUrls: ['./excel.css']
})
export class Excel {
  @Output() dataLoaded = new EventEmitter<any[][]>();
  data: any[][] = [];
  fileName = '';

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length !== 1) {
      alert('Por favor selecciona solo un archivo Excel.');
      return;
    }

    const file = input.files[0];
    this.fileName = file.name;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const bstr = e.target?.result;
        if (typeof bstr !== 'string') {
          alert('Error al leer el archivo.');
          return;
        }

        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        // Convertir hoja a matriz (header: 1 => arreglo de arreglos)
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[];

        // Filtrar filas vacías y tipar correctamente
        this.data = (rawData as any[][]).filter((row: any[]) =>
          Array.isArray(row) &&
          row.length > 0 &&
          !row.every((cell: any) => cell === null || cell === '')
        );

        console.log('📊 Datos cargados:', this.data);

        if (this.data.length < 2) {
          alert('El archivo no contiene suficientes datos.');
          return;
        }

        this.dataLoaded.emit(this.data);
      } catch (error) {
        console.error('Error leyendo archivo Excel:', error);
        alert('Error al leer el archivo Excel. Verifica el formato.');
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Error al leer el archivo.');
    };

    reader.readAsBinaryString(file);
  }
}
