/**
 * NER API - Named Entity Recognition
 * Calls backend API to detect personal and sensitive data
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Predict entities from text
 * @param {string} text - Input text to analyze
 * @returns {Promise<Object>} - NER result with entities
 */
export async function predictNER(text) {
    if (!text?.trim()) {
        throw new Error('Text input is required');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`NER prediction failed: ${error.message}`);
    }
}

/**
 * Check if API is available
 * @returns {Promise<boolean>} - true if API is reachable
 */
export async function checkNERStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

