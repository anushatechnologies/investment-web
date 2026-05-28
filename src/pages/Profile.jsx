import { Building2, CreditCard, Mail, MapPin, Phone, ShieldCheck, User, X, FileText, Fingerprint, Upload, Calendar } from 'lucide-react';
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
      className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      <span>
        <span className="block font-semibold text-emerald-800">{title}</span>
        <span className="block max-w-[260px] truncate text-xs text-emerald-600">{fileName}</span>
      </span>
      <span className="text-xs font-semibold text-emerald-700">View</span>
    </a>
  );
}

function Profile() {
  const [userProfile, setUserProfile] = useState(getRuntimeUserProfile());
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [kycSubmission, setKycSubmission] = useState(null);

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
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Profile</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Manage your investor profile, contact information, KYC status, and payout details.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Investor Summary" subtitle="Quick profile snapshot for your account.">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 font-heading text-2xl font-bold text-white">
              {userProfile.avatar}
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold text-slate-900">{userProfile.name}</p>
              <p className="mt-1 text-sm text-slate-500">{userProfile.investorId}</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Account Status</span>
              <StatusBadge label={userProfile.accountStatus || 'PENDING'} />
            </div>
            <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">KYC Status</span>
              <StatusBadge label={userProfile.kycStatus} />
            </div>
            <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Bank Status</span>
              <StatusBadge label={userProfile.bankVerified ? 'VERIFIED' : userProfile.accountNumber ? 'LINKED' : 'NOT LINKED'} />
            </div>
            <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Membership</span>
              <span className="font-medium text-slate-900">{userProfile.membership}</span>
            </div>
            <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Joined On</span>
              <span className="font-medium text-slate-900">{formatDate(userProfile.joinDate)}</span>
            </div>
            <div className="rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Your bank and profile details remain eligible for wallet withdrawals.
            </div>
          </div>
          {loadingProfile && <p className="mt-4 text-xs text-slate-500">Loading profile from API...</p>}
        </SectionCard>

        <SectionCard title="Edit Profile Details" subtitle="Update contact, KYC, and payout information for your account.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 opacity-75">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-blue-600" />
                Full Name
              </span>
              <input className="input-shell mt-3 w-full bg-slate-100 text-slate-500" value={form.name} disabled />
            </label>
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 opacity-75">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail className="h-4 w-4 text-blue-600" />
                Email Address
              </span>
              <input className="input-shell mt-3 w-full bg-slate-100 text-slate-500" value={form.email} disabled />
            </label>
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 opacity-75">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Phone className="h-4 w-4 text-blue-600" />
                Phone Number
              </span>
              <input className="input-shell mt-3 w-full bg-slate-100 text-slate-500" value={form.phone} disabled />
            </label>
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                Date of Birth
              </span>
              <input type="date" className="input-shell mt-3 w-full" value={form.dateOfBirth} onChange={updateField('dateOfBirth')} />
            </label>
            
            {/* New KYC Text Fields */}
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="h-4 w-4 text-blue-600" />
                Full Address
              </span>
              <input className="input-shell mt-3 w-full" value={form.address} onChange={updateField('address')} />
            </label>

            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-blue-600" />
                PAN Number
              </span>
              <input className="input-shell mt-3 w-full uppercase" value={form.panNumber} onChange={updateField('panNumber')} placeholder="ABCDE1234F" />
            </label>
            <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Fingerprint className="h-4 w-4 text-blue-600" />
                Aadhaar Number
              </span>
              <input className="input-shell mt-3 w-full" value={form.aadhaarNumber} onChange={updateField('aadhaarNumber')} placeholder="1234 5678 9012" />
            </label>

            {/* Bank Fields */}
            <div className="md:col-span-2 pt-4 pb-2 border-t border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Bank Details</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account Status:</span>
                <StatusBadge label={userProfile.accountStatus || 'PENDING'} />
              </div>
            </div>
            {String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? (
              <div className="md:col-span-2 mt-2 mb-2 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="font-semibold">Note:</span> You must wait for your KYC to be approved before you can add or edit your Bank Details.
              </div>
            ) : null}

            <label className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-blue-600" />
                Account Holder Name
              </span>
              <input className="input-shell mt-3 w-full" value={form.accountHolderName} onChange={updateField('accountHolderName')} disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} />
            </label>
            <label className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Building2 className="h-4 w-4 text-blue-600" />
                Bank Name
              </span>
              <input className="input-shell mt-3 w-full" value={form.bankName} onChange={updateField('bankName')} disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} />
            </label>
            <label className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Account Number
              </span>
              <input
                className="input-shell mt-3 w-full"
                value={form.accountNumber}
                onChange={updateField('accountNumber')}
                disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'}
              />
            </label>
            <label className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${String(userProfile.kycStatus).toUpperCase() !== 'APPROVED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Bank IFSC Code
              </span>
              <input className="input-shell mt-3 w-full uppercase" value={form.ifscCode} onChange={updateField('ifscCode')} placeholder="e.g. SBIN0001234" disabled={String(userProfile.kycStatus).toUpperCase() !== 'APPROVED'} />
            </label>
          </div>

          {/* Document Uploads */}
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              {kycSubmission ? 'Saved KYC Documents' : 'Upload Documents'}
            </h3>
            {kycSubmission && (
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <ExistingDocumentLink title="PAN Card" path={getDocumentPath(kycSubmission, 'panCardPath', 'panCard', 'panCardUrl')} />
                <ExistingDocumentLink title="Aadhaar Front" path={getDocumentPath(kycSubmission, 'aadhaarFrontPath', 'aadhaarFront', 'aadhaarFrontUrl')} />
                <ExistingDocumentLink title="Aadhaar Back" path={getDocumentPath(kycSubmission, 'aadhaarBackPath', 'aadhaarBack', 'aadhaarBackUrl')} />
                <ExistingDocumentLink title="Selfie Photo" path={getDocumentPath(kycSubmission, 'selfiePath', 'selfie', 'selfieUrl')} />
                <ExistingDocumentLink title="Bank Proof" path={getDocumentPath(kycSubmission, 'bankProofPath', 'bankProof', 'bankProofUrl')} />
              </div>
            )}
            {String(userProfile.kycStatus).toUpperCase() === 'APPROVED' && (
              <div className="mb-5 rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Your KYC is approved. File inputs cannot show old selected files after page refresh, so approved documents are shown above as view links.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4 text-blue-600" />
                  PAN Card Image
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('panCardImage')} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                {files.panCardImage && <p className="mt-2 text-xs text-emerald-600">Selected: {files.panCardImage.name}</p>}
              </label>

              <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Aadhaar Front Image
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarFrontImage')} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                {files.aadhaarFrontImage && <p className="mt-2 text-xs text-emerald-600">Selected: {files.aadhaarFrontImage.name}</p>}
              </label>

              <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Aadhaar Back Image
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('aadhaarBackImage')} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                {files.aadhaarBackImage && <p className="mt-2 text-xs text-emerald-600">Selected: {files.aadhaarBackImage.name}</p>}
              </label>

              <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Selfie Photo
                </span>
                <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange('selfiePhoto')} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                {files.selfiePhoto && <p className="mt-2 text-xs text-emerald-600">Selected: {files.selfiePhoto.name}</p>}
              </label>

              <label className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Bank Statement / Cancelled Cheque
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange('bankPassbookOrStatement')} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                {files.bankPassbookOrStatement && <p className="mt-2 text-xs text-emerald-600">Selected: {files.bankPassbookOrStatement.name}</p>}
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Profile & Documents'}</button>
            <button type="button" onClick={handleReset} className="btn-secondary">Reset</button>
          </div>
          <p className={`mt-4 text-sm ${message.includes('Failed') ? 'text-rose-500' : 'text-emerald-600'}`}>
            {message || 'Edit and save your profile details here.'}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export default Profile;
