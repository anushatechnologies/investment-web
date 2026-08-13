import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, UploadCloud, CheckCircle2, XCircle, Clock,
  CreditCard, Calendar, MapPin, AlertTriangle, UserCircle, RefreshCcw, Camera, Building2, Fingerprint
} from 'lucide-react';
import { getKycStatus, saveOnboardingStatus, submitKyc } from '../services/api';
import { getOnboardingDraft } from '../utils/onboardingDraftStore';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 25;

const DOC_FIELDS = [
  {
    formKey: 'panCardImage',
    title: 'PAN Card',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Upload PAN card scan or clear photo',
    statusKey: 'panCardStatus',
    reasonKey: 'panCardRejectionReason',
    pathKey: 'panCardPath',
    icon: CreditCard
  },
  {
    formKey: 'aadhaarFrontImage',
    title: 'Aadhaar Front',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Front side of Aadhaar',
    statusKey: 'aadhaarFrontStatus',
    reasonKey: 'aadhaarFrontRejectionReason',
    pathKey: 'aadhaarFrontPath',
    icon: Fingerprint
  },
  {
    formKey: 'aadhaarBackImage',
    title: 'Aadhaar Back',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Back side of Aadhaar',
    statusKey: 'aadhaarBackStatus',
    reasonKey: 'aadhaarBackRejectionReason',
    pathKey: 'aadhaarBackPath',
    icon: Fingerprint
  },
  {
    formKey: 'selfiePhoto',
    title: 'Live Selfie',
    accept: '.jpg,.jpeg,.png',
    helper: 'Upload a clear selfie',
    statusKey: 'selfieStatus',
    reasonKey: 'selfieRejectionReason',
    pathKey: 'selfiePath',
    icon: Camera
  },
  {
    formKey: 'bankPassbookOrStatement',
    title: 'Bank Statement',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Recent passbook or statement',
    statusKey: 'bankProofStatus',
    reasonKey: 'bankProofRejectionReason',
    pathKey: 'bankProofPath',
    icon: Building2
  },
];

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function needsFreshUpload(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'REUPLOAD_REQUIRED' || normalized === 'REJECTED';
}

