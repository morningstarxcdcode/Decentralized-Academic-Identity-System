import { useState, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, UserCheck, FileText, Wallet } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useAuth } from '../contexts/AuthContext';
import { pinataService } from '../services/pinataService';
import styles from '../styles/UniversityPortal.module.css';

const UniversityPortal = () => {
    const { account, role, connectWallet, issueCredential, batchIssueCredentials, loading, ipfsProgress, isDemoMode, isWalletInstalled } = useBlockchain();
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState('issue');
    const fileInputRef = useRef(null);
    const [connectingReal, setConnectingReal] = useState(false);
    
    // Form State
    const [form, setForm] = useState({
        studentName: '',
        studentDID: '',
        courseName: '',
        gpa: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileCID, setFileCID] = useState(null);
    const [status, setStatus] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFileCID(null);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setStatus({ type: 'error', msg: 'Please select a file first' });
            return;
        }

        setUploadingFile(true);
        setStatus(null);
        
        try {
            const result = await pinataService.uploadFile(selectedFile, {
                name: `certificate-${form.studentName || 'unknown'}-${Date.now()}`
            });
            setFileCID(result.IpfsHash);
            setStatus({ 
                type: 'success', 
                msg: `File uploaded to IPFS! CID: ${result.IpfsHash.slice(0, 20)}...` 
            });
        } catch (err) {
            setStatus({ type: 'error', msg: `Upload failed: ${err.message}` });
        } finally {
            setUploadingFile(false);
        }
    };

    const handleBatch = async () => {
        setStatus(null);
        const mockRecords = [
            { did: '0xABC...1', name: 'John Doe', course: 'B.Sc. CS' },
            { did: '0xABC...2', name: 'Jane Smith', course: 'M.Sc. AI' },
            { did: '0xABC...3', name: 'Bob Wilson', course: 'B.Eng' },
            { did: '0xABC...4', name: 'Alice Brown', course: 'PhD Physics' },
            { did: '0xABC...5', name: 'Charlie Davis', course: 'B.A. Arts' }
        ];
        try {
            await batchIssueCredentials(mockRecords);
            setStatus({ type: 'success', msg: 'Batch of 5 credentials successfully issued!' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        }
    };

    // Check if user has university role
    const isUniversity = role === 'university';

    const handleDemoLogin = async () => {
        try {
            await connectWallet('university');
        } catch (err) {
            console.error('Demo login failed:', err);
        }
    };

    const handleRealWalletConnect = async () => {
        setConnectingReal(true);
        try {
            await connectWallet(); // No role = real wallet
        } catch (err) {
            console.error('Wallet connection failed:', err);
        } finally {
            setConnectingReal(false);
        }
    };

    if (!isUniversity) {
        return (
            <div className="container" style={{paddingTop: 120, textAlign: 'center'}}>
                <h2>University Portal</h2>
                <p>Connect your authorized university wallet to issue credentials on Polygon blockchain.</p>
                
                {isWalletInstalled() && (
                    <button 
                        onClick={handleRealWalletConnect}
                        className={styles.submitBtn}
                        disabled={connectingReal}
                        style={{marginTop: 20, width: 'auto', padding: '10px 30px', background: '#8b5cf6'}}
                    >
                        <Wallet size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {connectingReal ? 'Connecting...' : 'Connect MetaMask'}
                    </button>
                )}
                
                <div style={{ margin: '16px 0', color: '#666' }}>or</div>
                
                <button 
                    onClick={handleDemoLogin}
                    className={styles.submitBtn}
                    style={{width: 'auto', padding: '10px 30px', background: '#374151'}}
                >
                    Try Demo Mode
                </button>
                <p style={{marginTop: 16, color: '#888', fontSize: '0.9rem'}}>
                    Demo mode stores credentials on IPFS only. Real on-chain issuance requires an authorized wallet.
                </p>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        
        if (!form.studentDID || !form.studentName || !form.courseName) {
            setStatus({ type: 'error', msg: 'Please fill in all required fields' });
            return;
        }

        try {
            const result = await issueCredential(form.studentDID, form.studentName, form.courseName);
            const isOnChain = result.txHash ? true : false;
            setStatus({ 
                type: 'success', 
                msg: isOnChain 
                    ? `Credential issued on-chain! TX: ${result.txHash.slice(0, 15)}... CID: ${result.cid.slice(0, 15)}...`
                    : `Credential issued (Demo)! Hash: ${result.hash.slice(0, 15)}... CID: ${result.cid.slice(0, 15)}...`
            });
            setForm({ studentName: '', studentDID: '', courseName: '', gpa: '' });
            setSelectedFile(null);
            setFileCID(null);
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        }
    };

    const displayAccount = account || auth?.getDID?.() || 'Not connected';
    const showOnChainWarning = isDemoMode();

    return (
        <div className={`container ${styles.portal}`}>
            <header className={styles.header}>
                <div className={styles.topInfo}>
                    <div className={styles.avatar}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <span className={styles.adminName}>{auth?.profile?.displayName || 'Univ Admin'}</span>
                        <span className={styles.address}>({typeof displayAccount === 'string' ? `${displayAccount.slice(0, 10)}...` : 'N/A'})</span>
                        {showOnChainWarning && (
                            <span style={{ 
                                marginLeft: 8, 
                                padding: '2px 8px', 
                                background: '#f59e0b', 
                                color: '#000', 
                                borderRadius: 4, 
                                fontSize: '0.75rem' 
                            }}>
                                Demo Mode
                            </span>
                        )}
                    </div>
                </div>
                <h1 className={styles.portalTitle}>University Portal</h1>
                {showOnChainWarning && (
                    <div style={{ 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        border: '1px solid #f59e0b', 
                        borderRadius: 8, 
                        padding: '8px 16px', 
                        marginBottom: 16,
                        fontSize: '0.85rem',
                        color: '#f59e0b'
                    }}>
                        ⚠️ Demo mode: Credentials are stored on IPFS but not on blockchain. Connect a real wallet for on-chain issuance.
                    </div>
                )}
                <nav className={styles.portalNav}>
                    <button className={activeTab === 'issue' ? styles.activeTab : ''} onClick={() => setActiveTab('issue')}>Issue Credential</button>
                    <button className={activeTab === 'history' ? styles.activeTab : ''} onClick={() => setActiveTab('history')}>My Issuances</button>
                </nav>
            </header>

            <Motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.content}
            >
                {activeTab === 'issue' ? (
                    <div className={styles.issueFormWrapper}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <h3>Issue New Certificate</h3>
                            
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Student DID / Wallet Address *</label>
                                    <input 
                                        type="text" 
                                        placeholder="0x... or did:firebase:..."
                                        value={form.studentDID}
                                        onChange={(e) => setForm({...form, studentDID: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Student Full Name *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter full legal name"
                                        value={form.studentName}
                                        onChange={(e) => setForm({...form, studentName: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Credential Type</label>
                                    <select className={styles.select}>
                                        <option>Degree</option>
                                        <option>Certificate</option>
                                        <option>Diploma</option>
                                        <option>Transcript</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Major / Course Name *</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. B.Sc. Computer Science"
                                        value={form.courseName}
                                        onChange={(e) => setForm({...form, courseName: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Final GPA / Grade</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 4.0 / A+"
                                        value={form.gpa}
                                        onChange={(e) => setForm({...form, gpa: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className={styles.fileActions}>
                                <div className={styles.fileUpload}>
                                    <Upload size={20} />
                                    <span>{selectedFile ? selectedFile.name : 'Upload Certificate PDF'}</span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        style={{ display: 'none' }}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.chooseFile}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Choose File
                                    </button>
                                </div>
                                <button 
                                    type="button" 
                                    className={styles.pinataBtn}
                                    onClick={handleFileUpload}
                                    disabled={!selectedFile || uploadingFile}
                                >
                                    {uploadingFile ? 'Uploading...' : 'Upload to IPFS'}
                                </button>
                            </div>

                            {fileCID && (
                                <div className={styles.cidDisplay}>
                                    <FileText size={16} />
                                    <span>File CID: {fileCID}</span>
                                </div>
                            )}

                            <div className={styles.formButtons}>
                                <button type="submit" className={styles.submitBtn} disabled={loading}>
                                    {loading ? 'Issuing...' : 'Issue Credential'}
                                </button>
                                <button type="button" className={styles.batchBtn} onClick={handleBatch} disabled={loading}>
                                    Simulate Batch Issue (5 Records)
                                </button>
                                <button type="button" className={styles.cancelBtn} onClick={() => {
                                    setForm({ studentName: '', studentDID: '', courseName: '', gpa: '' });
                                    setSelectedFile(null);
                                    setFileCID(null);
                                    setStatus(null);
                                }}>
                                    Clear
                                </button>
                            </div>

                            {loading && (
                                <div className={styles.progressWrapper}>
                                    <div className={styles.progressBar} style={{ width: `${ipfsProgress}%` }}></div>
                                    <span className={styles.progressText}>Processing: {ipfsProgress}%</span>
                                </div>
                            )}

                            {status && (
                                <div className={`${styles.status} ${styles[status.type]}`}>
                                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    {status.msg}
                                </div>
                            )}
                        </form>
                    </div>
                ) : (
                    <HistoryTable />
                )}
            </Motion.div>
        </div>
    );
};

const HistoryTable = () => {
    const { getIssuedCredentials } = useBlockchain();
    const creds = getIssuedCredentials();

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Hash ID</th>
                        <th>Student DID</th>
                        <th>IPFS CID</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {creds.length === 0 ? (
                        <tr><td colSpan="5" style={{textAlign: 'center', padding: 40, color: '#666'}}>No credentials issued yet.</td></tr>
                    ) : creds.map(c => (
                        <tr key={c.hash}>
                            <td className={styles.mono}>{c.hash.substring(0, 12)}...</td>
                            <td className={styles.mono}>{c.studentDID.substring(0, 12)}...</td>
                            <td className={styles.mono}>
                                <a 
                                    href={`https://gateway.pinata.cloud/ipfs/${c.ipfsCID}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#6366f1' }}
                                >
                                    {c.ipfsCID?.substring(0, 12)}...
                                </a>
                            </td>
                            <td>{new Date(c.timestamp).toLocaleDateString()}</td>
                            <td>
                                <span className={c.isValid ? styles.badgeSuccess : styles.badgeRevoked}>
                                    {c.isValid ? 'Valid' : 'Revoked'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UniversityPortal;
