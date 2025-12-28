import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Activity, Globe, Plus, FileText, Wallet, CheckCircle } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import { WavyBackground } from '../components/ui/WavyBackground';
import { TypewriterEffect } from '../components/ui/TypewriterEffect';
import { useBlockchain } from '../contexts/BlockchainContext';
import styles from '../styles/GovernmentDashboard.module.css';

// Chart components (reused but wrapped in BentoItems)
import { 
    BarChart, Bar, Tooltip, ResponsiveContainer 
} from 'recharts';

const dummyData = [
    { name: 'Jan', count: 400 },
    { name: 'Feb', count: 300 },
    { name: 'Mar', count: 600 },
    { name: 'Apr', count: 800 },
];

const GovernmentDashboard = () => {
    const { role, connectWallet, authorizeIssuer, getAllIssuers, isDemoMode, isWalletInstalled } = useBlockchain();
    const [connectingReal, setConnectingReal] = useState(false);
    const issuers = getAllIssuers();

    const titleWords = [
        { text: "Global", className: "text-blue-500" },
        { text: "Accreditation", className: "text-blue-500" },
        { text: "Authority", className: "text-white" },
    ];

    const handleRealWalletConnect = async () => {
        setConnectingReal(true);
        try {
            await connectWallet();
        } catch (err) {
            console.error('Wallet connection failed:', err);
        } finally {
            setConnectingReal(false);
        }
    };

    if (role !== 'government') {
        return (
            <WavyBackground className="max-w-4xl mx-auto pb-40">
                <div className="flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={64} className="text-white mb-4" color="#fff" />
                    <p className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
                        Government Portal
                    </p>
                    <p className="text-base md:text-lg mt-4 text-white font-normal inter-var text-center">
                        Authorize universities and manage the credential ecosystem.
                    </p>
                    
                    {isWalletInstalled() && (
                        <button 
                            onClick={handleRealWalletConnect}
                            disabled={connectingReal}
                            style={{
                                marginTop: '24px',
                                padding: '12px 24px',
                                background: '#8b5cf6',
                                color: '#fff',
                                borderRadius: '9999px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Wallet size={18} />
                            {connectingReal ? 'Connecting...' : 'Connect MetaMask'}
                        </button>
                    )}
                    
                    <div style={{ margin: '16px 0', color: '#888' }}>or</div>
                    
                    <button 
                        onClick={() => connectWallet('government')}
                        style={{
                            padding: '12px 24px',
                            background: '#374151',
                            color: '#fff',
                            borderRadius: '9999px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Try Demo Mode
                    </button>
                    <p style={{ marginTop: '16px', color: '#888', fontSize: '0.9rem' }}>
                        Demo mode allows testing. Real authorization requires the admin wallet.
                    </p>
                </div>
            </WavyBackground>
        );
    }

    const handleAddClick = async () => {
        const name = prompt("Enter University Name:");
        if (!name) return;
        const address = prompt("Enter Wallet Address (0x...):");
        if (!address) return;
        try {
            await authorizeIssuer(address, name);
        } catch (err) {
            alert(err.message);
        }
    };

    const showDemoWarning = isDemoMode();

    return (
        <Motion.div 
            className={styles.dashboard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.heroSection}>
                <TypewriterEffect words={titleWords} className={styles.heroTitle} />
                <Motion.p 
                    className={styles.heroSubtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    Oversight and Regulation of Decentralized Academic Identity
                </Motion.p>
                {showDemoWarning && (
                    <Motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                        style={{ 
                            background: 'rgba(245, 158, 11, 0.1)', 
                            border: '1px solid #f59e0b', 
                            borderRadius: 8, 
                            padding: '10px 20px', 
                            marginTop: 20,
                            fontSize: '0.9rem',
                            color: '#f59e0b',
                            maxWidth: 600,
                            margin: '20px auto 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <ShieldCheck size={18} />
                        Demo mode: Authorizations are stored locally. Connect the admin wallet for on-chain operations.
                    </Motion.div>
                )}
            </div>

            <BentoGrid className={styles.gridContainer}>
                {/* Stats 1 */}
                <BentoGridItem 
                    title="Active Issuers"
                    description="Universities currently accredited."
                    header={
                        <div className={`${styles.statBig} glass-panel border-none`}>
                            {Object.keys(issuers).length}
                        </div>
                    }
                    icon={<BuildingIcon />}
                    className="md:col-span-1"
                />

                {/* Main Action: Add University */}
                <BentoGridItem 
                    title="Accredit Institution"
                    description="Authorize a new university to issue credentials."
                    header={<div className={styles.actionHeader}><Plus size={40} /></div>}
                    icon={<ShieldCheck size={20} />}
                    className="md:col-span-1 cursor-pointer"
                    onClick={handleAddClick}
                />

                {/* Global Status */}
                <BentoGridItem 
                    title="Global Network"
                    description="System operational status."
                    header={
                        <div className={styles.statusLive}>
                            <span className="animate-pulse mr-2">●</span>
                            LIVE: BLOCK #892102
                        </div>
                    }
                    icon={<Globe size={20} />}
                    className="md:col-span-1"
                />

                {/* Issuance Chart */}
                <BentoGridItem 
                    title="Issuance Velocity"
                    description="Credential minting rate over time."
                    className="md:col-span-2"
                    header={
                        <div style={{width: '100%', height: '150px'}} className="glass-panel p-2 rounded-xl">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dummyData}>
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Tooltip 
                                        contentStyle={{
                                            background: '#0f172a', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }} 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    }
                    icon={<Activity size={20} />}
                />

                {/* Audit Log (Simulated) */}
                <BentoGridItem 
                    title="Recent Audit Events"
                    description="Immutable ledger actions."
                    className="md:col-span-1"
                    header={
                        <div className={styles.auditList}>
                            <div className={styles.auditItem}><ShieldCheck size={12} /> Waitlisted Univ X...</div>
                            <div className={styles.auditItem}><ShieldCheck size={12} /> Revoked Key #99...</div>
                            <div className={styles.auditItem}><CheckCircle size={12} /> Consensus Reached...</div>
                        </div>
                    }
                    icon={<FileText size={20} />}
                />
            </BentoGrid>
        </Motion.div>
    );
};

// Simple Icon wrapper
const BuildingIcon = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 p-2 items-center justify-center">
        <UserCheck size={40} color="#555" />
    </div>
);

export default GovernmentDashboard;
