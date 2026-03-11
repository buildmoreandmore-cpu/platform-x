import React, { useState, useRef } from 'react';
import { Camera, Mic, Loader2, UploadCloud, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

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

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: mediaType,
                      data: base64Data,
                    },
                  },
                  {
                    type: 'text',
                    text: `Extract equipment data from this image. Return ONLY valid JSON with this exact structure:
{
  "type": "Equipment type (e.g., Chiller, AHU, Boiler, RTU)",
  "manufacturer": "Manufacturer name",
  "model": "Model number",
  "year": 2000,
  "condition": "Good | Fair | Poor | Critical",
  "flags": ["List of deficiency flags like R-22 Refrigerant, Past Useful Life, Safety Risk, Corrosion, etc."]
}

If you cannot determine a field, use reasonable defaults ("Unknown" for strings, 0 for year, [] for flags). Always return valid JSON.`,
                  },
                ],
              }],
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API error: ${res.status}`);
          }

          const data = await res.json();
          const text = data.content?.[0]?.text || '';
          
          // Extract JSON from response (handle markdown code blocks)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No structured data found in response');
          
          const extractedData = JSON.parse(jsonMatch[0]) as ExtractedAsset;
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
                ? 'border-[#0D918C]/40 bg-[#0D918C]/10' 
                : 'border-neutral-300 hover:bg-neutral-50 hover:border-[#0D918C]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-[#37BB26] animate-spin mb-4" />
                <h4 className="text-lg font-medium text-neutral-900 mb-1">Processing...</h4>
                <p className="text-sm text-neutral-500 max-w-sm">Extracting structured data and identifying deficiencies.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#0D918C]/15 text-[#37BB26] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 rounded-full text-neutral-700 font-medium hover:border-[#0D918C] hover:text-[#37BB26] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
