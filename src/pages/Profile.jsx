import { Building2, CreditCard, Mail, MapPin, Phone, ShieldCheck, User, X, FileText, Fingerprint, Upload, Calendar, Award, Clock, ShieldAlert, Save, RotateCcw, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { getBankDetails, getFileViewUrl, getInvestorDashboard, getKycStatus, updateProfileDetails, saveAuthData, getUserPhone, linkBank, submitKyc, saveOnboardingStatus, getStoredOnboardingStatus } from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (_) {
    return dateValue;
  }
}

function getDocumentPath(submission, ...keys) {
  return keys.map((key) => submission?.[key]).find(Boolean) || '';
}

function ExistingDocumentLink({ title, path }) {
  if (!path) return null;

  const fileName = String(path).split('/').pop().split('\\').pop();

  return (
    <a
      href={getFileViewUrl(path)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-950/30 dark:bg-emerald-950/10 px-4 py-3.5 text-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-100 dark:hover:border-emerald-800"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <span className="block font-semibold text-emerald-800 dark:text-emerald-400">{title}</span>
          <span className="block max-w-[180px] truncate text-xs text-emerald-600/80 dark:text-emerald-500/85">{fileName}</span>
        </div>
      </div>
      <span className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:scale-105 transition duration-350">
        View
      </span>
    </a>
  );
}

function Profile() {
  const [userProfile, setUserProfile] = useState(getRuntimeUserProfile());
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [kycSubmission, setKycSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('kyc');

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    panNumber: '',
    aadhaarNumber: '',
  };
  const [form, setForm] = useState(initialForm);
  
  // File states
  const [files, setFiles] = useState({
    panCardImage: null,
    aadhaarFrontImage: null,
    aadhaarBackImage: null,
    selfiePhoto: null,
    bankPassbookOrStatement: null,
  });

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const [dashboardRes, bankRes, kycRes] = await Promise.all([
          getInvestorDashboard().catch(() => ({})),
          getBankDetails().catch(() => ({})),
          getKycStatus().catch(() => ({})),
        ]);

        if (!active) return;

        const dashboard = dashboardRes?.data || dashboardRes || {};
        const bank = bankRes?.data || bankRes || {};
        const kyc = kycRes?.data || kycRes || {};
        const submission = kyc.submission || kyc.kycSubmission || null;
        const runtime = getRuntimeUserProfile();
        setKycSubmission(submission);

        const nextProfile = {
          ...runtime,
          name: pickFirst(dashboard.profile?.fullName, dashboard.fullName, dashboard.name, dashboard.user?.fullName, dashboard.user?.name, runtime.name),
          email: pickFirst(dashboard.profile?.email, dashboard.email, dashboard.user?.email, runtime.email),
          phone: pickFirst(dashboard.profile?.mobileNumber, getUserPhone(), dashboard.mobileNumber, dashboard.phoneNumber, dashboard.user?.mobileNumber, runtime.phone),
          address: pickFirst(dashboard.profile?.address, dashboard.user?.address),
          dateOfBirth: pickFirst(submission?.dateOfBirth, kyc.dateOfBirth, dashboard.profile?.dateOfBirth, dashboard.user?.dateOfBirth),
          accountHolderName: pickFirst(bank.accountHolderName, bank.bank?.accountHolderName, dashboard.profile?.accountHolderName, runtime.name),
          accountNumber: pickFirst(bank.bankAccountNumber, bank.accountNumber, bank.bank?.bankAccountNumber, dashboard.profile?.bankAccountNumber, dashboard.user?.bankAccountNumber, runtime.accountNumber),
          ifscCode: pickFirst(bank.ifscCode, bank.bankIfscCode, bank.bank?.ifscCode, dashboard.profile?.bankIfscCode, dashboard.user?.ifscCode),
          bankName: pickFirst(bank.bankName, bank.bank?.bankName, dashboard.profile?.bankName, dashboard.user?.bankName),
          panNumber: pickFirst(submission?.panNumber, kyc.panNumber, dashboard.profile?.panNumber, dashboard.user?.panNumber),
          aadhaarNumber: pickFirst(submission?.aadhaarLast4, kyc.aadhaarLast4, kyc.aadhaarNumber, dashboard.profile?.aadhaarLast4, dashboard.user?.aadhaarLast4),
          joinDate: pickFirst(dashboard.profile?.createdAt, dashboard.joinDate, dashboard.createdAt, runtime.joinDate),
          kycStatus: pickFirst(kyc.kycStatus, dashboard.profile?.kycStatus, dashboard.kycStatus, runtime.kycStatus, 'Not Verified'),
          accountStatus: pickFirst(
            dashboard.accountStatus, 
            dashboard.user?.accountStatus, 
            dashboard.user?.status, 
            dashboard.user?.userStatus, 
            dashboard.status, 
            dashboard.userStatus, 
            getStoredOnboardingStatus()?.accountStatus, 
            runtime.accountStatus, 
            'PENDING'
          ),
          bankVerified: pickFirst(bank.verified, bank.bankVerified, dashboard.bankVerified, dashboard.user?.bankVerified, runtime.bankVerified),
        };

        const nameParts = nextProfile.name.trim().split(/\s+/).filter(Boolean);
        nextProfile.avatar = nameParts.length === 0 ? '??' : nameParts.length === 1 ? nameParts[0].slice(0, 2).toUpperCase() : `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();

        setUserProfile(nextProfile);
        
        // Force sync local storage so sidebar and app routing unlock immediately
        saveOnboardingStatus({ 
          kycStatus: nextProfile.kycStatus,
          accountStatus: nextProfile.accountStatus,
          bankVerified: nextProfile.bankVerified
        });
        
        setForm({
          name: nextProfile.name || '',
          email: nextProfile.email || '',
          phone: nextProfile.phone || '',
          dateOfBirth: nextProfile.dateOfBirth || '',
          address: nextProfile.address || '',
          accountHolderName: nextProfile.accountHolderName || nextProfile.name || '',
          accountNumber: nextProfile.accountNumber || '',
          ifscCode: nextProfile.ifscCode || '',
          bankName: nextProfile.bankName || '',
          panNumber: nextProfile.panNumber || '',
          aadhaarNumber: nextProfile.aadhaarNumber || '',
        });
      } finally {
        if (active) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field) => (event) => {
    setSaved(false);
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleFileChange = (field) => (event) => {
    setSaved(false);
    setFiles((current) => ({
      ...current,
      [field]: event.target.files?.[0] || null,
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setMessage('');

    try {
      // 1. KYC Details & Files — check status first
      let kycAlreadySubmitted = false;
      try {
        const statusRes = await getKycStatus().catch(() => ({}));
        const currentStatus = statusRes?.kycStatus || statusRes?.data?.kycStatus || statusRes?.submission?.status || '';
        if (['PENDING', 'APPROVED'].includes(currentStatus.toUpperCase())) {
          kycAlreadySubmitted = true;
          console.info(`KYC already in ${currentStatus} state, skipping re-submission.`);
        }
      } catch (_) { /* status check failed, try submitting anyway */ }

      if (!kycAlreadySubmitted) {
        // Frontend Validation to prevent backend 500 errors
        const missingFiles = [];
        if (!files.panCardImage) missingFiles.push('PAN Card Image');
        if (!files.aadhaarFrontImage) missingFiles.push('Aadhaar Front Image');
        if (!files.aadhaarBackImage) missingFiles.push('Aadhaar Back Image');
        if (!files.selfiePhoto) missingFiles.push('Selfie Photo');
        if (!files.bankPassbookOrStatement) missingFiles.push('Bank Statement');
        
        if (missingFiles.length > 0) {
          setSaving(false);
          setMessage(`Please upload missing documents: ${missingFiles.join(', ')}`)
          return;
        }

        if (!form.panNumber || !form.aadhaarNumber || !form.dateOfBirth) {
          setSaving(false);
          setMessage('Please fill in PAN Number, Aadhaar Number, and Date of Birth.');
          return;
        }

        try {
          await submitKyc({
            panNumber: form.panNumber,
            aadhaarLast4: form.aadhaarNumber ? form.aadhaarNumber.slice(-4) : '',
            panCardImage: files.panCardImage,
            aadhaarFrontImage: files.aadhaarFrontImage,
            aadhaarBackImage: files.aadhaarBackImage,
            selfiePhoto: files.selfiePhoto,
            bankPassbookOrStatement: files.bankPassbookOrStatement,
            dateOfBirth: form.dateOfBirth,
            address: form.address,
          });
        } catch (err) {
          console.warn('KYC submit failed', err);
          // Handle IllegalStateException (already submitted)
          if (err.message && (err.message.includes('IllegalState') || err.message.includes('already submitted'))) {
            kycAlreadySubmitted = true;
            console.info('KYC was already submitted (IllegalStateException). Continuing...');
          } else {
            throw new Error(err.message || 'Failed to submit KYC Documents.');
          }
        }
      }
      const latestKyc = await getKycStatus().catch(() => null);
      const latestSubmission = latestKyc?.data?.submission || latestKyc?.submission || latestKyc?.kycSubmission || null;
      if (latestSubmission) setKycSubmission(latestSubmission);

      // 2. Bank Details
      // Only attempt to save bank details if KYC is approved AND the user actually provided account info.
      const isKycApproved = String(userProfile.kycStatus).toUpperCase() === 'APPROVED';
      const hasBankDataToSave = form.accountNumber && form.ifscCode;
      
      if (isKycApproved && hasBankDataToSave) {
        try {
          await linkBank({
            accountHolderName: form.accountHolderName || form.name,
            bankAccountNumber: form.accountNumber,
            confirmBankAccountNumber: form.accountNumber,
            bankIfscCode: form.ifscCode,
            bankName: form.bankName || 'Linked Bank',
          });
        } catch (err) {
          console.warn('Bank update failed', err);
          throw new Error(err.message || 'Failed to update Bank Details.');
        }
      }

      // Update local view
      saveAuthData({
        name: form.name,
        email: form.email,
        mobileNumber: form.phone,
      });
      
      setUserProfile((current) => ({
        ...current,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode,
        bankName: form.bankName,
        panNumber: form.panNumber,
        aadhaarNumber: form.aadhaarNumber,
      }));

      setSaved(true);
      const successMsg = kycAlreadySubmitted
        ? 'Your KYC is already submitted and pending admin review. Bank details updated.'
        : 'Profile and Documents saved successfully. KYC is now sent to the Admin Panel for review.';
      setMessage(successMsg);
      
      // Show explicit browser alert
      alert(successMsg);
      
    } catch (error) {
      console.error('[handleSave] Full error:', error);
      const errorMsg = `Failed: ${error.message || 'Unknown error'}`;
      setMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      accountHolderName: userProfile.accountHolderName || userProfile.name || '',
      accountNumber: userProfile.accountNumber || '',
      ifscCode: userProfile.ifscCode || '',
      bankName: userProfile.bankName || '',
      panNumber: userProfile.panNumber || '',
      aadhaarNumber: userProfile.aadhaarNumber || '',
    });
    setFiles({
      panCardImage: null,
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      selfiePhoto: null,
      bankPassbookOrStatement: null,
    });
    setSaved(false);
    setMessage('');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* Left Column: Investor Profile Summary Card */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 self-start">
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 font-heading text-3xl font-extrabold text-white shadow-lg shadow-indigo-500/20">
              {userProfile.avatar}
            </div>
            {/* Verification Checkmark Badge overlaying avatar */}
            {String(userProfile.kycStatus).toUpperCase() === 'APPROVED' ? (
              <div className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-1.5 text-white ring-4 ring-white dark:ring-slate-900 shadow-sm" title="KYC Approved">
                <ShieldCheck className="h-5 w-5" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 rounded-full bg-amber-500 p-1.5 text-white ring-4 ring-white dark:ring-slate-900 shadow-sm" title="KYC Processing/Pending">
                <ShieldAlert className="h-5 w-5" />
              </div>
            )}
          </div>
          <h3 className="mt-4 font-heading text-xl font-bold text-slate-900 dark:text-white">{userProfile.name}</h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-1 uppercase tracking-wider">{userProfile.investorId || 'INVESTOR PROFILE'}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/50 dark:bg-slate-800/40 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Account Status</span>
            </div>
            <StatusBadge label={userProfile.accountStatus || 'PENDING'} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/50 dark:bg-slate-800/40 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">KYC Status</span>
            </div>
            <StatusBadge label={userProfile.kycStatus} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/50 dark:bg-slate-800/40 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bank Details</span>
            </div>
            <StatusBadge label={userProfile.bankVerified ? 'VERIFIED' : userProfile.accountNumber ? 'LINKED' : 'NOT LINKED'} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/50 dark:bg-slate-800/40 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Award className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tier Membership</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{userProfile.membership || 'Investor'}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/50 dark:bg-slate-800/40 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Joined On</span>
            </div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(userProfile.joinDate)}</span>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs font-medium text-indigo-700 leading-relaxed dark:border-indigo-950/30 dark:bg-indigo-950/20 dark:text-indigo-300">
            Verified bank profiles remain eligible for automatic returns and rapid wallet withdrawals.
          </div>
        </div>
        {loadingProfile && <p className="mt-4 text-xs text-slate-500 animate-pulse dark:text-slate-300">Syncing profile with active API...</p>}
      </div>

      {/* Right Column: Tabbed Settings Card */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Tab Selection */}
        <div className="flex flex-row flex-wrap gap-1 border-b border-slate-100 pb-3 dark:border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${ activeTab === 'kyc' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-200' }`}
          >
            <Fingerprint className="h-4 w-4" />
            Identity & KYC Docs
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${ activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-200' }`}
          >
            <Building2 className="h-4 w-4" />
            Bank Payout Details
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${ activeTab === 'personal' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-200' }`}
          >
            <User className="h-4 w-4" />
            Personal & Contact
          </button>
        </div>

        {/* Tab Content 1: Identity & KYC Documents */}
        {activeTab === 'kyc' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  Date of Birth
                </span>
                <input type="date" className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.dateOfBirth} onChange={updateField('dateOfBirth')} />
              </label>

              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  Full Address
                </span>
                <input className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.address} onChange={updateField('address')} placeholder="123 Street Name, City" />
              </label>

              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  PAN Number
                </span>
                <input className="input-shell mt-2.5 w-full uppercase border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.panNumber} onChange={updateField('panNumber')} placeholder="ABCDE1234F" />
              </label>

              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <Fingerprint className="h-3.5 w-3.5 text-indigo-500" />
                  Aadhaar Number
                </span>
                <input className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.aadhaarNumber} onChange={updateField('aadhaarNumber')} placeholder="1234 5678 9012" />
              </label>
            </div>

            {/* Existing KYC Saved Documents */}
            {kycSubmission && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Saved KYC Documents</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ExistingDocumentLink title="PAN Card" path={getDocumentPath(kycSubmission, 'panCardPath', 'panCard', 'panCardUrl')} />
                  <ExistingDocumentLink title="Aadhaar Front" path={getDocumentPath(kycSubmission, 'aadhaarFrontPath', 'aadhaarFront', 'aadhaarFrontUrl')} />
                  <ExistingDocumentLink title="Aadhaar Back" path={getDocumentPath(kycSubmission, 'aadhaarBackPath', 'aadhaarBack', 'aadhaarBackUrl')} />
                  <ExistingDocumentLink title="Selfie Photo" path={getDocumentPath(kycSubmission, 'selfiePath', 'selfie', 'selfieUrl')} />
                  <ExistingDocumentLink title="Bank Proof" path={getDocumentPath(kycSubmission, 'bankProofPath', 'bankProof', 'bankProofUrl')} />
                </div>
              </div>
            )}

            {String(userProfile.kycStatus).toUpperCase() === 'APPROVED' && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 px-4 py-3 text-xs text-blue-700 leading-relaxed dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400">
                Your KYC status is verified. Approved document history is displayed above for secure compliance viewing.
              </div>
            )}

            {/* File Uploads Grid */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{kycSubmission ? 'Upload Replacements' : 'Upload Documents'}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {/* PAN Card Image */}
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition duration-300">
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      PAN Card Image
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('panCardImage')} className="mt-3 block w-full text-xs text-slate-500 dark:text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:file:bg-indigo-950/45 dark:file:text-indigo-400 file:cursor-pointer" />
                  </div>
                  {files.panCardImage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100/35 truncate self-start max-w-full">
                      ✓ {files.panCardImage.name}
                    </p>
                  )}
                </div>

                {/* Aadhaar Front Image */}
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition duration-300">
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      Aadhaar Front Image
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarFrontImage')} className="mt-3 block w-full text-xs text-slate-500 dark:text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:file:bg-indigo-950/45 dark:file:text-indigo-400 file:cursor-pointer" />
                  </div>
                  {files.aadhaarFrontImage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100/35 truncate self-start max-w-full">
                      ✓ {files.aadhaarFrontImage.name}
                    </p>
                  )}
                </div>

                {/* Aadhaar Back Image */}
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition duration-300">
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      Aadhaar Back Image
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarBackImage')} className="mt-3 block w-full text-xs text-slate-500 dark:text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:file:bg-indigo-950/45 dark:file:text-indigo-400 file:cursor-pointer" />
                  </div>
                  {files.aadhaarBackImage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100/35 truncate self-start max-w-full">
                      ✓ {files.aadhaarBackImage.name}
                    </p>
                  )}
                </div>

                {/* Selfie Photo */}
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition duration-300">
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      Selfie Photo
                    </span>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange('selfiePhoto')} className="mt-3 block w-full text-xs text-slate-500 dark:text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:file:bg-indigo-950/45 dark:file:text-indigo-400 file:cursor-pointer" />
                  </div>
                  {files.selfiePhoto && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100/35 truncate self-start max-w-full">
                      ✓ {files.selfiePhoto.name}
                    </p>
                  )}
                </div>

                {/* Bank Statement */}
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition duration-300 md:col-span-2">
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      Bank Statement / Cancelled Cheque
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('bankPassbookOrStatement')} className="mt-3 block w-full text-xs text-slate-500 dark:text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:file:bg-indigo-950/45 dark:file:text-indigo-400 file:cursor-pointer" />
                  </div>
                  {files.bankPassbookOrStatement && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100/35 truncate self-start max-w-full">
                      ✓ {files.bankPassbookOrStatement.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Bank Payout Details */}
        {activeTab === 'bank' && (
          <div className="space-y-6 animate-fade-in-up">
            {String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' && (
              <div className="rounded-xl border border-amber-250 bg-amber-50/40 p-4 text-xs text-amber-700 leading-relaxed dark:border-amber-950/30 dark:bg-amber-950/25 dark:text-amber-400 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div>
                  <span className="font-bold block text-sm">KYC Verification Pending</span>
                  <p className="mt-1 leading-relaxed">You must wait for your KYC Profile to be approved by the admin team before updating payout banking credentials.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className={`rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  Account Holder Name
                </span>
                <input className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.accountHolderName} onChange={updateField('accountHolderName')} disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} />
              </label>

              <label className={`rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  Bank Name
                </span>
                <input className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.bankName} onChange={updateField('bankName')} disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} placeholder="e.g. State Bank of India" />
              </label>

              <label className={`rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                  Account Number
                </span>
                <input className="input-shell mt-2.5 w-full border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.accountNumber} onChange={updateField('accountNumber')} disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} placeholder="123456789012" />
              </label>

              <label className={`rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  Bank IFSC Code
                </span>
                <input className="input-shell mt-2.5 w-full uppercase border-slate-200 focus:border-indigo-600 dark:border-slate-850" value={form.ifscCode} onChange={updateField('ifscCode')} placeholder="SBIN0001234" disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} />
              </label>
            </div>
          </div>
        )}

        {/* Tab Content 3: Personal & Contact Info */}
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-xs text-slate-500 leading-relaxed dark:border-slate-800 dark:bg-slate-900/40 flex items-start gap-2.5 dark:text-slate-300">
              <Lock className="h-4 w-4 text-slate-500 dark:text-slate-300 flex-shrink-0 mt-0.5" />
              <p>Primary contact variables (Full Name, Phone Number, and Email Address) are locked following onboarding validation. Please trigger a ticket via Customer Support to modify security details.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block opacity-70 cursor-not-allowed">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                  Full Name
                </span>
                <input className="input-shell mt-2.5 w-full bg-slate-100/50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-300" value={form.name} disabled />
              </label>

              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block opacity-70 cursor-not-allowed">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                  Email Address
                </span>
                <input className="input-shell mt-2.5 w-full bg-slate-100/50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-300" value={form.email} disabled />
              </label>

              <label className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-850 dark:bg-slate-900/30 block opacity-70 cursor-not-allowed">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                  Phone Number
                </span>
                <input className="input-shell mt-2.5 w-full bg-slate-100/50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-300" value={form.phone} disabled />
              </label>
            </div>
          </div>
        )}

        {/* Global Save & Reset Actions (Only show for editable tabs) */}
        {activeTab !== 'personal' && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:bg-indigo-700 hover:shadow-indigo-700/20 active:scale-[0.97] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving Documents...' : 'Save Profile & Documents'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-[0.97]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Inputs
              </button>
            </div>

            {/* Success/Error message banner */}
            {message && (
              <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border ${ message.includes('Failed') ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' : 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450' }`}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
