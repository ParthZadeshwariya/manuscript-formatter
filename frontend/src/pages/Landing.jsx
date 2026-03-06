import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, Sparkles, FileText, CheckCircle2, BookOpen,
    Zap, Shield, Clock, Upload, Download, ScanSearch, PenTool,
    BarChart3, FileCheck
} from 'lucide-react';
import './Landing.css';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }),
};

const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
};

export default function Landing() {
    const features = [
        { icon: <ScanSearch size={24} />, title: 'Smart Parsing', desc: 'Intelligent document parsing identifies sections, headings, citations, and structure automatically.' },
        { icon: <BookOpen size={24} />, title: 'Style Guide Engine', desc: 'APA 7th, MLA 9th, and Chicago rulesets loaded and applied with precision and consistency.' },
        { icon: <PenTool size={24} />, title: 'Agentic Formatting', desc: 'Multiple AI agents collaborate to reformat your manuscript — each an expert in its domain.' },
        { icon: <FileCheck size={24} />, title: 'Citation Fixing', desc: 'Citations are parsed, validated, and reformatted to match your chosen style guide exactly.' },
        { icon: <BarChart3 size={24} />, title: 'Compliance Scoring', desc: 'Get a detailed compliance score and report showing exactly what was fixed and what needs attention.' },
        { icon: <Shield size={24} />, title: 'Secure Processing', desc: 'Files are processed in memory and deleted immediately after — your research stays private.' },
    ];

    const steps = [
        { num: '01', icon: <Upload size={28} />, title: 'Upload', desc: 'Drag & drop your manuscript in .txt, .pdf, or .docx format.' },
        { num: '02', icon: <Sparkles size={28} />, title: 'Process', desc: 'AI agents parse, format, and fix citations according to your chosen style.' },
        { num: '03', icon: <Download size={28} />, title: 'Download', desc: 'Get your publication-ready document with a full compliance report.' },
    ];

    const stats = [
        { value: '3', label: 'Style Guides', sub: 'APA7 · MLA9 · Chicago' },
        { value: '5+', label: 'AI Agents', sub: 'Working in concert' },
        { value: '<60s', label: 'Processing', sub: 'Average turnaround' },
        { value: '100%', label: 'Privacy', sub: 'Files auto-deleted' },
    ];

    return (
        <div className="landing">
            {/* ── Hero ── */}
            <section className="hero">
                <div className="hero__bg">
                    <div className="hero__orb hero__orb--1" />
                    <div className="hero__orb hero__orb--2" />
                    <div className="hero__orb hero__orb--3" />
                    <div className="hero__grid-pattern" />
                </div>

                <div className="container hero__content">
                    <motion.div
                        className="hero__text"
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        <motion.div variants={fadeUp} custom={0}>
                            <span className="badge">
                                <Sparkles size={14} /> AI-Powered Manuscript Formatting
                            </span>
                        </motion.div>

                        <motion.h1 className="hero__title" variants={fadeUp} custom={1}>
                            Fix Your Format.
                            <br />
                            <span className="hero__title-gradient">Publication-Ready</span> in Seconds.
                        </motion.h1>

                        <motion.p className="hero__subtitle" variants={fadeUp} custom={2}>
                            Agent Paperpal uses a team of AI agents to parse, format, and verify your
                            academic manuscripts against APA, MLA, and Chicago style guides — automatically.
                        </motion.p>

                        <motion.div className="hero__actions" variants={fadeUp} custom={3}>
                            <Link to="/format" className="btn btn-primary btn-lg">
                                Start Formatting <ArrowRight size={18} />
                            </Link>
                            <Link to="/about" className="btn btn-secondary btn-lg">
                                How It Works
                            </Link>
                        </motion.div>

                        <motion.div className="hero__trust" variants={fadeUp} custom={4}>
                            <div className="hero__trust-item">
                                <CheckCircle2 size={16} />
                                <span>Free to use</span>
                            </div>
                            <div className="hero__trust-item">
                                <CheckCircle2 size={16} />
                                <span>No sign-up required</span>
                            </div>
                            <div className="hero__trust-item">
                                <CheckCircle2 size={16} />
                                <span>Secure & private</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero__visual"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="hero__card-stack">
                            <div className="hero__mock-card hero__mock-card--back">
                                <div className="hero__mock-line hero__mock-line--short" />
                                <div className="hero__mock-line" />
                                <div className="hero__mock-line" />
                                <div className="hero__mock-line hero__mock-line--med" />
                            </div>
                            <div className="hero__mock-card hero__mock-card--front">
                                <div className="hero__mock-header">
                                    <FileText size={18} className="hero__mock-icon" />
                                    <span>manuscript_v2.docx</span>
                                    <span className="tag tag-success">Formatted</span>
                                </div>
                                <div className="hero__mock-line hero__mock-line--short" />
                                <div className="hero__mock-line" />
                                <div className="hero__mock-line" />
                                <div className="hero__mock-line hero__mock-line--med" />
                                <div className="hero__mock-line hero__mock-line--short" />
                                <div className="hero__mock-score">
                                    <div className="hero__mock-score-bar">
                                        <div className="hero__mock-score-fill" />
                                    </div>
                                    <span className="hero__mock-score-label">94% Compliant</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats Strip ── */}
            <section className="stats-strip">
                <div className="container">
                    <motion.div
                        className="stats-strip__grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={stagger}
                    >
                        {stats.map((stat, i) => (
                            <motion.div key={i} className="stats-strip__item" variants={fadeUp} custom={i}>
                                <span className="stats-strip__value">{stat.value}</span>
                                <span className="stats-strip__label">{stat.label}</span>
                                <span className="stats-strip__sub">{stat.sub}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="section features-section" id="features">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        <motion.span className="badge" variants={fadeUp}>
                            <Zap size={14} /> Core Capabilities
                        </motion.span>
                        <motion.h2 className="section-header__title" variants={fadeUp} custom={1}>
                            Everything Your Manuscript Needs
                        </motion.h2>
                        <motion.p className="section-header__desc" variants={fadeUp} custom={2}>
                            Six specialized features working together to transform your raw manuscript
                            into a professionally formatted, style-compliant document.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className="features__grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        {features.map((feat, i) => (
                            <motion.div key={i} className="feature-card card" variants={fadeUp} custom={i}>
                                <div className="feature-card__icon">{feat.icon}</div>
                                <h3 className="feature-card__title">{feat.title}</h3>
                                <p className="feature-card__desc">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="section-alt how-section" id="how-it-works">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        <motion.span className="badge" variants={fadeUp}>
                            <Clock size={14} /> Simple Process
                        </motion.span>
                        <motion.h2 className="section-header__title" variants={fadeUp} custom={1}>
                            Three Steps to Perfect Formatting
                        </motion.h2>
                        <motion.p className="section-header__desc" variants={fadeUp} custom={2}>
                            No learning curve. No complex settings. Just upload, choose a style, and download.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className="steps__grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        {steps.map((step, i) => (
                            <motion.div key={i} className="step-card" variants={fadeUp} custom={i}>
                                <span className="step-card__num">{step.num}</span>
                                <div className="step-card__icon">{step.icon}</div>
                                <h3 className="step-card__title">{step.title}</h3>
                                <p className="step-card__desc">{step.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-section">
                <div className="container">
                    <motion.div
                        className="cta-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="cta-card__glow" />
                        <h2 className="cta-card__title">Ready to Format Your Manuscript?</h2>
                        <p className="cta-card__desc">
                            Upload your document and let our AI agents handle the rest. Free, fast, and private.
                        </p>
                        <Link to="/format" className="btn btn-primary btn-lg">
                            Start Formatting Now <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
