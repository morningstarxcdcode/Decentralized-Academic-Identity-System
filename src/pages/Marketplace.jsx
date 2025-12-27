import React from 'react';
import { Search, Filter, Briefcase, Code, Database, Globe } from 'lucide-react';
import { InfiniteMovingCards } from '../components/ui/InfiniteMovingCards';
import SpotlightCard from '../components/ui/SpotlightCard';
import { motion as Motion } from 'framer-motion';
import styles from '../styles/Marketplace.module.css';

const skills = [
    { quote: "Looking for a Solidity Developer to audit our smart contracts.", name: "DeFi Protocol A", title: "Remote" },
    { quote: "Need a React frontend wizard for a new DAO dashboard.", name: "DAO X", title: "Contract" },
    { quote: "Hiring a Zero-Knowledge Proof researcher for privacy layer.", name: "PrivacyChain", title: "Full-time" },
    { quote: "Seeking technical writer for whitepaper documentation.", name: "Layer2 Scale", title: "Freelance" },
    { quote: "Backend engineer needed for IPFS integration.", name: "StorageNet", title: "Remote" }
];

const Marketplace = () => {
    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <Motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.title}
                >
                    Skills Exchange
                </Motion.h1>
                <p className={styles.subtitle}>Connect your verified academic credentials with real-world opportunities.</p>
            </div>

            {/* Featured Opportunities */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Live Opportunities</h2>
                <InfiniteMovingCards items={skills} direction="right" speed="slow" />
            </div>

            {/* Search & Filter */}
            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input type="text" placeholder="Search for jobs, grants, or research..." />
                </div>
                <button className={styles.filterBtn}>
                    <Filter size={18} /> Filters
                </button>
            </div>

            {/* Job Cards */}
            <div className={styles.grid}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <SpotlightCard key={item} className={styles.jobCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconBox}><Code size={24} /></div>
                            <span className={styles.tag}>Verified Only</span>
                        </div>
                        <h3>Smart Contract Auditor</h3>
                        <p className={styles.company}>SecureBlock Inc.</p>
                        <div className={styles.reqs}>
                            <span>BS Computer Science</span>
                            <span>Certified Eth Developer</span>
                        </div>
                        <button className={styles.applyBtn}>Apply with Credential</button>
                    </SpotlightCard>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;
