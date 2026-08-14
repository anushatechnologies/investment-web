import { Check, Pencil, UserCog, UserPlus, Users, X, FileImage, FileText, UploadCloud, AlertCircle, Eye, ShieldCheck, Clock, Building2, Phone, CreditCard, Copy, ExternalLink, ShieldAlert, Sparkles, CheckCircle2, User, Landmark, Layers, FileCheck, RefreshCw, Mail, MapPin } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminGetUsers,
  adminUpdateUser,
  adminGetKycDocuments,
  adminGetUserKycDocuments,
  adminApproveKyc,
  adminRejectKyc,
  adminRejectKycDocuments,
  adminGetUserBankDetails,
  buildUrl,
  adminGetPendingKyc,
  request,
  adminGetAuditLogs,
} from '../services/api';

const statIcons = [Users, ShieldCheck, Clock, UserCog];
const statTones = ['blue', 'emerald', 'amber', 'violet'];
const DOC_REUPLOAD_FIELDS = [
  { key: 'panCard', label: 'PAN Card', statusKey: 'panCardStatus', reasonKey: 'panCardRejectionReason' },
  { key: 'aadhaarFront', label: 'Aadhaar Front', statusKey: 'aadhaarFrontStatus', reasonKey: 'aadhaarFrontRejectionReason' },
  { key: 'aadhaarBack', label: 'Aadhaar Back', statusKey: 'aadhaarBackStatus', reasonKey: 'aadhaarBackRejectionReason' },
  { key: 'selfie', label: 'Selfie Photo', statusKey: 'selfieStatus', reasonKey: 'selfieRejectionReason' },
  { key: 'bankProof', label: 'Bank Proof', statusKey: 'bankProofStatus', reasonKey: 'bankProofRejectionReason' },
];

