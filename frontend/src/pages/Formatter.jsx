import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Download, ChevronDown, FileText, AlertTriangle,
    CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, Loader2,
    FileCheck, BookOpen, Quote, ArrowRightLeft, Info, X
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { formatManuscript } from '../api/client';
import './Formatter.css';

const STYLE_GUIDES = [
    { id: 'APA7', name: 'APA 7th Edition', desc: 'American Psychological Association' },
    { id: 'MLA9', name: 'MLA 9th Edition', desc: 'Modern Language Association' },
    { id: 'CHICAGO', name: 'Chicago Manual', desc: 'Chicago Manual of Style' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Helpers ─────────────────────────────────────────────── */
function statusMeta(status) {
    switch ((status || '').toLowerCase()) {
        case 'pass': return { icon: <CheckCircle2 size={15} />, cls: 'tag--pass', label: 'Pass' };
        case 'fail': return { icon: <XCircle size={15} />, cls: 'tag--fail', label: 'Fail' };
        case 'partial': return { icon: <AlertTriangle size={15} />, cls: 'tag--partial', label: 'Partial' };
        default: return { icon: <Info size={15} />, cls: 'tag--info', label: status };
    }
}

function ScoreRing({ score }) {
    const r = 50;
    const c = 2 * Math.PI * r;
    const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';
    return (
        <div className="score-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle className="score-ring__bg" cx="60" cy="60" r={r} />
                <circle
                    className="score-ring__fill"
                    cx="60" cy="60" r={r}
                    style={{
                        stroke: color,
                        strokeDasharray: c,
                        strokeDashoffset: c - (score / 100) * c,
                    }}
                />
            </svg>
            <div className="score-ring__label">
                <span className="score-ring__value" style={{ color }}>{Math.round(score)}</span>
                <span className="score-ring__text">/ 100</span>
            </div>
        </div>
    );
}

/* ─── Compliance Report Card ─────────────────────────────── */
function ComplianceCard({ item }) {
    const [open, setOpen] = useState(false);
    const meta = statusMeta(item.status);
    return (
        <div className={`cr-card cr-card--${(item.status || 'info').toLowerCase()}`}>
            <button className="cr-card__header" onClick={() => setOpen(o => !o)}>
                <span className={`cr-tag ${meta.cls}`}>
                    {meta.icon} {meta.label}
                </span>
                <span className="cr-card__rule">{item.rule}</span>
                {item.score != null && (
                    <span className="cr-card__score">{item.score}%</span>
                )}
                <ChevronDown size={14} className={`cr-card__chevron ${open ? 'cr-card__chevron--open' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="cr-card__body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        {item.explanation && (
                            <p className="cr-card__explanation">{item.explanation}</p>
                        )}
                        {item.examples?.length > 0 && (
                            <ul className="cr-card__examples">
                                {item.examples.map((ex, i) => (
                                    <li key={i}><Quote size={11} />{ex}</li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Citation Format Error Card ────────────────────────── */
function CitationErrorCard({ err }) {
    return (
        <div className="cite-err">
            <div className="cite-err__diff">
                <span className="cite-err__original">{err.original}</span>
                <ArrowRightLeft size={13} className="cite-err__arrow" />
                <span className="cite-err__fix">{err.fix}</span>
            </div>
            {err.issue && <p className="cite-err__issue">{err.issue}</p>}
        </div>
    );
}

/* ─── Change Item ───────────────────────────────────────── */
function ChangeItem({ change }) {
    if (typeof change === 'string') {
        return (
            <div className="change-item">
                <ArrowRight size={13} className="change-item__icon" />
                <span>{change}</span>
            </div>
        );
    }
    return (
        <div className="change-item change-item--rich">
            <div className="change-item__field">{change.field}</div>
            <div className="change-item__diff">
                {change.original && <span className="change-item__old">{change.original}</span>}
                {change.corrected && <span className="change-item__new">{change.corrected}</span>}
            </div>
            {change.reason && <p className="change-item__reason">{change.reason}</p>}
        </div>
    );
}

/* ─── Download Toast ────────────────────────────────────── */
function DownloadToast({ filename, onClose }) {
    return (
        <motion.div
            className="dl-toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="dl-toast__icon">
                <Download size={18} />
            </div>
            <div className="dl-toast__body">
                <span className="dl-toast__title">Download started</span>
                <span className="dl-toast__file">{filename}</span>
            </div>
            <button className="dl-toast__close" onClick={onClose} aria-label="Dismiss">
                <X size={14} />
            </button>
        </motion.div>
    );
}

/* ─── Main Component ────────────────────────────────────── */
export default function FormatterPage() {
    const [file, setFile] = useState(null);
    const [styleGuide, setStyleGuide] = useState('APA7');
    const [status, setStatus] = useState('idle');   // idle | processing | success | error
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [toast, setToast] = useState(null);   // { filename } | null
    const toastTimer = useRef(null);

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
                // Auto-trigger browser download immediately
                triggerBlobDownload(data.blob, data.downloadName);
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

    const handleDownload = () => {
        if (!result?.blob) return;
        triggerBlobDownload(result.blob, result.downloadName || 'formatted_manuscript.docx');
    };

    /** Show a brief download toast then auto-dismiss after 4 s. */
    function showDownloadToast(filename) {
        setToast({ filename });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    }

    function triggerBlobDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showDownloadToast(filename);
    }

    /** Build and download a plain-text compliance report. */
    function handleDownloadReport() {
        if (!result) return;
        const lines = [];
        const hr = (char = '─') => char.repeat(60);

        lines.push('MANUSCRIPT COMPLIANCE REPORT');
        lines.push(hr('═'));
        lines.push(`File        : ${result.original_filename || '—'}`);
        lines.push(`Style Guide : ${result.style_guide || '—'}`);
        lines.push(`Score       : ${Math.round(result.compliance_score ?? 0)} / 100`);
        lines.push(`Processed in: ${result.processing_time_seconds}s`);
        lines.push('');

        // ── Compliance Rules ────────────────────────────────────
        if (result.compliance_report?.length > 0) {
            lines.push('COMPLIANCE RULES');
            lines.push(hr());
            result.compliance_report.forEach((item, i) => {
                const status = (item.status || 'info').toUpperCase().padEnd(7);
                const score = item.score != null ? `  [${item.score}%]` : '';
                lines.push(`${i + 1}. [${status}] ${item.rule}${score}`);
                if (item.explanation) {
                    lines.push(`   ${item.explanation}`);
                }
                if (item.examples?.length > 0) {
                    item.examples.forEach(ex => lines.push(`   • ${ex}`));
                }
                lines.push('');
            });
        }

        // ── Citation Report ──────────────────────────────────────
        const cr = result.citation_report;
        if (cr) {
            lines.push('CITATION REPORT');
            lines.push(hr());
            if (cr.summary) lines.push(cr.summary);
            if (cr.consistency_score != null) lines.push(`Consistency score: ${cr.consistency_score}%`);
            lines.push('');

            const errs = cr.format_errors || [];
            if (errs.length > 0) {
                lines.push(`Format Errors (${errs.length}):`);
                errs.forEach((e, i) => {
                    lines.push(`  ${i + 1}. Original : ${e.original}`);
                    lines.push(`     Fix      : ${e.fix}`);
                    if (e.issue) lines.push(`     Issue    : ${e.issue}`);
                });
                lines.push('');
            }
            const missing = cr.missing_references || [];
            if (missing.length > 0) {
                lines.push('Missing References:');
                missing.forEach(m => lines.push(`  • ${typeof m === 'string' ? m : JSON.stringify(m)}`));
                lines.push('');
            }
            const uncited = cr.uncited_references || [];
            if (uncited.length > 0) {
                lines.push('Uncited References:');
                uncited.forEach(u => lines.push(`  • ${typeof u === 'string' ? u : JSON.stringify(u)}`));
                lines.push('');
            }
        }

        // ── Changes ─────────────────────────────────────────────
        if (result.changes?.length > 0) {
            lines.push(`CHANGES MADE  (${result.changes.length} edits)`);
            lines.push(hr());
            result.changes.forEach((c, i) => {
                if (typeof c === 'string') {
                    lines.push(`${i + 1}. ${c}`);
                } else {
                    lines.push(`${i + 1}. ${c.field}`);
                    if (c.original) lines.push(`   Before : ${c.original}`);
                    if (c.corrected) lines.push(`   After  : ${c.corrected}`);
                    if (c.reason) lines.push(`   Reason : ${c.reason}`);
                }
                lines.push('');
            });
        }

        lines.push(hr('═'));
        lines.push(`Generated by Agent Paperpal`);

        const text = lines.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const baseName = (result.original_filename || 'manuscript').replace(/\.[^.]+$/, '');
        triggerBlobDownload(blob, `${baseName}_compliance_report.txt`);
    }

    /* ─── Compliance stats helper ─── */
    const complianceStats = (report = []) => {
        const pass = report.filter(i => i.status === 'pass').length;
        const fail = report.filter(i => i.status === 'fail').length;
        const partial = report.filter(i => i.status === 'partial').length;
        return { pass, fail, partial, total: report.length };
    };

    return (
        <div className="formatter-page">
            <div className="formatter-page__bg">
                <div className="formatter-page__orb formatter-page__orb--1" />
                <div className="formatter-page__orb formatter-page__orb--2" />
            </div>

            {/* ── Download Toast (fixed, outside panel) ── */}
            <AnimatePresence>
                {toast && (
                    <DownloadToast
                        filename={toast.filename}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            <div className="container formatter-page__content">
                {/* Page Header — always visible */}
                <motion.div
                    className="formatter-page__header"
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <span className="badge">
                        <Sparkles size={14} /> Manuscript Formatter
                    </span>
                    <h1 className="formatter-page__title">Format Your Manuscript</h1>
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

                        {/* ── IDLE ── */}
                        {status === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__form"
                            >
                                <div className="formatter-panel__section">
                                    <label className="formatter-panel__label">
                                        <FileText size={16} /> Upload Manuscript
                                    </label>
                                    <FileUpload onFileSelect={setFile} disabled={false} />
                                </div>

                                <div className="formatter-panel__section">
                                    <label className="formatter-panel__label">
                                        <ChevronDown size={16} /> Style Guide
                                    </label>
                                    <div className="style-selector">
                                        {STYLE_GUIDES.map((sg) => (
                                            <button
                                                type="button"
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

                                <button
                                    className="btn btn-primary btn-lg formatter-panel__submit"
                                    disabled={!file}
                                    onClick={handleFormat}
                                >
                                    <Sparkles size={18} /> Format Manuscript
                                </button>
                            </motion.div>
                        )}

                        {/* ── PROCESSING ── */}
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
                                    Our AI agents are parsing, formatting, and verifying your manuscript…
                                </p>
                                <div className="processing__steps">
                                    <ProcessingStep label="Parsing document" delay={0} elapsed={elapsed} />
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

                        {/* ── SUCCESS ── */}
                        {status === 'success' && result && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="formatter-panel__result"
                            >
                                {/* ① Success header */}
                                <div className="result__success-header">
                                    <div className="result__success-icon">
                                        <CheckCircle2 size={36} />
                                    </div>
                                    <h3 className="result__success-title">Formatting Complete!</h3>
                                    <p className="result__success-desc">
                                        Processed in <strong>{result.processing_time_seconds}s</strong> · Style guide:{' '}
                                        <strong>{result.style_guide}</strong> · File:{' '}
                                        <strong>{result.original_filename}</strong>
                                    </p>
                                </div>

                                {/* ② Score + file card row */}
                                <div className="result__main-row">
                                    <div className="result__score-card">
                                        <ScoreRing score={result.compliance_score} />
                                        <span className="result__score-label">Compliance Score</span>
                                    </div>

                                    <div className="result__file-card">
                                        <div className="result__file-card-icon">
                                            <FileCheck size={28} />
                                        </div>
                                        <div className="result__file-card-info">
                                            <span className="result__file-card-name">
                                                {result.downloadName || 'formatted_manuscript.docx'}
                                            </span>
                                            <span className="result__file-card-meta">
                                                DOCX · {result.style_guide} formatted
                                            </span>
                                        </div>
                                        <span className="result__file-card-badge">Ready</span>
                                    </div>
                                </div>

                                {/* ③ Download button */}
                                <div className="result__download-area">
                                    {result.blob ? (
                                        <button
                                            className="btn btn-primary btn-lg result__download-btn"
                                            onClick={handleDownload}
                                        >
                                            <Download size={20} /> Download Formatted Manuscript
                                        </button>
                                    ) : (
                                        <p className="result__no-file">No output file was generated.</p>
                                    )}
                                </div>

                                {/* ④ Compliance Report */}
                                {result.compliance_report?.length > 0 && (() => {
                                    const stats = complianceStats(result.compliance_report);
                                    return (
                                        <div className="result__section">
                                            <div className="result__section-header">
                                                <BookOpen size={16} />
                                                <h4 className="result__section-title">Compliance Report</h4>
                                                <div className="result__section-stats">
                                                    <span className="stat-pill stat-pill--pass">{stats.pass} Pass</span>
                                                    {stats.partial > 0 && <span className="stat-pill stat-pill--partial">{stats.partial} Partial</span>}
                                                    {stats.fail > 0 && <span className="stat-pill stat-pill--fail">{stats.fail} Fail</span>}
                                                </div>
                                                <button
                                                    className="btn-report-dl"
                                                    onClick={handleDownloadReport}
                                                    title="Download full compliance report as text file"
                                                >
                                                    <Download size={13} /> Download Report
                                                </button>
                                            </div>
                                            <div className="cr-list">
                                                {result.compliance_report.map((item, i) => (
                                                    <ComplianceCard key={i} item={item} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ⑤ Citation Report */}
                                {result.citation_report && (() => {
                                    const cr = result.citation_report;
                                    const errors = cr.format_errors || [];
                                    const missing = cr.missing_references || [];
                                    const uncited = cr.uncited_references || [];
                                    const hasData = errors.length || missing.length || uncited.length || cr.summary;
                                    if (!hasData) return null;
                                    return (
                                        <div className="result__section">
                                            <div className="result__section-header">
                                                <Quote size={16} />
                                                <h4 className="result__section-title">Citation Report</h4>
                                                {cr.consistency_score != null && (
                                                    <span className="result__section-score">
                                                        Consistency: {cr.consistency_score}%
                                                    </span>
                                                )}
                                            </div>

                                            {cr.summary && (
                                                <p className="cite-summary">{cr.summary}</p>
                                            )}

                                            {errors.length > 0 && (
                                                <div className="cite-group">
                                                    <span className="cite-group__label">
                                                        <XCircle size={13} /> {errors.length} Format Error{errors.length !== 1 ? 's' : ''}
                                                    </span>
                                                    {errors.map((err, i) => (
                                                        <CitationErrorCard key={i} err={err} />
                                                    ))}
                                                </div>
                                            )}

                                            {missing.length > 0 && (
                                                <div className="cite-group">
                                                    <span className="cite-group__label">
                                                        <AlertTriangle size={13} /> Missing References
                                                    </span>
                                                    {missing.map((m, i) => (
                                                        <div key={i} className="cite-simple-item">{typeof m === 'string' ? m : JSON.stringify(m)}</div>
                                                    ))}
                                                </div>
                                            )}

                                            {uncited.length > 0 && (
                                                <div className="cite-group">
                                                    <span className="cite-group__label">
                                                        <Info size={13} /> Uncited References
                                                    </span>
                                                    {uncited.map((u, i) => (
                                                        <div key={i} className="cite-simple-item">{typeof u === 'string' ? u : JSON.stringify(u)}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* ⑥ Changes Made */}
                                {result.changes?.length > 0 && (
                                    <div className="result__section">
                                        <div className="result__section-header">
                                            <ArrowRightLeft size={16} />
                                            <h4 className="result__section-title">Changes Made</h4>
                                            <span className="result__section-score">{result.changes.length} edits</span>
                                        </div>
                                        <div className="changes-list">
                                            {result.changes.map((change, i) => (
                                                <ChangeItem key={i} change={change} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ⑦ Pipeline Warnings */}
                                {result.errors?.length > 0 && (
                                    <div className="result__section">
                                        <div className="result__section-header">
                                            <AlertTriangle size={16} />
                                            <h4 className="result__section-title result__section-title--warn">Pipeline Warnings</h4>
                                        </div>
                                        <div className="cr-list">
                                            {result.errors.map((err, i) => (
                                                <div key={i} className="warn-item">
                                                    <AlertTriangle size={14} /> {err}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ⑧ Actions */}
                                <div className="result__actions">
                                    <button className="btn btn-secondary" onClick={handleReset}>
                                        <RotateCcw size={16} /> Format Another Document
                                    </button>
                                    {result.blob && (
                                        <button className="btn btn-outline" onClick={handleDownload}>
                                            <Download size={16} /> Re-Download
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── ERROR ── */}
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
