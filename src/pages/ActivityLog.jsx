import React from 'react';
import { TracingBeam } from '../components/ui/TracingBeam';
import { CheckCircle, Upload, LogIn, FileText, Share2 } from 'lucide-react';
import styles from '../styles/ActivityLog.module.css';

const dummyLog = [
    {
        title: "Credential Verified",
        description: "Your Bachelor of Science degree was successfully verified by Google Inc.",
        icon: <CheckCircle size={20} className={styles.iconSuccess} />,
        time: "2 hours ago"
    },
    {
        title: "Profile Updated",
        description: "You updated your public bio and avatar.",
        icon: <Upload size={20} className={styles.iconInfo} />,
        time: "1 day ago"
    },
    {
        title: "Did Login",
        description: "Authenticated via MetaMask from IP 192.168.1.1",
        icon: <LogIn size={20} className={styles.iconInfo} />,
        time: "2 days ago"
    },
    {
        title: "Shared Credential",
        description: "Generated a public link for 'Master of Computer Science'.",
        icon: <Share2 size={20} className={styles.iconWarning} />,
        time: "3 days ago"
    },
    {
        title: "Credential Issued",
        description: "Stanford University issued 'Advanced Cryptography' certificate.",
        icon: <FileText size={20} className={styles.iconSuccess} />,
        time: "1 week ago"
    },
];

const ActivityLog = () => {
    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Activity Timeline</h1>
                <p className={styles.subtitle}>Immutable record of your identity interactions.</p>
            </div>

            <TracingBeam className={styles.beamContainer}>
                <div className={styles.timeline}>
                    {dummyLog.map((item, index) => (
                        <div key={index} className={styles.timelineItem}>
                            <div className={styles.itemHeader}>
                                <div className={styles.iconWrapper}>{item.icon}</div>
                                <span className={styles.time}>{item.time}</span>
                            </div>
                            <div className={styles.content}>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add more filler items to demonstrate scroll */}
                    {[...Array(5)].map((_, i) => (
                         <div key={`filler-${i}`} className={styles.timelineItem}>
                            <div className={styles.itemHeader}>
                                <div className={styles.iconWrapper}><div className={styles.dot} /></div>
                                <span className={styles.time}>Archive Record #{8921 + i}</span>
                            </div>
                            <div className={styles.content}>
                                <h3>Block #{(4520000 - i * 1000)} Consensed</h3>
                                <p>Historical activity data archived on IPFS.</p>
                            </div>
                        </div>
                    ))}
                </div>
            </TracingBeam>
        </div>
    );
};

export default ActivityLog;
