import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, FileCheck, AlertCircle } from 'lucide-react';
import './FileUpload.css';

const ALLOWED = ['txt', 'pdf', 'docx'];
const MAX_SIZE_MB = 10;

export default function FileUpload({ onFileSelect, disabled }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const validateFile = useCallback((file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED.includes(ext)) {
            return `Unsupported file type ".${ext}". Use .txt, .pdf, or .docx`;
        }
        if (file.size / (1024 * 1024) > MAX_SIZE_MB) {
            return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max ${MAX_SIZE_MB}MB`;
        }
        return null;
    }, []);

    const handleFile = useCallback((file) => {
        setError('');
        const err = validateFile(file);
        if (err) {
            setError(err);
            setSelectedFile(null);
            onFileSelect?.(null);
            return;
        }
        setSelectedFile(file);
        onFileSelect?.(file);
    }, [validateFile, onFileSelect]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled) return;
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    }, [disabled, handleFile]);

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError('');
        onFileSelect?.(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="file-upload">
            <div
                className={`file-upload__zone ${dragActive ? 'file-upload__zone--active' : ''} ${selectedFile ? 'file-upload__zone--has-file' : ''} ${error ? 'file-upload__zone--error' : ''} ${disabled ? 'file-upload__zone--disabled' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleChange}
                    className="file-upload__input"
                    disabled={disabled}
                />

                {selectedFile ? (
                    <div className="file-upload__selected">
                        <div className="file-upload__file-icon">
                            <FileCheck size={28} />
                        </div>
                        <div className="file-upload__file-info">
                            <span className="file-upload__filename">{selectedFile.name}</span>
                            <span className="file-upload__filesize">{formatSize(selectedFile.size)}</span>
                        </div>
                        {!disabled && (
                            <button className="file-upload__clear" onClick={(e) => { e.stopPropagation(); clearFile(); }} aria-label="Remove file">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="file-upload__placeholder">
                        <div className={`file-upload__icon ${dragActive ? 'file-upload__icon--bounce' : ''}`}>
                            <Upload size={32} />
                        </div>
                        <p className="file-upload__title">
                            {dragActive ? 'Drop your manuscript here' : 'Drag & Drop your manuscript'}
                        </p>
                        <p className="file-upload__subtitle">
                            or <span className="file-upload__browse">browse files</span>
                        </p>
                        <div className="file-upload__formats">
                            {ALLOWED.map(ext => (
                                <span key={ext} className="file-upload__format-tag">.{ext}</span>
                            ))}
                            <span className="file-upload__size-limit">up to {MAX_SIZE_MB}MB</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="file-upload__error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
