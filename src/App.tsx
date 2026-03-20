/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AnimatePresence, motion } from "motion/react";
import { 
  Camera, 
  ChevronRight, 
  Download, 
  Image as ImageIcon, 
  Key, 
  Layers, 
  Loader2, 
  Maximize2, 
  Plus, 
  RefreshCw, 
  Shirt, 
  Trash2, 
  Upload, 
  User, 
  Zap 
} from "lucide-react";
import React, { useCallback, useState } from "react";

type AspectRatio = "1:1" | "9:16" | "16:9";

interface ProductImage {
  id: string;
  url: string;
  base64: string;
  type: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [modelImage, setModelImage] = useState<{ url: string; base64: string; type: string } | null>(null);
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelImage({
          url: URL.createObjectURL(file),
          base64: (reader.result as string).split(",")[1],
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProducts((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              url: URL.createObjectURL(file),
              base64: (reader.result as string).split(",")[1],
              type: file.type,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const generateImage = async () => {
    if (!modelImage) {
      setError("Please upload a model image first.");
      return;
    }
    if (products.length === 0) {
      setError("Please upload at least one product image.");
      return;
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      setError("API Key is required. Please enter it manually or set it in environment variables.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const parts = [
        {
          inlineData: {
            data: modelImage.base64,
            mimeType: modelImage.type,
          },
        },
        ...products.map(p => ({
          inlineData: {
            data: p.base64,
            mimeType: p.type,
          },
        })),
        {
          text: `AI Fashion Try-On Task:
          1. Use the first image as the reference model.
          2. Use the subsequent images as the products (clothing/accessories) to be tried on.
          3. Generate a high-quality image of the reference model wearing all the provided products.
          4. CRITICAL: Lock and maintain the model's facial features and body posture exactly as shown in the reference image.
          5. User Request for Background and Pose: ${prompt || "Natural studio lighting, professional fashion photography."}
          6. Aspect Ratio: ${aspectRatio}.
          7. Output only the final generated image.`,
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated in the response.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = `try-on-result-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Fashion<span className="text-emerald-500">TryOn</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <input 
                type="password"
                placeholder="Enter API Key..."
                className="bg-transparent border-none outline-none text-xs w-32 focus:w-48 transition-all"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Model Upload */}
            <section className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-medium">1. Reference Model</h2>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Identity Lock</span>
              </div>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleModelUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {modelImage ? (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
                    <img src={modelImage.url} alt="Model" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-400">Upload model photo</p>
                  </div>
                )}
              </div>
            </section>

            {/* Product Upload */}
            <section className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-medium">2. Products to Try On</h2>
                </div>
                <label className="cursor-pointer bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <input type="file" accept="image/*" multiple onChange={handleProductUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {products.map((product) => (
                  <motion.div 
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={product.id} 
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                  >
                    <img src={product.url} alt="Product" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeProduct(product.id)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </motion.div>
                ))}
                <label className="aspect-square rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500">Add Product</span>
                  <input type="file" accept="image/*" multiple onChange={handleProductUpload} className="hidden" />
                </label>
              </div>
            </section>

            {/* Configuration */}
            <section className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-medium text-sm">Aspect Ratio</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["1:1", "9:16", "16:9"] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                        aspectRatio === ratio 
                          ? "bg-emerald-500 text-black border-emerald-500" 
                          : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/20"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-medium text-sm">Background & Pose Prompt</h2>
                </div>
                <textarea 
                  placeholder="e.g. Standing in a minimalist Tokyo street, soft golden hour lighting, hands in pockets..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-emerald-500/50 outline-none min-h-[100px] resize-none transition-colors"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button 
                onClick={generateImage}
                disabled={isGenerating}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Generate Try-On
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}
            </section>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/50 rounded-3xl border border-white/5 p-4 h-full flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-medium">Output Preview</h2>
                </div>
                {resultImage && (
                  <button 
                    onClick={downloadResult}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
              </div>

              <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <Zap className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-300">Processing identity lock...</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Applying fashion layers</p>
                      </div>
                    </motion.div>
                  ) : resultImage ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={resultImage} 
                      alt="Result" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center space-y-4 px-8">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="w-10 h-10 text-zinc-700" />
                      </div>
                      <div>
                        <p className="text-zinc-400 font-medium">Your creation will appear here</p>
                        <p className="text-xs text-zinc-600 mt-2 max-w-xs mx-auto">
                          Upload a model and products, then click generate to see the AI magic.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-8 pt-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-zinc-600 uppercase font-bold">Identity</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-800" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-zinc-600 uppercase font-bold">Try-On</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-800" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-zinc-600 uppercase font-bold">Result</span>
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-widest">Powered by Gemini 2.5 Flash Image</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
