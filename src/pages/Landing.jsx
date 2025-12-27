import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Shield, Lock, ArrowRight, GraduationCap, Building, Search, UserCheck } from 'lucide-react';
import TextGenerateEffect from '../components/ui/TextGenerateEffect';
import { CardContainer, CardBody, CardItem } from '../components/ui/ThreeDCard';
import { InfiniteMovingCards } from '../components/ui/InfiniteMovingCards';
import { BackgroundBeams } from '../components/ui/BackgroundBeams';
import KineticCube from '../components/ui/KineticCube';
import AuthModal from '../components/AuthModal';
import styles from '../styles/Landing.module.css';

const Landing = () => {
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleGetStarted = () => {
        navigate('/student');
    };

    const handleSignUp = () => {
        setIsAuthModalOpen(true);
    };

    return (
        <div className={styles.landing}>
             {/* Background Effects */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <BackgroundBeams />
            </div>

            {/* Hero Section with Kinetic Cube */}
            <section className={`${styles.hero} relative z-10`}>
                <div className={styles.heroContainer}>
                    {/* Kinetic Cube Animation */}
                    <div className={styles.cubeSection}>
                        <KineticCube 
                            autoOpen={true} 
                            delay={1200}
                            interactive={true}
                            size={180}
                        >
                            {/* Content revealed when cube opens */}
                            <div className={styles.cubeRevealContent}>
                                <div className={styles.glowOrb}></div>
                            </div>
                        </KineticCube>
                    </div>

                    {/* Hero Content */}
                    <div className={styles.heroContent}>
                        <Motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <h1 className={styles.title}>
                                Own Your <br />
                                <span className={styles.highlight}>Academic Identity.</span>
                            </h1>
                            <TextGenerateEffect 
                                words="Empower students, universities, and employers with secure, blockchain-powered credentials. No paper, no hassle."
                                className={styles.subtitle}
                            />
                            
                            <div className={styles.ctaGroup}>
                                <button type="button" className={styles.primaryBtn} onClick={handleGetStarted}>
                                    Get Started <ArrowRight size={18} />
                                </button>
                                <button type="button" className={styles.secondaryBtn} onClick={handleSignUp}>
                                    Sign Up Now
                                </button>
                            </div>
                        </Motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section with 3D Cards */}
            <section className={`container ${styles.features} relative z-10 flex flex-col gap-0`}>
                <h2 className={styles.sectionHeading}>The Ecosystem</h2>
                
                <Feature3D 
                    title="Student"
                    desc="Hold degrees in a self-sovereign wallet."
                    icon={<GraduationCap size={40} color="#3b82f6" />}
                    imgUrl="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop"
                    containerClassName="w-full justify-start items-center py-8"
                />

                <Feature3D 
                    title="University"
                    desc="Issue tamper-proof credentials instantly."
                    icon={<Building size={40} color="#a855f7" />}
                    imgUrl="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2886&auto=format&fit=crop"
                    containerClassName="w-full justify-end items-center py-8"
                />

                <Feature3D 
                    title="Employer"
                    desc="Verify candidates in real-time."
                    icon={<Search size={40} color="#10b981" />}
                    imgUrl="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2932&auto=format&fit=crop"
                    containerClassName="w-full justify-start items-center py-8"
                />

                <Feature3D 
                    title="Regulator"
                    desc="Oversee global accreditation standards."
                    icon={<UserCheck size={40} color="#f59e0b" />}
                    imgUrl="https://images.unsplash.com/photo-1577415124269-fc1140a69e91?q=80&w=2864&auto=format&fit=crop"
                    containerClassName="w-full justify-end items-center py-8"
                />
            </section>

            {/* Testimonials Section */}
            <section className={`relative z-10 py-20`}>
                <h2 className={`${styles.sectionHeading} text-center mb-10`}>Trusted by Leaders</h2>
                <InfiniteMovingCards 
                    items={testimonials}
                    direction="right"
                    speed="slow"
                />
            </section>

            {/* Footer */}
            <footer className={`${styles.footer} relative z-10`}>
                <div className={`container ${styles.footerContent}`}>
                    <div className={styles.footerLeft}>
                        <span>© 2025 Privacy • Terms • Help</span>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

const Feature3D = ({ title, desc, icon, imgUrl, containerClassName }) => {
    return (
        <CardContainer className="inter-var" containerClassName={containerClassName}>
            <CardBody className="bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[18rem] h-auto rounded-xl p-4 border">
                <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-neutral-600 dark:text-white"
                >
                    <div className="flex items-center gap-3">
                        {icon} {title}
                    </div>
                </CardItem>
                <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                >
                    {desc}
                </CardItem>
                <CardItem translateZ="100" className="w-full mt-4">
                    <img
                        src={imgUrl}
                        height="300"
                        width="300"
                        className="h-32 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                        alt="thumbnail"
                    />
                </CardItem>
            </CardBody>
        </CardContainer>
    );
};

const testimonials = [
    { name: "CERN", title: "Research Inst.", quote: "Verifying degrees for our researchers is now instant and trustless." },
    { name: "MIT", title: "University", quote: "Issuing digital diplomas has cut our admin costs by 90%." },
    { name: "Google", title: "Tech Giant", quote: "We only hire candidates with verified on-chain credentials now." },
    { name: "Ethereum Fdn", title: "Non-Profit", quote: "The standard for academic identity on the blockchain." },
];

export default Landing;
