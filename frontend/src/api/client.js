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
    const res = await request('/format', { method: 'POST', body: form });
    return res.json();
}

export function getDownloadUrl(filename) {
    return `${API_BASE}/download/${filename}`;
}

export async function listOutputs() {
    const res = await request('/outputs');
    return res.json();
}
