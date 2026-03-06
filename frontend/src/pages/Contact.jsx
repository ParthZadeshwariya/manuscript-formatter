import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import './Contact.css';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="contact-page">
            <div className="contact-page__bg">
                <div className="contact-page__orb contact-page__orb--1" />
            </div>

            <div className="container contact-page__content">
                <motion.div
                    className="contact-hero"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    <motion.span className="badge" variants={fadeUp}>
                        <MessageSquare size={14} /> Get In Touch
                    </motion.span>
                    <motion.h1 className="contact-hero__title" variants={fadeUp} custom={1}>
                        Contact Us
                    </motion.h1>
                    <motion.p className="contact-hero__desc" variants={fadeUp} custom={2}>
                        Have a question, feedback, or feature request? We'd love to hear from you.
                    </motion.p>
                </motion.div>

                <motion.div
                    className="contact-grid"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    {/* Form */}
                    <motion.div className="contact-form-card" variants={fadeUp} custom={3}>
                        {submitted ? (
                            <div className="contact-success">
                                <div className="contact-success__icon">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3>Message Sent!</h3>
                                <p>Thank you for reaching out. We'll get back to you shortly.</p>
                                <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                                    Send Another
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="contact-form__row">
                                    <div className="contact-form__field">
                                        <label htmlFor="contact-name">Name</label>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            placeholder="Your name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="contact-form__field">
                                        <label htmlFor="contact-email">Email</label>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="contact-form__field">
                                    <label htmlFor="contact-subject">Subject</label>
                                    <input
                                        id="contact-subject"
                                        name="subject"
                                        type="text"
                                        placeholder="What's this about?"
                                        value={form.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="contact-form__field">
                                    <label htmlFor="contact-message">Message</label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows={5}
                                        placeholder="Tell us more..."
                                        value={form.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg contact-form__submit">
                                    <Send size={18} /> Send Message
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* Info Cards */}
                    <motion.div className="contact-info" variants={fadeUp} custom={4}>
                        <div className="contact-info-card">
                            <div className="contact-info-card__icon">
                                <Mail size={22} />
                            </div>
                            <h4>Email</h4>
                            <p>support@agentpaperpal.com</p>
                        </div>
                        <div className="contact-info-card">
                            <div className="contact-info-card__icon">
                                <Clock size={22} />
                            </div>
                            <h4>Response Time</h4>
                            <p>Usually within 24 hours</p>
                        </div>
                        <div className="contact-info-card">
                            <div className="contact-info-card__icon">
                                <MapPin size={22} />
                            </div>
                            <h4>Location</h4>
                            <p>Remote-first team</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
