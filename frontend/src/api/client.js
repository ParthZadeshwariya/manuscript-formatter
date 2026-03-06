const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API Error ${res.status}`);
    }
    return res;
}

export async function healthCheck() {
    const res = await request('/health');
    return res.json();
}

export async function listStyleGuides() {
    const res = await request('/style-guides');
    return res.json();
}

export async function getStyleGuide(name) {
    const res = await request(`/style-guides/${name}`);
    return res.json();
}

export async function validateFile(file, styleGuide) {
    const form = new FormData();
    form.append('file', file);
    form.append('style_guide', styleGuide);
    const res = await request('/validate', { method: 'POST', body: form });
    return res.json();
}

export async function formatManuscript(file, styleGuide) {
    const form = new FormData();
    form.append('file', file);
    form.append('style_guide', styleGuide);

    // Use raw fetch — we need both binary body AND custom X-* headers.
    const url = `${API_BASE}/format`;
    const res = await fetch(url, { method: 'POST', body: form });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API Error ${res.status}`);
    }

    const h = (name) => {
        const val = res.headers.get(name);
        try { return val ? decodeURIComponent(val) : null; } catch { return val; }
    };
    const hJson = (name, fallback) => {
        try { return JSON.parse(res.headers.get(name) || 'null') ?? fallback; } catch { return fallback; }
    };

    const blob = await res.blob();
    const downloadName = h('X-Download-Name') || 'formatted_manuscript.docx';
    const originalFilename = h('X-Original-Filename') || file.name;

    return {
        success: true,
        blob,
        downloadName,
        processing_time_seconds: parseFloat(h('X-Processing-Time') || '0'),
        style_guide: h('X-Style-Guide') || styleGuide,
        original_filename: originalFilename,
        compliance_score: parseFloat(h('X-Compliance-Score') || '0'),
        compliance_report: hJson('X-Compliance-Report', []),
        citation_report: hJson('X-Citation-Report', {}),
        changes: hJson('X-Changes', []),
        errors: hJson('X-Errors', []),
    };
}

export function getDownloadUrl(filename) {
    return `${API_BASE}/download/${filename}`;
}

export async function listOutputs() {
    const res = await request('/outputs');
    return res.json();
}
