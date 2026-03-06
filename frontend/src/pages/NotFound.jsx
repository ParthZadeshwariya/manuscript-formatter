import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowRight } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="notfound-page">
            <div className="notfound-page__bg">
                <div className="notfound-page__orb" />
            </div>

            <motion.div
                className="notfound-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="notfound__icon">
                    <FileQuestion size={48} />
                </div>
                <h1 className="notfound__code">404</h1>
                <h2 className="notfound__title">Page Not Found</h2>
                <p className="notfound__desc">
                    Looks like this manuscript got lost in formatting. Let's get you back on track.
                </p>
                <div className="notfound__actions">
                    <Link to="/" className="btn btn-primary">
                        <Home size={16} /> Back to Home
                    </Link>
                    <Link to="/format" className="btn btn-secondary">
                        Go to Formatter <ArrowRight size={16} />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
