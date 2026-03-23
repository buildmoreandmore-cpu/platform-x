import React, { useState, useRef } from 'react';
import { Camera, Mic, Loader2, UploadCloud, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExtractedAsset {
  type: string;
  manufacturer: string;
  model: string;
  year: number;
  condition: string;
  flags: string[];
}

export function AIExtraction({ onAssetExtracted }: { onAssetExtracted: (asset: ExtractedAsset) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Data = reader.result?.toString().split(',')[1];
          if (!base64Data) throw new Error("Failed to read file");

          const mediaType = file.type || 'image/jpeg';

          const res = await fetch('/api/ai-vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, mediaType }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `API error: ${res.status}`);
          }

          const data = await res.json();
          const extracted = data.extracted || {};

          const extractedData: ExtractedAsset = {
            type: extracted.type || 'Unknown',
            manufacturer: extracted.manufacturer || 'Unknown',
            model: extracted.model || 'Unknown',
            year: extracted.year || 0,
            condition: extracted.condition || 'Unknown',
            flags: extracted.flags || [],
          };
          onAssetExtracted(extractedData);
          setIsProcessing(false);
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to process image");
          setIsProcessing(false);
        }
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process image");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">AI Extraction Queue</h3>
          <p className="text-sm text-neutral-500">Upload nameplate photos or record voice notes. AI will extract structured data and flag deficiencies automatically.</p>
        </div>
        
        <div className="p-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf"
            capture="environment"
            onChange={handleFileUpload}
          />
          
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
              isProcessing 
                ? 'border-primary/40 bg-primary/10' 
                : 'border-neutral-300 hover:bg-neutral-50 hover:border-primary'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
                <h4 className="text-lg font-medium text-neutral-900 mb-1">Processing...</h4>
                <p className="text-sm text-neutral-500 max-w-sm">Extracting structured data and identifying deficiencies.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/15 text-secondary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-medium text-neutral-900 mb-1">Upload Equipment Photos or Documents</h4>
                <p className="text-sm text-neutral-500 max-w-sm">Drag and drop nameplate photos, wide shots, inspection documents, or PDFs here.</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">OR</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          <div className="mt-8 text-center">
            <button 
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 rounded-full text-neutral-700 font-medium hover:border-primary hover:text-secondary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-5 h-5" />
              Record Voice Audit Note
            </button>
            <p className="text-xs text-neutral-500 mt-3">Speak your observations and the AI will structure the data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
