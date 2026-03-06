import { Link } from 'react-router-dom';
import { FileText, Github, Twitter, Linkedin, Heart, ArrowUpRight } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__grid">
                    {/* Brand Column */}
                    <div className="footer__brand-col">
                        <Link to="/" className="footer__brand">
                            <div className="footer__logo">
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                            <span className="footer__brand-name">Agent Paperpal</span>
                        </Link>
                        <p className="footer__tagline">
                            AI-powered manuscript formatting that transforms your academic papers into
                            publication-ready documents in seconds.
                        </p>
                        <div className="footer__socials">
                            <a href="#" className="footer__social" aria-label="GitHub">
                                <Github size={18} />
                            </a>
                            <a href="#" className="footer__social" aria-label="Twitter">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="footer__social" aria-label="LinkedIn">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="footer__col">
                        <h4 className="footer__heading">Product</h4>
                        <Link to="/format" className="footer__link">
                            Formatter <ArrowUpRight size={14} />
                        </Link>
                        <Link to="/about" className="footer__link">How It Works</Link>
                        <Link to="/about" className="footer__link">Style Guides</Link>
                    </div>

                    {/* Company */}
                    <div className="footer__col">
                        <h4 className="footer__heading">Company</h4>
                        <Link to="/about" className="footer__link">About Us</Link>
                        <Link to="/contact" className="footer__link">Contact</Link>
                    </div>

                    {/* Legal */}
                    <div className="footer__col">
                        <h4 className="footer__heading">Legal</h4>
                        <Link to="/contact" className="footer__link">Privacy Policy</Link>
                        <Link to="/contact" className="footer__link">Terms of Service</Link>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p className="footer__copyright">
                        © {new Date().getFullYear()} Agent Paperpal. Built with{' '}
                        <Heart size={14} className="footer__heart" /> for researchers.
                    </p>
                    <p className="footer__meta">
                        Powered by AI Agents · LangGraph · Gemini
                    </p>
                </div>
            </div>
        </footer>
    );
}
