/**
 * File Processor - Handle text extraction from various file types
 */

import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

/**
 * Extract text from .txt file
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractFromTxt(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(e.target.result);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

/**
 * Extract text from .docx file
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractFromDocx(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                resolve(result.value);
            } catch (err) {
                reject(new Error(`Failed to extract text from Word document: ${err.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read Word file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extract text from image using OCR
 * @param {File} file
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<string>}
 */
export async function extractFromImage(file, onProgress = null) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imageData = e.target.result;

                // Tesseract.js v4+: pass language directly to createWorker
                // 'vie+eng' supports Vietnamese administrative documents + English
                const worker = await Tesseract.createWorker('vie+eng', 1, {
                    logger: (m) => {
                        if (onProgress) {
                            onProgress({
                                status: m.status,
                                progress: m.progress,
                            });
                        }
                    },
                });

                const result = await worker.recognize(imageData);
                const text = result.data.text;
                await worker.terminate();
                resolve(text || '');
            } catch (err) {
                reject(new Error(`OCR thất bại: ${err.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
        reader.readAsDataURL(file);
    });
}

/**
 * Process file and extract text based on file type
 * @param {File} file
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<string>}
 */
export async function processFile(file, onProgress = null) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    // Handle text files
    if (fileName.endsWith('.txt') || fileType === 'text/plain') {
        return extractFromTxt(file);
    }

    // Handle Word documents
    if (
        fileName.endsWith('.docx') ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return extractFromDocx(file);
    }

    // Handle images
    if (fileType.startsWith('image/')) {
        return extractFromImage(file, onProgress);
    }

    throw new Error(`Unsupported file type: ${fileType || 'unknown'}`);
}

/**
 * Get supported file types
 * @returns {Object}
 */
export function getSupportedFileTypes() {
    return {
        text: ['.txt'],
        document: ['.docx'],
        image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
    };
}

