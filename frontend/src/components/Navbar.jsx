import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Sun, Moon, FileText } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/format', label: 'Formatter' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner container">
                <Link to="/" className="navbar__brand" aria-label="Agent Paperpal Home">
                    <div className="navbar__logo">
                        <FileText size={22} strokeWidth={2.5} />
                    </div>
                    <span className="navbar__name">
                        Agent <span className="navbar__name-accent">Paperpal</span>
                    </span>
                </Link>

                <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="navbar__links-cta">
                        <Link to="/format" className="btn btn-primary btn-sm">
                            Format Now
                        </Link>
                    </div>
                </div>

                <div className="navbar__actions">
                    <button
                        className="btn-icon navbar__theme-btn"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <Link to="/format" className="btn btn-primary btn-sm navbar__cta-desktop">
                        Format Now
                    </Link>
                    <button
                        className="btn-icon navbar__menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