function UploadField({ title, accept, file, onChange, helper, status, reason, requiredNow, disabled, icon: Icon }) {
  const previewUrl = useMemo(() => {
    if (!file || file.type === 'application/pdf') return '';
    return URL.createObjectURL(file);
  }, [file]);

  const fileSizeMb = useMemo(() => {
    if (!file) return null;
    return (file.size / (1024 * 1024)).toFixed(2);
  }, [file]);

  const normalizedStatus = String(status || '').trim().toUpperCase();
  
  let StatusBadge = null;
  if (normalizedStatus === 'APPROVED') {
    StatusBadge = <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>;
  } else if (normalizedStatus === 'REJECTED' || normalizedStatus === 'REUPLOAD_REQUIRED') {
    StatusBadge = <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg animate-bounce"><AlertTriangle className="w-4 h-4" /></div>;
  } else if (normalizedStatus === 'PENDING') {
    StatusBadge = <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg"><Clock className="w-4 h-4" /></div>;
  } else if (requiredNow) {
    StatusBadge = <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg animate-pulse">REQUIRED</div>;
  }

  return (
    <div className={`relative p-5 rounded-[1.5rem] border backdrop-blur-xl transition-all duration-300 flex flex-col h-full ${ requiredNow ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-xl shadow-blue-500/10' : file ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60' }`}>
      {StatusBadge}
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl shrink-0 transition-colors ${ file ? 'bg-emerald-500 text-white' : requiredNow ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300' }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 line-clamp-1 mt-0.5">{file ? `${file.name} (${fileSizeMb} MB)` : helper}</p>
        </div>
      </div>

      {reason && (
        <div className="mb-4 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-500/10 p-3 rounded-xl">
          "{reason}"
        </div>
      )}

      <div className="mt-auto">
        <label className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${ disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400' : file ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] cursor-pointer shadow-lg' }`}>
          <input type="file" className="hidden" accept={accept} onChange={onChange} disabled={disabled} />
          <UploadCloud className="w-4 h-4" />
          {file ? 'Replace File' : 'Upload File'}
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4 relative h-24 rounded-xl overflow-hidden shadow-inner group">
          <img src={previewUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
      )}
    </div>
  );
}

function KycPage() {
  const navigate = useNavigate();
  const draft = getOnboardingDraft();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [form, setForm] = useState({
    panNumber: draft.panNumber || '',
    aadhaarLast4: draft.aadhaarLast4 || '',
    dateOfBirth: draft.dateOfBirth || '',
    address: draft.address || '',
    panCardImage: null,
    aadhaarFrontImage: null,
    aadhaarBackImage: null,
    selfiePhoto: null,
    bankPassbookOrStatement: null,
  });

  const submission = statusData?.submission || null;

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const response = await getKycStatus();
        if (!active) return;
        setStatusData(response);
        saveOnboardingStatus(response);
        const profile = response?.profile || {};
        setForm((prev) => ({
          ...prev,
          panNumber: prev.panNumber || profile.panNumber || '',
          aadhaarLast4: prev.aadhaarLast4 || profile.aadhaarLast4 || '',
          dateOfBirth: prev.dateOfBirth || profile.dateOfBirth || '',
          address: prev.address || profile.address || '',
        }));
      } catch (err) {
        if (active) setStatusData(null);
      } finally {
        if (active) setRefreshing(false);
      }
    };
    loadStatus();
    return () => { active = false; };
  }, []);

  const requiredDocs = useMemo(() => DOC_FIELDS.filter((doc) => {
    if (!submission) return true;
    const status = normalizeStatus(submission[doc.statusKey]);
    const hasExistingFile = Boolean(submission[doc.pathKey]);
    return needsFreshUpload(status) || !hasExistingFile;
  }), [submission]);

  const needsReupload = requiredDocs.length > 0 && Boolean(submission);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateAndStoreFile = (key) => (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      update(key, null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is too large. Please upload files up to ${MAX_FILE_SIZE_MB} MB.`);
      event.target.value = '';
      return;
    }
    setError('');
    update(key, file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (statusData?.canUpload === false) {
      setError('Your KYC is already approved. Reupload is only needed when the admin requests updated documents.');
      return;
    }

    const missingRequiredDocs = requiredDocs.filter((doc) => !form[doc.formKey]);
    if (missingRequiredDocs.length > 0) {
      setError(`Please upload: ${missingRequiredDocs.map((doc) => doc.title).join(', ')}.`);
      return;
    }

    const hasAnyNewFile = DOC_FIELDS.some((doc) => Boolean(form[doc.formKey]));
    if (!hasAnyNewFile) {
      setError('Upload at least one KYC document before submitting.');
      return;
    }

    setLoading(true);
    try {
      await submitKyc(form);
      saveOnboardingStatus({ ...statusData, kycStatus: 'PENDING', onboardingStatus: 'KYC_PENDING' });
      navigate('/kyc/status', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  const overallStatus = statusData?.kycStatus || 'NOT_SUBMITTED';
  const normalizedOverallStatus = normalizeStatus(overallStatus);
  const canUpload = statusData?.canUpload !== false;
  const isPendingReview = normalizedOverallStatus === 'PENDING';
  const isApproved = normalizedOverallStatus === 'APPROVED';

  const InputWrapper = ({ icon: Icon, label, ...props }) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-slate-500 dark:text-slate-300 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input 
        className="w-full pl-12 pr-4 py-4 bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 rounded-[1.25rem] text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md shadow-sm"
        placeholder={label}
        {...props}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0b1121] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* Vibrant Background Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-gradient-to-br from-blue-400/20 via-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        
        {/* Header Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30 mb-2 transform rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Identity Verification
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            Complete your KYC to unlock full account access. Your data is encrypted and stored securely.
          </p>

          {/* Dynamic Status Badge */}
          <div className="flex justify-center mt-6">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md border shadow-sm ${ isApproved ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : isPendingReview ? 'bg-amber-50/80 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' : needsFreshUpload(overallStatus) ? 'bg-red-50/80 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' : 'bg-white/80 border-slate-200 text-slate-700 dark:bg-slate-800/80 dark:border-white/10 dark:text-slate-300' }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ isApproved ? 'bg-emerald-400' : isPendingReview ? 'bg-amber-400' : 'bg-blue-400' }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${ isApproved ? 'bg-emerald-500' : isPendingReview ? 'bg-amber-500' : needsFreshUpload(overallStatus) ? 'bg-red-500' : 'bg-blue-500' }`}></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest">{overallStatus}</span>
            </div>
          </div>
        </div>

        {/* Global Error/Alerts */}
        <div className="space-y-4 mb-8">
          {refreshing && (
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 backdrop-blur-xl flex items-center justify-center gap-3">
              <RefreshCcw className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Synchronizing status...</p>
            </div>
          )}
          {!refreshing && !canUpload && (
            <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Verification Complete</h3>
                <p className="text-sm text-emerald-50 opacity-90 mt-1">Your KYC is fully verified. No further action is required at this time.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 backdrop-blur-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={onSubmit} className="space-y-6 relative z-20">
          
          {/* Section 1: Personal Details */}
          <div className="bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/30">1</div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Personal Info</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputWrapper 
                icon={CreditCard}
                label="PAN Number"
                value={form.panNumber}
                onChange={(e) => update('panNumber', e.target.value.toUpperCase())}
                required
                disabled={!canUpload}
              />
              <InputWrapper 
                icon={Fingerprint}
                label="Aadhaar Last 4"
                maxLength={4}
                value={form.aadhaarLast4}
                onChange={(e) => update('aadhaarLast4', e.target.value.replace(/\D/g, ''))}
                required
                disabled={!canUpload}
              />
              <InputWrapper 
                icon={Calendar}
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                required
                disabled={!canUpload}
              />
              <InputWrapper 
                icon={MapPin}
                label="Current Address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                required
                disabled={!canUpload}
              />
            </div>
          </div>

          {/* Section 2: Documents */}
          <div className="bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/30">2</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Documents</h2>
              </div>
              <span className="inline-flex px-3 py-1 bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold">Max {MAX_FILE_SIZE_MB}MB per file</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOC_FIELDS.map((doc) => (
                <div key={doc.formKey} className={doc.formKey === 'bankPassbookOrStatement' ? 'sm:col-span-2' : ''}>
                  <UploadField
                    title={doc.title}
                    accept={doc.accept}
                    file={form[doc.formKey]}
                    helper={doc.helper}
                    onChange={canUpload ? validateAndStoreFile(doc.formKey) : undefined}
                    status={submission?.[doc.statusKey]}
                    reason={submission?.[doc.reasonKey]}
                    requiredNow={requiredDocs.some((requiredDoc) => requiredDoc.formKey === doc.formKey)}
                    disabled={!canUpload}
                    icon={doc.icon}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 pb-12 flex justify-center">
            <button 
              type="submit" 
              disabled={loading || refreshing || !canUpload}
              className={`w-full sm:w-auto min-w-[280px] px-8 py-5 rounded-[1.5rem] font-black text-lg transition-all duration-300 flex justify-center items-center gap-3 ${ loading || refreshing || !canUpload ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95' } dark:text-slate-300`}
            >
              {loading ? (
                <><RefreshCcw className="w-6 h-6 animate-spin" /> Processing...</>
              ) : !canUpload ? (
                <><CheckCircle2 className="w-6 h-6" /> Verified</>
              ) : needsReupload ? (
                <><UploadCloud className="w-6 h-6" /> Submit Updates</>
              ) : (
                <><ShieldCheck className="w-6 h-6" /> Secure Submit</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default KycPage;
