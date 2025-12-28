import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
    Activity, Shield, ShieldAlert, Cpu, Database, 
    Lock, Unlock, Terminal, ExternalLink, RefreshCw,
    Users, BarChart3, TrendingUp
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useBlockchain } from '../contexts/BlockchainContext';
import SpotlightCard from '../components/ui/SpotlightCard';
import styles from '../styles/AdminDashboard.module.css';

// Mock Data for System Charts
const trafficData = [
    { time: '00:00', calls: 45 }, { time: '04:00', calls: 30 },
    { time: '08:00', calls: 85 }, { time: '12:00', calls: 120 },
    { time: '16:00', calls: 95 }, { time: '20:00', calls: 65 }
];

const loginData = [
    { day: 'Mon', count: 400 }, { day: 'Tue', count: 320 },
    { day: 'Wed', count: 500 }, { day: 'Thu', count: 450 },
    { day: 'Fri', count: 680 }, { day: 'Sat', count: 200 },
    { day: 'Sun', count: 150 }
];

const AdminDashboard = () => {
    const { 
        account, role, connectWallet, isPaused, togglePause, systemMetrics 
    } = useBlockchain();
    
    const [logs] = useState([
        { id: 1, time: '14:22:01', event: 'Contract call: issueCredential', hash: '0xabc...123' },
        { id: 2, time: '14:25:34', event: 'New Admin Role Granted: 0x999...GOV', hash: '0xdef...456' },
        { id: 3, time: '14:30:12', event: 'IPFS Metadata Upload Success', hash: 'bafy...789' }
    ]);

    if (role !== 'admin' || !account) {
        return (
            <div className="container" style={{paddingTop: 120, textAlign: 'center'}}>
                <Shield size={48} color="#6366f1" style={{marginBottom: 20}} />
                <h2>SuperAdmin Access Required</h2>
                <p>Please authenticate with the system owner wallet.</p>
                <button 
                    onClick={() => connectWallet('admin')}
                    className={styles.actionBtn}
                    style={{margin: '20px auto', display: 'flex', alignItems: 'center', gap: 8}}
                >
                    <Unlock size={18} /> Authenticate as Admin
                </button>
            </div>
        );
    }

    return (
        <Motion.div 
            className={`container ${styles.adminDashboard}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <header className={`${styles.header} glass-panel`}>
                <div className={styles.adminProfile}>
                    <div className={styles.avatar}>
                        <ShieldAlert size={28} />
                    </div>
                    <div className={styles.adminInfo}>
                        <span className={styles.systemLabel}>System Monitor</span>
                        <span className={styles.adminName}>SuperAdmin <span className={styles.did}>({account.slice(0, 8)}...{account.slice(-4)})</span></span>
                    </div>
                </div>
                <div className={styles.logout}>Logout System | Terminal Exit</div>
            </header>

            {/* Metrics Bar */}
            <div className={styles.metricsGrid}>
                <SpotlightCard className={styles.metricCard}>
                    <span className={styles.metricLabel}><Users size={14} /> Active Users (24h)</span>
                    <span className={styles.metricValue}>{systemMetrics.activeUsers}</span>
                </SpotlightCard>
                <SpotlightCard className={styles.metricCard}>
                    <span className={styles.metricLabel}><Activity size={14} /> Avg Txns/Hr</span>
                    <span className={styles.metricValue}>{systemMetrics.txPerHour}</span>
                </SpotlightCard>
                <SpotlightCard className={styles.metricCard}>
                    <span className={styles.metricLabel}><Database size={14} /> IPFS Success Rate</span>
                    <span className={styles.metricValue}>{systemMetrics.ipfsSuccess}%</span>
                </SpotlightCard>
                <SpotlightCard className={styles.metricCard}>
                    <span className={styles.metricLabel}><Cpu size={14} /> Network Gas (Avg)</span>
                    <span className={styles.metricValue}>{systemMetrics.avgGas} MATIC</span>
                </SpotlightCard>
            </div>

            <main className={styles.mainLayout}>
                {/* Visualizations Area */}
                <Motion.div 
                    className={styles.visuals}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={`${styles.section} glass-panel`}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}><TrendingUp size={18} /> Usage Analytics</h2>
                        </div>
                        
                        <div className={styles.chartCard}>
                            <span className={styles.chartLabel}>[Line Chart: Daily Logins]</span>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={loginData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}} />
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{fill: '#6366f1'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.chartCard}>
                            <span className={styles.chartLabel}>[Bar Chart: Contract Calls / Time]</span>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={trafficData}>
                                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}} />
                                    <Bar dataKey="calls" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Motion.div>

                {/* Controls & Logs Area */}
                <Motion.div 
                    className={styles.sidebar}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={`${styles.section} glass-panel`}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}><Lock size={18} /> Admin Actions</h2>
                        </div>
                        <div className={styles.controlsList}>
                            <div className={styles.controlItem}>
                                <div className={styles.controlInfo}>
                                    <span className={styles.controlName}>Contract State</span>
                                    <span className={styles.controlDesc}>{isPaused ? 'Maintenance Mode Active' : 'System Operational'}</span>
                                </div>
                                <button 
                                    className={`${styles.btn} ${styles.pauseBtn} ${isPaused ? styles.active : ''}`}
                                    onClick={togglePause}
                                >
                                    {isPaused ? <Unlock size={14} /> : <Lock size={14} />} {isPaused ? 'Unpause' : 'Pause'}
                                </button>
                            </div>
                            <div className={styles.controlItem}>
                                <div className={styles.controlInfo}>
                                    <span className={styles.controlName}>Database Backup</span>
                                    <span className={styles.controlDesc}>Push system snapshot</span>
                                </div>
                                <button className={`${styles.btn} ${styles.actionBtn}`}>Backup</button>
                            </div>
                            <div className={styles.controlItem}>
                                <div className={styles.controlInfo}>
                                    <span className={styles.controlName}>Contract ABI</span>
                                    <span className={styles.controlDesc}>View latest interface</span>
                                </div>
                                <button className={`${styles.btn} ${styles.actionBtn}`}><Terminal size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.section} glass-panel`} style={{marginTop: 30}}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}><Terminal size={18} /> System Logs</h2>
                            <RefreshCw size={14} className={styles.refreshIcon} />
                        </div>
                        <div className={styles.auditLog}>
                            {logs.map(log => (
                                <div key={log.id} className={styles.logEntry}>
                                    <span className={styles.timestamp}>[{log.time}]</span>
                                    <span>{log.event}</span>
                                    <div style={{marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
                                        <span className={styles.txHash}>{log.hash}</span>
                                        <ExternalLink size={10} color="#666" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Motion.div>
            </main>
        </Motion.div>
    );
};

export default AdminDashboard;
