import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileDown, AlertCircle } from 'lucide-react';

interface ProcessingResult {
  totalRows: number;
  removedRows: number;
  remainingRows: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [matriculas, setMatriculas] = useState<string>('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(async () => {
    if (!file || !matriculas.trim()) {
      setError('Por favor, selecione um arquivo e insira as matrículas.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const matriculasList = matriculas
        .split('\n')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const totalRows = jsonData.length;
        const filteredData = jsonData.filter((row: any) => 
          !matriculasList.includes(row.Matrícula?.toString())
        );
        
        const removedRows = totalRows - filteredData.length;
        
        // Create new workbook with filtered data
        const newWorkbook = XLSX.utils.book_new();
        const newSheet = XLSX.utils.json_to_sheet(filteredData);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Filtered');
        
        // Generate and download file
        XLSX.writeFile(newWorkbook, 'processed_data.xlsx');
        
        setResult({
          totalRows,
          removedRows,
          remainingRows: filteredData.length
        });
        
        setProcessing(false);
      };

      reader.onerror = () => {
        setError('Erro ao ler o arquivo.');
        setProcessing(false);
      };

      reader.readAsArrayBuffer(file);

    } catch (err) {
      setError('Ocorreu um erro ao processar o arquivo.');
      setProcessing(false);
    }
  }, [file, matriculas]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Processador de XLSX</h1>
            <p className="mt-2 text-gray-600">
              Faça upload do arquivo XLSX e insira as matrículas para filtrar
            </p>
          </div>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label 
                htmlFor="file-upload" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Arquivo XLSX
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      {file ? file.name : 'Clique para fazer upload'}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            {/* Matrículas Input */}
            <div>
              <label 
                htmlFor="matriculas" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Lista de Matrículas (uma por linha)
              </label>
              <textarea
                id="matriculas"
                rows={5}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                placeholder="Digite as matrículas aqui..."
                value={matriculas}
                onChange={(e) => setMatriculas(e.target.value)}
              />
            </div>

            {/* Process Button */}
            <button
              onClick={processFile}
              disabled={processing}
              className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                processing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Processando...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5 mr-2" />
                  Processar e Baixar
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  <p>✓ Arquivo processado com sucesso!</p>
                  <ul className="mt-2 list-disc list-inside">
                    <li>Total de linhas originais: {result.totalRows}</li>
                    <li>Linhas removidas: {result.removedRows}</li>
                    <li>Linhas restantes: {result.remainingRows}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;