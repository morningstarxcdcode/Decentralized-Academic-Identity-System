import React from 'react';
import { BarChart, Activity, Globe, ShieldCheck, Zap, Server } from 'lucide-react';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import { BackgroundBeams } from '../components/ui/BackgroundBeams';
import SpotlightCard from '../components/ui/SpotlightCard';
import { motion as Motion } from 'framer-motion';
import styles from '../styles/Analytics.module.css';

const Analytics = () => {
    return (
        <div className={`container ${styles.page}`}>
            <BackgroundBeams className={styles.bgBeams} />
            
            <div className={styles.header}>
                <Motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.title}
                >
                    System Analytics
                </Motion.h1>
                <p className={styles.subtitle}>Real-time decentralized network monitoring.</p>
            </div>

            <BentoGrid className={styles.grid}>
                <BentoGridItem 
                    title="Global Issuance"
                    description="Total credentials issued across all active nodes."
                    header={<div className={styles.skeleton} style={{background: 'linear-gradient(to right, #4f46e5, #ec4899)'}} />}
                    icon={<Globe size={20} />}
                    className={styles.largeItem}
                />
                <BentoGridItem 
                    title="Network Load"
                    description="Current gas usage and transaction throughput."
                    header={<div className={styles.skeleton} style={{background: 'linear-gradient(to right, #00c6ff, #0072ff)'}} />}
                    icon={<Zap size={20} />}
                />
                <BentoGridItem 
                    title="Security Status"
                    description="Smart contract audits and verifier health."
                    header={<div className={styles.skeleton} style={{background: 'linear-gradient(to right, #11998e, #38ef7d)'}} />}
                    icon={<ShieldCheck size={20} />}
                />
                <BentoGridItem 
                    title="Node Distribution"
                    description="Active IPFS nodes and pinning services."
                    header={<div className={styles.skeleton} style={{background: 'linear-gradient(to right, #f857a6, #ff5858)'}} />}
                    icon={<Server size={20} />}
                />
                <BentoGridItem 
                    title="Verification Requests"
                    description="Daily volume of credential checks."
                    header={<div className={styles.skeleton} style={{background: 'linear-gradient(to right, #f2994a, #f2c94c)'}} />}
                    icon={<Activity size={20} />}
                    className={styles.wideItem}
                />
            </BentoGrid>
            
            {/* Real-time Ticker */}
            <SpotlightCard className={styles.ticker}>
                <div className={styles.tickerContent}>
                    <span>Last Block: #4589211</span>
                    <span className={styles.separator}>•</span>
                    <span>Gas: 32 Gwei</span>
                    <span className={styles.separator}>•</span>
                    <span>Next Epoch: 12m 30s</span>
                </div>
            </SpotlightCard>
        </div>
    );
};

export default Analytics;
