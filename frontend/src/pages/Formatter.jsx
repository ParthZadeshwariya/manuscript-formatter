import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Download, ChevronDown, FileText, AlertTriangle,
    CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, Loader2
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { formatManuscript, getDownloadUrl } from '../api/client';
import './Formatter.css';

const STYLE_GUIDES = [
    { id: 'APA7', name: 'APA 7th Edition', desc: 'American Psychological Association' },
    { id: 'MLA9', name: 'MLA 9th Edition', desc: 'Modern Language Association' },
    { id: 'Chicago', name: 'Chicago Manual', desc: 'Chicago Manual of Style' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function FormatterPage() {
    const [file, setFile] = useState(null);
    const [styleGuide, setStyleGuide] = useState('APA7');
    const [status, setStatus] = useState('idle'); // idle | processing | success | error
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [elapsed, setElapsed] = useState(0);

    const handleFormat = useCallback(async () => {
        if (!file) return;
        setStatus('processing');
        setError('');
        setResult(null);
        const start = Date.now();
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

        try {
            const data = await formatManuscript(file, styleGuide);
            clearInterval(timer);
            setElapsed(Math.floor((Date.now() - start) / 1000));

            if (data.success) {
                setResult(data);
                setStatus('success');
            } else {
                setError(data.errors?.join(', ') || 'Formatting failed.');
                setStatus('error');
            }
        } catch (err) {
            clearInterval(timer);
            setElapsed(Math.floor((Date.now() - start) / 1000));
            setError(err.message || 'An unexpected error occurred.');
            setStatus('error');
        }
    }, [file, styleGuide]);

    const handleReset = () => {
        setFile(null);
        setStyleGuide('APA7');
        setStatus('idle');
        setResult(null);
        setError('');
        setElapsed(0);
    };

    const scoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--error)';
    };

    const circumference = 2 * Math.PI * 50;

    return (
        <div className="formatter-page">
            <div className="formatter-page__bg">
                <div className="formatter-page__orb formatter-page__orb--1" />
                <div className="formatter-page__orb formatter-page__orb--2" />
            </div>

            <div className="container formatter-page__content">
                {/* Header */}
                <motion.div
                    className="formatter-page__header"
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <span className="badge">
                        <Sparkles size={14} /> Manuscript Formatter
                    </span>
                    <h1 className="formatter-page__title">
                        Format Your Manuscript
                    </h1>
                    <p className="formatter-page__subtitle">
                        Upload your document, pick a style guide, and let our AI agents do the rest.
                    </p>
                </motion.div>

                {/* Main Panel */}
                <motion.div
                    className="formatter-panel"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__form"
                            >
                                {/* File Upload */}
                                <div className="formatter-panel__section">
                                    <label className="formatter-panel__label">
                                        <FileText size={16} /> Upload Manuscript
                                    </label>
                                    <FileUpload onFileSelect={setFile} disabled={false} />
                                </div>

                                {/* Style Guide Selector */}
                                <div className="formatter-panel__section">
                                    <label className="formatter-panel__label">
                                        <ChevronDown size={16} /> Style Guide
                                    </label>
                                    <div className="style-selector">
                                        {STYLE_GUIDES.map((sg) => (
                                            <button
                                                key={sg.id}
                                                className={`style-selector__option ${styleGuide === sg.id ? 'style-selector__option--active' : ''}`}
                                                onClick={() => setStyleGuide(sg.id)}
                                            >
                                                <span className="style-selector__radio">
                                                    {styleGuide === sg.id && <span className="style-selector__radio-dot" />}
                                                </span>
                                                <div>
                                                    <span className="style-selector__name">{sg.name}</span>
                                                    <span className="style-selector__desc">{sg.desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    className="btn btn-primary btn-lg formatter-panel__submit"
                                    disabled={!file}
                                    onClick={handleFormat}
                                >
                                    <Sparkles size={18} /> Format Manuscript
                                </button>
                            </motion.div>
                        )}

                        {status === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__processing"
                            >
                                <div className="processing-anim">
                                    <div className="processing-anim__ring">
                                        <Loader2 size={48} className="processing-anim__spinner" />
                                    </div>
                                </div>
                                <h3 className="processing__title">Formatting in Progress</h3>
                                <p className="processing__desc">
                                    Our AI agents are parsing, formatting, and verifying your manuscript...
                                </p>
                                <div className="processing__steps">
                                    <ProcessingStep label="Parsing document" delay={0} />
                                    <ProcessingStep label="Loading style rules" delay={3} elapsed={elapsed} />
                                    <ProcessingStep label="Formatting sections" delay={6} elapsed={elapsed} />
                                    <ProcessingStep label="Fixing citations" delay={10} elapsed={elapsed} />
                                    <ProcessingStep label="Scoring compliance" delay={15} elapsed={elapsed} />
                                    <ProcessingStep label="Generating output" delay={20} elapsed={elapsed} />
                                </div>
                                <div className="processing__timer">
                                    <Clock size={14} /> {elapsed}s elapsed
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && result && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__result"
                            >
                                {/* Score Ring */}
                                <div className="result__score-area">
                                    <div className="score-ring">
                                        <svg width="120" height="120" viewBox="0 0 120 120">
                                            <circle className="score-ring__bg" cx="60" cy="60" r="50" />
                                            <circle
                                                className="score-ring__fill"
                                                cx="60" cy="60" r="50"
                                                style={{
                                                    stroke: scoreColor(result.compliance_score),
                                                    strokeDasharray: circumference,
                                                    strokeDashoffset: circumference - (result.compliance_score / 100) * circumference,
                                                }}
                                            />
                                        </svg>
                                        <div className="score-ring__label">
                                            <span className="score-ring__value">{Math.round(result.compliance_score)}</span>
                                            <span className="score-ring__text">Score</span>
                                        </div>
                                    </div>
                                    <div className="result__score-meta">
                                        <h3>Formatting Complete!</h3>
                                        <p>
                                            Processed in {result.processing_time_seconds}s with{' '}
                                            <strong>{result.style_guide}</strong> style guide.
                                        </p>
                                    </div>
                                </div>

                                {/* Compliance Report */}
                                {result.compliance_report?.length > 0 && (
                                    <div className="result__section">
                                        <h4 className="result__section-title">Compliance Report</h4>
                                        <div className="result__report-list">
                                            {result.compliance_report.map((item, i) => (
                                                <div key={i} className="result__report-item">
                                                    {item.toLowerCase().includes('error') || item.toLowerCase().includes('fail') ? (
                                                        <XCircle size={16} className="result__icon--error" />
                                                    ) : item.toLowerCase().includes('warn') ? (
                                                        <AlertTriangle size={16} className="result__icon--warn" />
                                                    ) : (
                                                        <CheckCircle2 size={16} className="result__icon--success" />
                                                    )}
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Changes */}
                                {result.changes?.length > 0 && (
                                    <div className="result__section">
                                        <h4 className="result__section-title">Changes Made</h4>
                                        <div className="result__changes-list">
                                            {result.changes.map((change, i) => (
                                                <div key={i} className="result__change-item">
                                                    <ArrowRight size={14} />
                                                    <span>{typeof change === 'string' ? change : JSON.stringify(change)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="result__actions">
                                    {result.download_url && (
                                        <a
                                            href={getDownloadUrl(result.output_filename)}
                                            className="btn btn-primary btn-lg"
                                            download
                                        >
                                            <Download size={18} /> Download Formatted File
                                        </a>
                                    )}
                                    <button className="btn btn-secondary" onClick={handleReset}>
                                        <RotateCcw size={16} /> Format Another
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__error"
                            >
                                <div className="error-display">
                                    <div className="error-display__icon">
                                        <XCircle size={40} />
                                    </div>
                                    <h3>Something Went Wrong</h3>
                                    <p>{error}</p>
                                    <button className="btn btn-primary" onClick={handleReset}>
                                        <RotateCcw size={16} /> Try Again
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

function ProcessingStep({ label, delay, elapsed = 0 }) {
    const isActive = elapsed >= delay;
    const isDone = elapsed >= delay + 3;
    return (
        <div className={`processing-step ${isActive ? 'processing-step--active' : ''} ${isDone ? 'processing-step--done' : ''}`}>
            <div className="processing-step__dot" />
            <span>{label}</span>
            {isDone && <CheckCircle2 size={14} className="processing-step__check" />}
        </div>
    );
}
