import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useStore } from '@/store';
import {
  useTenantBranding,
  validateLogoFile,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
} from '@/hooks/useTenantBranding';

const STEPS = ['Company Name', 'Logo', 'Brand Colors'];

export function TenantOnboarding() {
  const navigate = useNavigate();
  const isAuthenticated = useStore(s => !!s.currentUser);
  const currentTenant = useStore(s => s.currentTenant);
  const currentUserRole = useStore(s => s.currentUserRole);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saving, error, setError, saveBranding } = useTenantBranding();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(currentTenant?.name || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(currentTenant?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(currentTenant?.primary_color || DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(currentTenant?.secondary_color || DEFAULT_SECONDARY);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (currentUserRole !== 'owner') {
      navigate('/app');
      return;
    }
  }, [isAuthenticated, currentUserRole]);

  // Sync from store if tenant loads after mount
  useEffect(() => {
    if (currentTenant) {
      if (!name) setName(currentTenant.name || '');
      if (!logoPreview) setLogoPreview(currentTenant.logo_url || '');
      setPrimaryColor(currentTenant.primary_color || DEFAULT_PRIMARY);
      setSecondaryColor(currentTenant.secondary_color || DEFAULT_SECONDARY);
    }
  }, [currentTenant?.id]);

  const handleLogoSelect = (file: File) => {
    setError('');
    const result = validateLogoFile(file);
    if (!result.valid) {
      setError(result.error!);
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoSelect(file);
  };

  const handleComplete = async () => {
    const success = await saveBranding(
      {
        name,
        logo_url: logoPreview || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      },
      logoFile,
    );
    if (success) navigate('/app');
  };

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  return (
    <div className="h-screen bg-[#041E1D] text-white flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient-bg">
        <div className="energy-blob energy-blob-1" />
        <div className="energy-blob energy-blob-2" />
        <div className="energy-blob energy-blob-3" />
        <div className="energy-grid" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Set Up Your Platform</h1>
            <p className="text-sm text-white/50">
              Configure how your team and clients see your brand
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    i === step
                      ? 'bg-primary text-white'
                      : i < step
                        ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                        : 'bg-white/5 text-white/30'
                  }`}
                >
                  {i < step ? (
                    <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">{i + 1}</span>
                  )}
                  {label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${i < step ? 'bg-primary/40' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
            {/* Step 1: Company Name */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 ml-1">Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Acme Energy Services"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-white/30">
                  This is how your platform will be branded — in the header, emails, reports, and client portal.
                </p>
              </div>
            )}

            {/* Step 2: Logo Upload */}
            {step === 1 && (
              <div className="space-y-4">
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg" />
                      <p className="text-xs text-white/40">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Icon icon="solar:upload-bold-duotone" className="w-10 h-10 text-white/20" />
                      <div>
                        <p className="text-sm text-white/60">Drop your logo here or click to browse</p>
                        <p className="text-xs text-white/30 mt-1">PNG, JPG, or SVG — max 2MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-white/30">
                  Your logo appears in the sidebar, login page, and client portal. You can skip this and add one later.
                </p>
              </div>
            )}

            {/* Step 3: Brand Colors */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 ml-1">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-primary/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 ml-1">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-primary/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Live preview */}
                <div>
                  <p className="text-xs text-white/50 mb-3 ml-1">Preview</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain rounded" />
                      )}
                      <span className="text-sm font-bold" style={{ color: primaryColor }}>
                        {name || 'Your Company'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Secondary Button
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Active
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Completed
                      </span>
                      <span className="text-xs" style={{ color: primaryColor }}>
                        Link text
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/30">
                  These colors are used across your entire platform — buttons, links, badges, and charts.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              {step > 0 ? (
                <button
                  onClick={() => { setError(''); setStep(step - 1); }}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <div className="flex items-center gap-3">
                  {step === 1 && (
                    <button
                      onClick={() => { setError(''); setStep(step + 1); }}
                      className="text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    onClick={() => { setError(''); setStep(step + 1); }}
                    disabled={!canAdvance()}
                    className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#0B7A76] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    Next
                    <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={saving || !canAdvance()}
                  className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#0B7A76] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                      Finish Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
