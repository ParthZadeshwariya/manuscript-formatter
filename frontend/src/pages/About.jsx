import { motion } from 'framer-motion';
import {
    Bot, FileSearch, PenTool, BookOpen, BarChart3, FileOutput,
    Layers, BrainCircuit, Workflow, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './About.css';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } },
};

export default function About() {
    const agents = [
        { icon: <FileSearch size={24} />, name: 'Parser Agent', role: 'Document reader that extracts raw text and identifies sections, headings, and structure from .txt, .pdf, and .docx files.' },
        { icon: <BookOpen size={24} />, name: 'Style Agent', role: 'Loads the chosen style guide rules (APA7, MLA9, Chicago) and prepares the formatting ruleset for each section type.' },
        { icon: <Layers size={24} />, name: 'Structure Agent', role: 'Breaks the manuscript into logical sections — title, abstract, body, references — for targeted formatting.' },
        { icon: <PenTool size={24} />, name: 'Formatter Agent', role: 'Applies style rules to each section: margins, fonts, headings, spacing, running heads, and more.' },
        { icon: <BrainCircuit size={24} />, name: 'Citation Agent', role: 'Parses, validates, and reformats all citations and references to match the chosen style guide exactly.' },
        { icon: <BarChart3 size={24} />, name: 'Scorer Agent', role: 'Generates a compliance score and detailed report of what was fixed, what passed, and what needs attention.' },
    ];

    const pipeline = [
        { step: '1', label: 'Upload & Parse', desc: 'Your file is read and converted to structured text' },
        { step: '2', label: 'Load Style Rules', desc: 'The chosen style guide JSON is loaded into context' },
        { step: '3', label: 'Structure Analysis', desc: 'Sections are identified and classified' },
        { step: '4', label: 'Format & Fix', desc: 'AI agents apply formatting rules to each section' },
        { step: '5', label: 'Citation Handling', desc: 'Citations are parsed, validated, and corrected' },
        { step: '6', label: 'Score & Export', desc: 'Compliance scored and DOCX generated for download' },
    ];

    return (
        <div className="about-page">
            <div className="about-page__bg">
                <div className="about-page__orb about-page__orb--1" />
                <div className="about-page__orb about-page__orb--2" />
            </div>

            <div className="container about-page__content">
                {/* Hero */}
                <motion.div
                    className="about-hero"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    <motion.span className="badge" variants={fadeUp}>
                        <Bot size={14} /> Meet the Agents
                    </motion.span>
                    <motion.h1 className="about-hero__title" variants={fadeUp} custom={1}>
                        How Agent Paperpal Works
                    </motion.h1>
                    <motion.p className="about-hero__desc" variants={fadeUp} custom={2}>
                        Under the hood, Agent Paperpal orchestrates a team of specialized AI agents —
                        each responsible for a distinct part of the manuscript formatting pipeline.
                        Built with LangGraph and powered by Google Gemini.
                    </motion.p>
                </motion.div>

                {/* Pipeline */}
                <motion.div
                    className="pipeline-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    <motion.h2 className="pipeline__title" variants={fadeUp}>
                        <Workflow size={20} /> The Formatting Pipeline
                    </motion.h2>
                    <div className="pipeline__track">
                        {pipeline.map((item, i) => (
                            <motion.div key={i} className="pipeline__step" variants={fadeUp} custom={i}>
                                <div className="pipeline__step-num">{item.step}</div>
                                <div className="pipeline__step-content">
                                    <h4>{item.label}</h4>
                                    <p>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Agents Grid */}
                <motion.div
                    className="agents-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    <motion.h2 className="agents__title" variants={fadeUp}>
                        The Agent Team
                    </motion.h2>
                    <motion.p className="agents__desc" variants={fadeUp} custom={1}>
                        Six specialized AI agents, each an expert in its domain, working in concert to deliver
                        publication-ready manuscripts.
                    </motion.p>
                    <div className="agents__grid">
                        {agents.map((agent, i) => (
                            <motion.div key={i} className="agent-card card" variants={fadeUp} custom={i}>
                                <div className="agent-card__icon">{agent.icon}</div>
                                <h3 className="agent-card__name">{agent.name}</h3>
                                <p className="agent-card__role">{agent.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div
                    className="tech-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    <motion.h2 className="tech__title" variants={fadeUp}>Built With</motion.h2>
                    <motion.div className="tech__grid" variants={stagger}>
                        {[
                            { name: 'LangGraph', desc: 'Agent orchestration framework' },
                            { name: 'Google Gemini', desc: 'Large language model backbone' },
                            { name: 'FastAPI', desc: 'High-performance Python backend' },
                            { name: 'React + Vite', desc: 'Modern frontend framework' },
                        ].map((tech, i) => (
                            <motion.div key={i} className="tech-chip" variants={fadeUp} custom={i}>
                                <span className="tech-chip__name">{tech.name}</span>
                                <span className="tech-chip__desc">{tech.desc}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    className="about-cta"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>Try It Yourself</h2>
                    <p>Upload a manuscript and watch the agents work their magic.</p>
                    <Link to="/format" className="btn btn-primary btn-lg">
                        Go to Formatter <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
