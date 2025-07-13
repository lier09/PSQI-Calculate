import React, { useState, useCallback } from 'react';
import { pinyin } from 'pinyin-pro';
import type { RawPsqiData, PsqiScoreData } from './types';
import { AppStep } from './types';
import { extractDataFromImage } from './services/geminiService';
import { calculateAllPsqiScores } from './services/psqiCalculator';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import DataTable from './components/DataTable';
import SortConfigurator from './components/SortConfigurator';
import ResultsView from './components/ResultsView';
import Spinner from './components/Spinner';

// Helper to create a standardized phonetic key from a name.
const getPinyinKey = (name: string): string => {
  if (!name) return '';
  // Converts to pinyin without tones and joins, e.g., "尹珅" -> "yinshen"
  // nonZh: 'consecutive' ensures that non-Chinese characters are preserved.
  return pinyin(name.trim(), { toneType: 'none', nonZh: 'consecutive' }).replace(/\s/g, '');
};


const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Upload);
  const [rawPsqiData, setRawPsqiData] = useState<RawPsqiData[]>([]);
  const [psqiScores, setPsqiScores] = useState<PsqiScoreData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nameSortOrder, setNameSortOrder] = useState<string>('');

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setStep(AppStep.Processing);

    try {
      const data = await extractDataFromImage(file);
      setRawPsqiData(data);
      setStep(AppStep.DisplayData);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during file processing.";
      setError(`Failed to extract data. Please check your file. Error: ${errorMessage}`);
      setStep(AppStep.Upload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCalculateScores = () => {
    setIsLoading(true);
    setError(null);
    try {
      const calculatedScores = calculateAllPsqiScores(rawPsqiData);
      const sortOrderNames = nameSortOrder.split('\n').map(name => name.trim()).filter(Boolean);

      let finalScores = calculatedScores;

      if (sortOrderNames.length > 0) {
        // Create a map from the phonetic key of the desired name to its sort order index.
        const pinyinOrderMap = new Map<string, number>();
        sortOrderNames.forEach((name, index) => {
            const key = getPinyinKey(name);
            if (key) {
                // Use first occurrence if there are duplicate phonetic names in sort list
                if (!pinyinOrderMap.has(key)) {
                    pinyinOrderMap.set(key, index);
                }
            }
        });

        finalScores = [...calculatedScores].sort((a, b) => {
            const pinyinKeyA = getPinyinKey(a.name);
            const pinyinKeyB = getPinyinKey(b.name);
            
            const indexA = pinyinOrderMap.get(pinyinKeyA) ?? Infinity;
            const indexB = pinyinOrderMap.get(pinyinKeyB) ?? Infinity;
            
            if (indexA === indexB) return 0;
            
            return indexA - indexB;
        });
      }

      setPsqiScores(finalScores);
      setStep(AppStep.Results);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown calculation error occurred.";
      setError(`Calculation failed. Please check the data format. Error: ${errorMessage}`);
      setStep(AppStep.DisplayData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.Upload);
    setRawPsqiData([]);
    setPsqiScores([]);
    setError(null);
    setIsLoading(false);
    setNameSortOrder('');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <Spinner />
            <p className="text-lg text-slate-600 mt-4">Processing your file...</p>
        </div>
      );
    }

    if (error) {
        return (
             <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">An Error Occurred</p>
                <p className="text-red-600 mt-2">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
            </div>
        )
    }

    switch (step) {
      case AppStep.Upload:
        return <ImageUploader onImageUpload={handleImageUpload} />;
      case AppStep.DisplayData:
        return (
          <div className="space-y-8">
            <DataTable data={rawPsqiData} />
            <SortConfigurator value={nameSortOrder} onChange={setNameSortOrder} />
            <div className="flex justify-center mt-6 space-x-4">
               <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={handleCalculateScores}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Next: Calculate Scores & View Charts
                </button>
            </div>
          </div>
        );
      case AppStep.Results:
        return <ResultsView scores={psqiScores} onReset={handleReset} />;
       case AppStep.Processing: 
       default:
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>PSQI Score Calculator &copy; 2024. Now with sorting, charts, and CSV export.</p>
      </footer>
    </div>
  );
};

export default App;