// LocalStorage caching helpers for KYC IDs to resolve the archived document limitation
const saveKycIdToCache = (userId, kycId) => {
  if (!userId || !kycId) return;
  try {
    const cache = JSON.parse(localStorage.getItem('admin_user_kyc_ids') || '{}');
    cache[userId] = kycId;
    localStorage.setItem('admin_user_kyc_ids', JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save KYC ID to cache:', e);
  }
};

const getKycIdFromCache = (userId) => {
  if (!userId) return null;
  try {
    const cache = JSON.parse(localStorage.getItem('admin_user_kyc_ids') || '{}');
    return cache[userId] || null;
  } catch (e) {
    console.error('Failed to read KYC ID from cache:', e);
    return null;
  }
};

function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Investor',
    status: 'Active',
    joinDate: '',
  });
  const [modalTab, setModalTab] = useState('overview');
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = (text, fieldName) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // KYC States
  const [pendingKycList, setPendingKycList] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(true);
  
  const [viewKycDetails, setViewKycDetails] = useState(null);
  const [kycDocs, setKycDocs] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [docReuploadFlags, setDocReuploadFlags] = useState({
    panCard: false,
    aadhaarFront: false,
    aadhaarBack: false,
    selfie: false,
    bankProof: false,
  });

  const fetchAllData = async () => {
    setLoadingKyc(true);
    try {
      const [kycData, usersDataRes] = await Promise.all([
        adminGetPendingKyc().catch((err) => { console.error('Failed to fetch pending KYC:', err); return []; }),
        adminGetUsers().catch((err) => { console.error('Failed to fetch users:', err); return []; })
      ]);
      
      // Handle various backend response wrappers (e.g., Spring Boot Page or raw object wrappers)
      const kycArray = Array.isArray(kycData) ? kycData : (kycData?.content || kycData?.data || []);
      const usersArray = Array.isArray(usersDataRes) ? usersDataRes : (usersDataRes?.content || usersDataRes?.data || []);
      
      setPendingKycList(kycArray);
      
      // Auto-cache KYC IDs for all currently pending applicants
      try {
        const cache = JSON.parse(localStorage.getItem('admin_user_kyc_ids') || '{}');
        let updated = false;
        kycArray.forEach(k => {
          const uId = k.userId;
          const kId = k.id || k.kycId;
          if (uId && kId && cache[uId] !== kId) {
            cache[uId] = kId;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem('admin_user_kyc_ids', JSON.stringify(cache));
        }
      } catch (e) {
        console.error('Failed to populate KYC ID cache:', e);
      }
      
      if (usersArray.length > 0) {
        setUsers(usersArray);
        // Sync KYC mappings from audit logs in the background
        syncKycIdsFromAuditLogs(usersArray);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoadingKyc(false);
    }
  };

  const syncKycIdsFromAuditLogs = async (usersList) => {
    try {
      const logs = await adminGetAuditLogs().catch((err) => {
        console.warn('Failed to fetch audit logs for KYC mapping sync:', err);
        return [];
      });
      
      const logsArray = Array.isArray(logs) ? logs : (logs?.content || logs?.data || []);
      if (logsArray.length === 0) return;
      
      const cache = JSON.parse(localStorage.getItem('admin_user_kyc_ids') || '{}');
      let updated = false;
      
      const usersToMap = usersList || users;
      if (!usersToMap || usersToMap.length === 0) return;
      
      logsArray.forEach((log) => {
        const action = String(log.action || '').toUpperCase();
        const details = String(log.details || log.message || log.payload || '');
        
        if (action.includes('KYC') || details.includes('KYC') || details.includes('kyc')) {
          const logUserId = log.userId || log.targetId || log.target;
          const uuidCandidates = new Set();
          
          if (logUserId && logUserId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)) {
            uuidCandidates.add(logUserId);
          }
          
          const detailsUuids = details.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
          if (detailsUuids) {
            detailsUuids.forEach(u => uuidCandidates.add(u));
          }
          
          const uuids = Array.from(uuidCandidates);
          if (uuids.length >= 2) {
            let matchedUserId = null;
            let potentialKycId = null;
            
            for (const uuid of uuids) {
              const matchedUser = usersToMap.find(u => String(u.id || u.userId) === String(uuid));
              if (matchedUser) {
                matchedUserId = uuid;
              } else {
                potentialKycId = uuid;
              }
            }
            
            if (matchedUserId && potentialKycId) {
              if (cache[matchedUserId] !== potentialKycId) {
                cache[matchedUserId] = potentialKycId;
                updated = true;
              }
            }
          }
        }
      });
      
      if (updated) {
        localStorage.setItem('admin_user_kyc_ids', JSON.stringify(cache));
        console.info('Successfully updated KYC ID mappings from audit logs.');
      }
    } catch (e) {
      console.error('Failed to sync KYC ID mappings from audit logs:', e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      if (editUserId) {
        const updatePayload = {
          isActive: (formData.status === 'ACTIVE' || formData.status === 'Active')
        };
        
        await adminUpdateUser(editUserId, updatePayload);
        await fetchAllData(); // Refresh table to show updated data
      } else {
        // Fallback for purely frontend creation (if needed)
        const newId = `USR${String(users.length + 1).padStart(3, '0')}`;
        setUsers([{ id: newId, ...formData }, ...users]);
      }
      setIsModalOpen(false);
      setEditUserId(null);
    } catch (err) {
      console.error('Failed to update user', err);
      setActionError(err.message || 'Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper: resolve the real KYC record ID for a user by cross-referencing pendingKycList.
  // The /api/admin/users response uses `id` = userId, NOT the KYC record ID.
  // The /api/admin/kyc/pending response uses `id` = kycId and `userId` = userId.
  const resolveKycIdForUser = (row) => {
    // 1. If the row itself came from the pending KYC list, it has the real kycId
    if (row.kycId) return row.kycId;
    
    const userId = row.id || row.userId;
    
    // 2. Look up the pending KYC list for a matching userId
    const kycRecord = pendingKycList.find(
      (k) => String(k.userId) === String(userId)
    );
    if (kycRecord) {
      const foundId = kycRecord.id || kycRecord.kycId;
      if (foundId) {
        saveKycIdToCache(userId, foundId);
        return foundId;
      }
    }
    
    // 3. Look up in the persistent local storage cache
    const cachedId = getKycIdFromCache(userId);
    if (cachedId) return cachedId;
    
    // 4. Fallback: use the userId (will likely 404, but the caller handles that)
    return userId;
  };

  const handleEditClick = async (row) => {
    const userId = row.id || row.userId;
    const kycId = resolveKycIdForUser(row);
    const kycStatus = String(row.kycStatus || '').toUpperCase();

    setFormData({
      id: userId,
      name: row.name || row.fullName || (row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : ''),
      email: row.email || '',
      role: row.role || 'Investor',
      status: row.status || 'Active',
      joinDate: row.joinDate || row.createdAt || row.createdDate || row.registrationDate,
      // Extra details for view
      mobileNumber: row.mobileNumber || row.phone || '',
      panNumber: row.panNumber || '',
      aadhaarLast4: row.aadhaarLast4 || '',
      address: row.address || '',
      bankDetails: row.bankDetails || {
        bankName: row.bankName || '',
        accountNumber: row.bankAccountNumber || row.accountNumber || '',
        ifscCode: row.bankIfscCode || row.ifscCode || ''
      },
      kycStatus: row.kycStatus || 'NOT_SUBMITTED',
      kycId: kycId
    });
    setEditUserId(userId);
    setIsModalOpen(true);

    // Fetch documents in the background for inline view in the Edit User modal
    setKycDocs(null);
    setLoadingDocs(true);
    try {
      let docs = null;
      if (kycStatus && kycStatus !== 'NOT_SUBMITTED') {
        try {
          docs = await adminGetUserKycDocuments(userId);
        } catch (docErr) {
          console.warn(`Could not load KYC documents by user ${userId}:`, docErr);
          try {
            docs = await adminGetKycDocuments(kycId);
          } catch (fallbackErr) {
            console.warn(`Could not load KYC documents by KYC ID ${kycId}:`, fallbackErr);
            if (fallbackErr.message?.includes('not found') || fallbackErr.status === 404) {
              docs = { empty: true };
            } else {
              throw fallbackErr;
            }
          }
        }
      } else {
        docs = { empty: true };
      }
      
      const bankRes = userId ? await adminGetUserBankDetails(userId) : null;
      setKycDocs({ ...docs, _bankDetails: bankRes });
    } catch (err) {
      console.error('Failed to load inline documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Investor',
      status: 'Active',
      joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
    setEditUserId(null);
    setKycDocs(null);
    setIsModalOpen(true);
  };

  const handleViewKycClick = async (row) => {
    setViewKycDetails(row);
    setKycDocs(null);
    setLoadingDocs(true);
    setActionError('');
    setAdminNotes('');
    setRejectReason('');
    setDocReuploadFlags({
      panCard: false,
      aadhaarFront: false,
      aadhaarBack: false,
      selfie: false,
      bankProof: false,
    });
    
    try {
      const kycId = row.id || row.kycId;
      const userId = row.userId;
      
      let docs = null;
      try {
        docs = await adminGetKycDocuments(kycId);
      } catch (docErr) {
        console.warn(`Could not load KYC documents for ID ${kycId}:`, docErr);
        if (docErr.message?.includes('not found') || docErr.status === 404) {
          docs = { empty: true };
        } else {
          throw docErr;
        }
      }
      
      const bankRes = userId ? await adminGetUserBankDetails(userId) : null;
      setKycDocs({ ...docs, _bankDetails: bankRes });
    } catch (err) {
      console.error(err);
      setActionError('Failed to load documents or bank details.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewUserKyc = async (row) => {
    const userId = row.id || row.userId;
    const kycId = resolveKycIdForUser(row);
    const kycStatus = String(row.kycStatus || '').toUpperCase();
    
    setViewKycDetails({
      id: kycId,
      kycId: kycId,
      userId: userId,
      fullName: row.name || row.fullName,
      email: row.email,
      status: row.kycStatus || 'APPROVED',
      submittedAt: row.submittedAt || row.createdAt || row.joinDate,
      createdAt: row.createdAt || row.joinDate,
    });
    setKycDocs(null);
    setLoadingDocs(true);
    setActionError('');
    setAdminNotes('');
    setRejectReason('');
    setDocReuploadFlags({
      panCard: false,
      aadhaarFront: false,
      aadhaarBack: false,
      selfie: false,
      bankProof: false,
    });
    
    try {
      let docs = null;
      if (kycStatus && kycStatus !== 'NOT_SUBMITTED') {
        try {
          docs = await adminGetUserKycDocuments(userId);
        } catch (docErr) {
          console.warn(`Could not load KYC documents by user ${userId}:`, docErr);
          try {
            docs = await adminGetKycDocuments(kycId);
          } catch (fallbackErr) {
            console.warn(`Could not load KYC documents by KYC ID ${kycId}:`, fallbackErr);
            if (fallbackErr.message?.includes('not found') || fallbackErr.status === 404) {
              docs = { empty: true };
            } else {
              throw fallbackErr;
            }
          }
        }
      } else {
        docs = { empty: true };
      }
      
      const bankRes = userId ? await adminGetUserBankDetails(userId) : null;
      setKycDocs({ ...docs, _bankDetails: bankRes });
    } catch (err) {
      console.error(err);
      setActionError(`Failed to load documents or bank details: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = async () => {
    if (!viewKycDetails) return;
    const kycId = viewKycDetails.id || viewKycDetails.kycId;
    const userId = viewKycDetails.userId;
    setActionLoading(true);
    setActionError('');
    try {
      await adminApproveKyc(kycId, adminNotes);
      saveKycIdToCache(userId, kycId);
      setViewKycDetails(null);
      fetchAllData();
    } catch (err) {
      setActionError(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!viewKycDetails) return;
    if (!rejectReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    const kycId = viewKycDetails.id || viewKycDetails.kycId;
    const userId = viewKycDetails.userId;
    setActionLoading(true);
    setActionError('');
    try {
      await adminRejectKyc(kycId, rejectReason, adminNotes);
      saveKycIdToCache(userId, kycId);
      setViewKycDetails(null);
      fetchAllData();
    } catch (err) {
      setActionError(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReupload = async () => {
    if (!viewKycDetails) return;
    if (!rejectReason.trim()) {
      setActionError('Reupload reason is required.');
      return;
    }
    const hasSelectedDoc = Object.values(docReuploadFlags).some(Boolean);
    if (!hasSelectedDoc) {
      setActionError('Select at least one document for reupload.');
      return;
    }
    const kycId = viewKycDetails.id || viewKycDetails.kycId;
    const userId = viewKycDetails.userId;
    setActionLoading(true);
    setActionError('');
    try {
      await adminRejectKycDocuments(kycId, rejectReason, adminNotes, docReuploadFlags);
      saveKycIdToCache(userId, kycId);
      setViewKycDetails(null);
      fetchAllData();
    } catch (err) {
      setActionError(err.message || 'Document reupload request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateAccountPrompt = (row) => {
    setActivationModal({ isOpen: true, row, error: '' });
  };

  const handleConfirmActivation = async () => {
    const { row } = activationModal;
    if (!row) return;
    
    setActionLoading(true);
    setActivationModal(prev => ({ ...prev, error: '' }));
    
    try {
      const userId = row.id || row.userId;
      const updatePayload = {
        isActive: true
      };

      await adminUpdateUser(userId, updatePayload);

      await fetchAllData();
      setActivationModal({ isOpen: false, row: null, error: '' });
    } catch (err) {
      console.error("FULL BACKEND ERROR:", err, err.data);
      const exactReason = `Error Code: ${err.status || 'Unknown'}\nMessage: ${err.message || 'No message'}`;
      setActivationModal(prev => ({ ...prev, error: `Activation Failed.\n${exactReason}` }));
    } finally {
      setActionLoading(false);
    }
  };

  const accountApprovalColumns = [
    { key: 'id', label: 'ID', exportValue: (row) => row.id || row.userId || 'N/A', render: (row) => row.id || row.userId || 'N/A' },
    { key: 'name', label: 'Name', exportValue: (row) => row.name || row.fullName || (row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : 'N/A'), render: (row) => row.name || row.fullName || (row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : 'N/A') },
    { key: 'email', label: 'Email', exportValue: (row) => row.email || 'N/A', render: (row) => row.email || 'N/A' },
    { key: 'bank', label: 'Bank Linked?', render: (row) => {
        const hasBank = row.bankVerified || row.bankAccountNumber || row.accountNumber || row.bankDetails?.accountNumber || row.bankDetails?.bankAccountNumber;
        return hasBank ? <span className="text-emerald-500 font-medium">Yes</span> : <span className="text-amber-500 font-medium">No</span>;
    }, exportValue: (row) => (row.bankVerified || row.bankAccountNumber || row.accountNumber || row.bankDetails?.accountNumber || row.bankDetails?.bankAccountNumber ? 'Yes' : 'No')},
    {
      key: 'action',
      label: 'Action',
      render: (row) => {
        const hasBank = row.bankVerified || row.bankAccountNumber || row.accountNumber || row.bankDetails?.accountNumber || row.bankDetails?.bankAccountNumber;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleEditClick(row)}
              className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 dark:hover:text-blue-400 font-medium text-sm flex items-center gap-1.5 bg-slate-50/50 dark:bg-white/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-white/10 hover:border-blue-500/20"
              title="View full account details"
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              type="button"
              onClick={() => handleActivateAccountPrompt(row)}
              disabled={actionLoading || !hasBank}
              className="text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-500 dark:hover:text-emerald-300 disabled:opacity-50 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
              title={!hasBank ? "Cannot activate until user links their bank" : "Click to activate account"}
            >
              <Check className="h-4 w-4" />
              Activate
            </button>
          </div>
        );
      },
    },
  ];

  const columns = [
    { key: 'id', label: 'ID', exportValue: (row) => row.id || row.userId || 'N/A', render: (row) => row.id || row.userId || 'N/A' },
    {
      key: 'name',
      label: 'Name',
      exportValue: (row) =>
        row.fullName || row.name || row.userName || (row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : null) || 'N/A',
      render: (row) => {
        const displayName =
          row.fullName ||
          row.name ||
          row.userName ||
          (row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : null) ||
          'N/A';

        return (
          <button
            type="button"
            onClick={() => handleViewUserKyc(row)}
            className="text-left font-medium text-blue-600 dark:text-blue-300 transition hover:text-blue-500 dark:hover:text-blue-200 hover:underline"
            title="View user profile and uploaded documents"
          >
            {displayName}
          </button>
        );
      },
    },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', exportValue: (row) => row.role || row.userRole || 'User', render: (row) => row.role || row.userRole || 'User' },
    {
      key: 'status',
      label: 'Account Status',
      exportValue: (row) => row.status || row.userStatus || row.accountStatus || 'N/A',
      render: (row) => {
        // Strictly read the string from the backend without modifying it
        const statusStr = row.status || row.userStatus || row.accountStatus;
        return <StatusBadge label={statusStr || 'N/A'} />;
      },
    },
    {
      key: 'kycStatus',
      label: 'KYC Status',
      exportValue: (row) => row.kycStatus || 'NOT SUBMITTED',
      render: (row) => {
        const kycStr = row.kycStatus || 'NOT SUBMITTED';
        return <StatusBadge label={kycStr} />;
      },
    },
    { 
      key: 'joinDate', 
      label: 'Join Date', 
      exportValue: (row) => row.joinDate || row.createdAt || row.createdDate || row.registrationDate || 'N/A',
      render: (row) => {
        const dateStr = row.joinDate || row.createdAt || row.createdDate || row.registrationDate;
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/users/${row.id || row.userId}`)}
            className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 transition"
          >
            360°
          </button>
          <button
            type="button"
            onClick={() => handleEditClick(row)}
            className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-1.5 text-slate-500 dark:text-slate-300 transition hover:text-blue-500 hover:border-blue-500/20 hover:bg-blue-500/10"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const kycColumns = [
    { key: 'id', label: 'KYC ID', exportValue: (row) => row.id || row.kycId || 'N/A', render: (row) => row.id || row.kycId || 'N/A' },
    { key: 'userId', label: 'User ID' },
    { key: 'fullName', label: 'User Name', exportValue: (row) => {
        const u = users.find(u => String(u.id) === String(row.userId) || String(u.userId) === String(row.userId));
        return row.fullName || row.userName || row.name || u?.fullName || u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : null) || row.userId;
    }, render: (row) => {
        const u = users.find(u => String(u.id) === String(row.userId) || String(u.userId) === String(row.userId));
        const name = row.fullName || row.userName || row.name || u?.fullName || u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : null);
        return name || row.userId;
    }},
    { key: 'email', label: 'Email', exportValue: (row) => {
        const u = users.find(u => String(u.id) === String(row.userId) || String(u.userId) === String(row.userId));
        return row.email || u?.email || 'N/A';
    }, render: (row) => {
        const u = users.find(u => String(u.id) === String(row.userId) || String(u.userId) === String(row.userId));
        return row.email || u?.email || 'N/A';
    }},
    {
      key: 'status',
      label: 'Status',
      exportValue: (row) => row.status || 'PENDING',
      render: (row) => <StatusBadge label={row.status || 'PENDING'} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewKycClick(row)}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 transition-all duration-200"
        >
          Review
        </button>
      ),
    },
  ];

  const renderDoc = (title, pathOrUrl, options = {}) => {
    const { status, reason, selectable = false, selected = false, onToggle } = options;
    if (!pathOrUrl) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
            {status ? (
              <span className="rounded-full border border-slate-200/60 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                {status}
              </span>
            ) : null}
          </div>
          {reason ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">{reason}</div> : null}
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-6">
            <AlertCircle className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">No {title} provided</span>
          </div>
        </div>
      );
    }
    
    // Convert raw S3 bucket paths to actual URLs using the backend proxy endpoint
    let fullUrl = pathOrUrl;
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) {
      fullUrl = pathOrUrl;
    } else {
      fullUrl = buildUrl(`/api/files/view?path=${encodeURIComponent(pathOrUrl)}`);
    }
    
    const isPdf = String(pathOrUrl).toLowerCase().endsWith('.pdf') || String(pathOrUrl).includes('.pdf?');
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          {status ? (
            <span className="rounded-full border border-slate-200/60 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {status}
            </span>
          ) : null}
        </div>
        {reason ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">{reason}</div> : null}
        {selectable ? (
          <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${selected ? 'border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-200' : 'border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'}`}>
            <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-amber-400" />
            Mark this document for reupload
          </label>
        ) : null}
        <a href={fullUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-slate-950/80 min-h-[220px]">
          {isPdf ? (
            <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-6 transition hover:bg-slate-100 dark:hover:bg-slate-900/40">
              <FileText className="mb-3 h-12 w-12 text-rose-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">PDF Document</span>
              <span className="mt-2 max-w-full truncate px-2 text-xs text-slate-500 dark:text-slate-400">
                {pathOrUrl.split('/').pop().split('\\').pop()}
              </span>
            </div>
          ) : (
            <img src={fullUrl} alt={title} className="h-full min-h-[220px] w-full object-contain bg-slate-50 dark:bg-slate-950/70 p-3 opacity-95 transition duration-300 group-hover:opacity-100" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300">
            <span className="text-white text-sm font-medium px-3 py-1.5 bg-blue-500/90 rounded-full flex items-center gap-2 shadow-lg">
              <Eye className="h-4 w-4" /> Open Full
            </span>
          </div>
        </a>
      </div>
    );
  };

  const liveStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => String(u.status || u.userStatus || u.accountStatus || '').toUpperCase() === 'ACTIVE').length;
    const pendingKyc = pendingKycList.length;
    const pendingActivation = users.filter(u => {
      const isAccountPending = String(u.status || u.userStatus || u.accountStatus || '').toUpperCase() === 'PENDING';
      const isKycApproved = String(u.kycStatus || '').toUpperCase() === 'APPROVED';
      return isAccountPending && isKycApproved;
    }).length;
    return [
      { title: 'Total Users', value: totalUsers, note: 'registered accounts across all roles' },
      { title: 'Active Accounts', value: activeUsers, note: 'fully activated and operational' },
      { title: 'Pending KYC', value: pendingKyc, note: 'awaiting document review' },
      { title: 'Pending Activation', value: pendingActivation, note: 'KYC approved, account pending' },
    ];
  }, [users, pendingKycList]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Access and role control
        </p>
        <h1 className="section-title mt-3">User Management</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Manage admin, support, compliance, and investor accounts with clear role and status visibility. Review pending KYC applications here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {liveStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      {/* KYC Approvals Table */}
      <DataTable
        title="Pending KYC Approvals"
        description="Review uploaded documents and approve or reject KYC for new investors."
        data={pendingKycList}
        columns={kycColumns}
        searchableKeys={['id', 'kycId', 'userId', 'fullName', 'userName', 'email']}
        searchPlaceholder="Search KYC ID, user name, or email..."
        itemsPerPage={10}
        actions={[{ label: loadingKyc ? 'Refreshing...' : 'Refresh Queue', icon: Check, variant: 'secondary', onClick: fetchAllData }]}
        enableCsvExport
        exportFileName="pending-kyc-approvals"
      />

      {/* Account Activation Table */}
      <DataTable
        title="Pending Account Activations"
        description="Review users who have an approved KYC but are still pending full account activation. The user can activate this themselves, or you can force-activate it here."
        data={users.filter(u => {
          const isAccountPending = String(u.status || u.userStatus || u.accountStatus || '').toUpperCase() === 'PENDING';
          const isKycApproved = String(u.kycStatus || '').toUpperCase() === 'APPROVED';
          return isAccountPending && isKycApproved;
        })}
        columns={accountApprovalColumns}
        searchableKeys={['id', 'name', 'email']}
        searchPlaceholder="Search by name or email..."
        itemsPerPage={10}
        enableCsvExport
        exportFileName="pending-account-activations"
      />

      {/* Main Users Directory */}
      <DataTable
        title="Users Directory"
        description="Control user access, audit account states, and add new operational profiles."
        data={users}
        columns={columns}
        searchableKeys={['id', 'name', 'email', 'role']}
        searchPlaceholder="Search by name, email, or role..."
        filterKey="status"
        filterOptions={['Active', 'Inactive']}
        itemsPerPage={20}
        actions={[{ label: 'Add User', icon: UserPlus, variant: 'primary', onClick: handleAddClick }]}
        enableCsvExport
        exportFileName="users-directory"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full ${editUserId ? 'max-w-5xl' : 'max-w-md'} my-auto flex max-h-[92vh] flex-col rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#071226] shadow-[0_25px_70px_rgba(0,0,0,0.4)] overflow-hidden`}>
            
            {/* Top Modal Header */}
            <div className="border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#08152f] dark:via-[#091838] dark:to-[#08152f] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-heading text-lg font-bold text-white shadow-lg shadow-blue-500/20">
                    {(formData.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                        {editUserId ? (formData.name || 'Investor Review') : 'Add New User'}
                      </h3>
                      {editUserId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {formData.role || 'INVESTOR'}
                        </span>
                      )}
                      {editUserId && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          String(formData.status).toUpperCase() === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${String(formData.status).toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {formData.status || 'ACTIVE'}
                        </span>
                      )}
                    </div>
                    {editUserId && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formData.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.email, 'email')}
                          className="hover:text-blue-500 transition"
                          title="Copy Email"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {copiedField === 'email' && <span className="text-emerald-500 text-[11px] font-medium">Copied!</span>}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.05] p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Tabs for Edit Mode */}
              {editUserId && (
                <div className="mt-5 flex gap-2 border-t border-slate-200/60 dark:border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalTab('overview')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      modalTab === 'overview'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Profile & Bank Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('documents')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      modalTab === 'documents'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <FileCheck className="h-4 w-4" />
                    KYC & Uploaded Documents
                    {kycDocs && <span className="ml-1 rounded-full bg-white/20 px-2 py-0.2 text-[10px]">Ready</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUser} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
                
                {actionError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-sm text-rose-500 dark:text-rose-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{actionError}</p>
                  </div>
                )}

                {/* OVERVIEW / BANK TAB */}
                {(!editUserId || modalTab === 'overview') && (
                  <div className={`${editUserId ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'space-y-4'}`}>
                    
                    {/* Left Side: Account Management */}
                    <div className={`${editUserId ? 'lg:col-span-5' : ''} space-y-4`}>
                      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-5 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-500" />
                          Account Settings
                        </h4>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
                          <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="input-shell w-full text-sm"
                            placeholder="Investor Full Name"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Email Address</label>
                          <input
                            required
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input-shell w-full text-sm"
                            placeholder="Email Address"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Platform Role</label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="input-shell w-full text-sm"
                          >
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Support">Support</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Investor">Investor</option>
                            {formData.role && !['Super Admin', 'Admin', 'Support', 'Compliance', 'Investor'].includes(formData.role) && (
                              <option value={formData.role}>{formData.role} (Backend Value)</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Account Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="input-shell w-full text-sm font-medium"
                          >
                            <option value="ACTIVE">ACTIVE (Full Platform Access)</option>
                            <option value="PENDING">PENDING (Onboarding Incomplete)</option>
                            <option value="SUSPENDED">SUSPENDED (Restricted)</option>
                            <option value="DEACTIVATED">DEACTIVATED</option>
                            {formData.status && !['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED'].includes(String(formData.status).toUpperCase()) && (
                              <option value={formData.status}>{formData.status} (Backend Value)</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Identity & Bank Cards (Only in edit mode) */}
                    {editUserId && (
                      <div className="lg:col-span-7 space-y-5">
                        
                        {/* Identity & Contact Details */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-5 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-500" />
                            Investor Identity & Contact
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#071226]/80 p-3.5 flex items-center justify-between">
                              <div>
                                <span className="block text-[11px] font-medium text-slate-400">Mobile Number</span>
                                <span className="mt-0.5 block text-sm font-semibold text-slate-800 dark:text-slate-100 font-mono">
                                  {formData.mobileNumber || 'N/A'}
                                </span>
                              </div>
                              {formData.mobileNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.mobileNumber, 'mobile')}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 transition"
                                  title="Copy Mobile"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#071226]/80 p-3.5 flex items-center justify-between">
                              <div>
                                <span className="block text-[11px] font-medium text-slate-400">PAN Number</span>
                                <span className="mt-0.5 block text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                                  {formData.panNumber || 'N/A'}
                                </span>
                              </div>
                              {formData.panNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.panNumber, 'pan')}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 transition"
                                  title="Copy PAN"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#071226]/80 p-3.5">
                              <span className="block text-[11px] font-medium text-slate-400">Aadhaar (Last 4)</span>
                              <span className="mt-0.5 block text-sm font-semibold text-slate-800 dark:text-slate-100 font-mono">
                                {formData.aadhaarLast4 ? `XXXX XXXX ${formData.aadhaarLast4}` : 'N/A'}
                              </span>
                            </div>

                            <div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#071226]/80 p-3.5">
                              <span className="block text-[11px] font-medium text-slate-400">Registered Address</span>
                              <span className="mt-0.5 block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {formData.address || 'India'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Premium Bank Account Card */}
                        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-[#0a1835] to-slate-950/40 p-5 space-y-4 shadow-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-blue-400" />
                              Linked Bank Account
                            </h4>
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3.5">
                              <span className="block text-[11px] font-medium text-slate-400">Bank Name</span>
                              <span className="mt-1 block text-sm font-semibold text-white">
                                {formData.bankDetails?.bankName || 'State Bank of India'}
                              </span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3.5 flex items-center justify-between">
                              <div>
                                <span className="block text-[11px] font-medium text-slate-400">Account Number</span>
                                <span className="mt-1 block text-sm font-semibold text-white font-mono">
                                  {formData.bankDetails?.accountNumber || '0000000000'}
                                </span>
                              </div>
                              {formData.bankDetails?.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.bankDetails.accountNumber, 'acc')}
                                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-blue-400 transition"
                                  title="Copy Account Number"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3.5 flex items-center justify-between">
                              <div>
                                <span className="block text-[11px] font-medium text-slate-400">IFSC Code</span>
                                <span className="mt-1 block text-sm font-semibold text-white font-mono">
                                  {formData.bankDetails?.ifscCode || 'SBIN0000000'}
                                </span>
                              </div>
                              {formData.bankDetails?.ifscCode && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.bankDetails.ifscCode, 'ifsc')}
                                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-blue-400 transition"
                                  title="Copy IFSC"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {editUserId && modalTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-blue-500" />
                        Uploaded KYC Documents & Identification Proofs
                      </h4>
                      {loadingDocs && (
                        <span className="text-xs text-blue-500 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Fetching latest files...
                        </span>
                      )}
                    </div>

                    {loadingDocs ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="text-sm">Loading investor documents...</span>
                      </div>
                    ) : kycDocs ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {renderDoc('PAN Card', kycDocs.panCard || kycDocs.panCardUrl || kycDocs.panCardImage || kycDocs.panCardPath)}
                        {renderDoc('Aadhaar Front', kycDocs.aadhaarFront || kycDocs.aadhaarFrontUrl || kycDocs.aadhaarFrontImage || kycDocs.aadhaarFrontPath)}
                        {renderDoc('Aadhaar Back', kycDocs.aadhaarBack || kycDocs.aadhaarBackUrl || kycDocs.aadhaarBackImage || kycDocs.aadhaarBackPath)}
                        {renderDoc('Selfie Photo', kycDocs.selfie || kycDocs.selfieUrl || kycDocs.selfiePhoto || kycDocs.selfiePath)}
                        {renderDoc('Bank Proof', kycDocs.bankProof || kycDocs.bankPassbookOrStatement || kycDocs.bankProofUrl || kycDocs.bankProofPath)}
                      </div>
                    ) : (
                      <div className="p-12 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No uploaded KYC documents available for this user.</p>
                        <p className="text-xs text-slate-400">The user may not have completed the document upload onboarding step yet.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#08152f]/90 px-6 py-4 backdrop-blur-md">
                <div className="text-xs text-slate-400">
                  {copiedField ? <span className="text-emerald-500 font-medium">✓ Copied to clipboard!</span> : 'Click copy icons for quick data access'}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={actionLoading}
                    className="btn-secondary rounded-xl px-5 py-2 text-sm font-semibold transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC Review Modal */}
      {viewKycDetails && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-6xl max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071226] shadow-[0_32px_90px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5 bg-slate-50 dark:bg-[#08152f]">
              <div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">Review KYC Documents</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inspect applicant details, uploaded files, and bank information before taking action.</p>
              </div>
              <button onClick={() => !actionLoading && setViewKycDetails(null)} disabled={actionLoading} className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] p-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="min-h-0 flex-1 overflow-y-auto p-6 pb-24 space-y-8">
              {actionError && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">{actionError}</div>}
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">Applicant Details</h4>
                <div className="grid gap-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.035] p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">ID</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">{viewKycDetails.id || viewKycDetails.kycId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Name / ID</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {(() => {
                        const u = users.find(u => String(u.id) === String(viewKycDetails.userId) || String(u.userId) === String(viewKycDetails.userId));
                        const name = viewKycDetails.fullName || viewKycDetails.userName || viewKycDetails.name || u?.fullName || u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : null);
                        return name ? `${name} (${viewKycDetails.userId})` : `User ID: ${viewKycDetails.userId}`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Email</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {(() => {
                        const u = users.find(u => String(u.id) === String(viewKycDetails.userId) || String(u.userId) === String(viewKycDetails.userId));
                        return viewKycDetails.email || u?.email || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Submitted</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {(() => {
                        const u = users.find(u => String(u.id) === String(viewKycDetails.userId) || String(u.userId) === String(viewKycDetails.userId));
                        const dateStr = viewKycDetails.submittedAt || viewKycDetails.createdAt || viewKycDetails.updatedAt || u?.createdAt || u?.joinDate || u?.registrationDate;
                        if (!dateStr) return 'N/A';
                        try {
                          return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        } catch (e) {
                          return dateStr;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-4 uppercase tracking-wide">Uploaded Documents</h4>
                {loadingDocs ? (
                  <div className="py-12 flex justify-center text-slate-500 dark:text-slate-300">Loading documents...</div>
                ) : (kycDocs || viewKycDetails) ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {DOC_REUPLOAD_FIELDS.map((doc) =>
                      renderDoc(
                        doc.label,
                        kycDocs?.[doc.key] ||
                          kycDocs?.[`${doc.key}Url`] ||
                          kycDocs?.[`${doc.key}Image`] ||
                          kycDocs?.[`${doc.key}Path`] ||
                          viewKycDetails?.[`${doc.key}Path`],
                        {
                          status: kycDocs?.[doc.statusKey] || viewKycDetails?.[doc.statusKey],
                          reason: kycDocs?.[doc.reasonKey] || viewKycDetails?.[doc.reasonKey],
                          selectable: true,
                          selected: docReuploadFlags[doc.key],
                          onToggle: () => setDocReuploadFlags((prev) => ({ ...prev, [doc.key]: !prev[doc.key] })),
                        },
                      ),
                    )}
                  </div>
                ) : (
                  <div className="py-12 flex justify-center text-rose-400">Failed to load documents.</div>
                )}
              </div>

              {/* Bank Details Review */}
              {(() => {
                const u = users.find(u => String(u.id) === String(viewKycDetails?.userId) || String(u.userId) === String(viewKycDetails?.userId));
                // Try to find typed bank details from either the API response, the KYC object, or the user list
                const bankInfo = {
                  accountHolderName: kycDocs?._bankDetails?.accountHolderName || viewKycDetails?.accountHolderName || u?.accountHolderName || u?.bankDetails?.accountHolderName || viewKycDetails?.fullName || viewKycDetails?.name || u?.fullName || u?.name,
                  bankName: kycDocs?._bankDetails?.bankName || viewKycDetails?.bankName || u?.bankName || u?.bankDetails?.bankName,
                  accountNumber: kycDocs?._bankDetails?.accountNumber || kycDocs?._bankDetails?.bankAccountNumber || viewKycDetails?.bankAccountNumber || viewKycDetails?.accountNumber || u?.bankAccountNumber || u?.accountNumber || u?.bankDetails?.bankAccountNumber,
                  ifscCode: kycDocs?._bankDetails?.ifscCode || kycDocs?._bankDetails?.bankIfscCode || viewKycDetails?.bankIfscCode || viewKycDetails?.ifscCode || u?.bankIfscCode || u?.ifscCode || u?.bankDetails?.bankIfscCode
                };

                const hasAnyBankDetail = 
                  kycDocs?._bankDetails?.accountHolderName ||
                  kycDocs?._bankDetails?.bankName ||
                  kycDocs?._bankDetails?.accountNumber ||
                  kycDocs?._bankDetails?.ifscCode ||
                  viewKycDetails?.accountHolderName ||
                  viewKycDetails?.bankName ||
                  viewKycDetails?.bankAccountNumber ||
                  viewKycDetails?.accountNumber ||
                  viewKycDetails?.bankIfscCode ||
                  viewKycDetails?.ifscCode ||
                  u?.accountHolderName ||
                  u?.bankName ||
                  u?.bankAccountNumber ||
                  u?.accountNumber ||
                  u?.bankIfscCode ||
                  u?.ifscCode ||
                  u?.bankDetails?.accountHolderName ||
                  u?.bankDetails?.bankName ||
                  u?.bankDetails?.accountNumber ||
                  u?.bankDetails?.ifscCode;

                if (!hasAnyBankDetail) {
                  return (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-4 uppercase tracking-wide">Linked Bank Details</h4>
                      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.035] text-sm text-slate-500 dark:text-slate-300">
                        No typed bank details found. The user will link their bank account after their KYC is approved.
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">Linked Bank Details</h4>
                    <div className="grid gap-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.035] p-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Account Holder</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{bankInfo.accountHolderName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Bank Name</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{bankInfo.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Account Number</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-mono">{bankInfo.accountNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1 dark:text-slate-400">IFSC Code</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-mono">{bankInfo.ifscCode || 'N/A'}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <AlertCircle className="inline-block h-3 w-3 mr-1 -mt-0.5" />
                      Approving this KYC will also approve the attached bank details for withdrawals.
                    </p>
                  </div>
                );
              })()}

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60 dark:border-white/5">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Admin Notes (Optional)</label>
                  <textarea 
                    value={adminNotes} 
                    onChange={e => setAdminNotes(e.target.value)} 
                    className="input-shell w-full min-h-[100px] resize-none" 
                    placeholder="Internal notes about this review..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Rejection Reason <span className="text-rose-400">*</span></label>
                  <textarea 
                    value={rejectReason} 
                    onChange={e => setRejectReason(e.target.value)} 
                    className="input-shell w-full min-h-[100px] resize-none" 
                    placeholder="Required ONLY if rejecting..."
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-3 border-t border-slate-200 dark:border-white/10 px-6 py-4 bg-slate-50 dark:bg-[#08152f]">
              <button type="button" onClick={() => setViewKycDetails(null)} disabled={actionLoading} className="btn-secondary disabled:opacity-50">
                {String(viewKycDetails?.status || 'PENDING').toUpperCase() === 'PENDING' ? 'Cancel' : 'Close'}
              </button>
              {String(viewKycDetails?.status || 'PENDING').toUpperCase() === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={handleRequestReupload}
                    disabled={actionLoading || loadingDocs || !kycDocs || kycDocs.empty}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2 text-sm font-semibold text-slate-950 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Request Reupload'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading || loadingDocs || !kycDocs || kycDocs.empty}
                    className="rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject KYC'}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading || loadingDocs || !kycDocs || kycDocs.empty}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve KYC'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Activation Confirmation Modal */}
      {activationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#08152f] shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">Activate Account</h3>
              <button onClick={() => setActivationModal({ isOpen: false, row: null, error: '' })} disabled={actionLoading} className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Are you sure you want to activate the account for <strong className="text-slate-800 dark:text-white">{activationModal.row?.name || activationModal.row?.fullName || (activationModal.row?.firstName ? `${activationModal.row?.firstName} ${activationModal.row?.lastName || ''}`.trim() : 'this user')}</strong>? 
                This will grant them full access to the platform.
              </p>
              
              {activationModal.error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-400 whitespace-pre-wrap">{activationModal.error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActivationModal({ isOpen: false, row: null, error: '' })}
                  disabled={actionLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActivation}
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                  {actionLoading ? 'Activating...' : 'Confirm Activation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
