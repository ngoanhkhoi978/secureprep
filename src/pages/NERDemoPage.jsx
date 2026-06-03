import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictNER, checkNERStatus } from '../api/ner';
import { processFile } from '../lib/fileProcessor';
import { EntityTooltip } from '../components/ui/EntityTooltip';

/* ─── Entity type configuration ─────────────────────────── */
const ENTITY_CONFIG = {
    NAME: {
        label: 'Họ và tên',
        color: '#2563eb',
        bg: 'rgba(37,99,235,0.10)',
        border: 'rgba(37,99,235,0.30)',
        dot: '#2563eb',
    },
    EMAIL: {
        label: 'Email',
        color: '#059669',
        bg: 'rgba(5,150,105,0.10)',
        border: 'rgba(5,150,105,0.30)',
        dot: '#059669',
    },
    PHONE: {
        label: 'Số điện thoại',
        color: '#7c3aed',
        bg: 'rgba(124,58,237,0.10)',
        border: 'rgba(124,58,237,0.30)',
        dot: '#7c3aed',
    },
    ADDRESS: {
        label: 'Địa chỉ',
        color: '#d97706',
        bg: 'rgba(217,119,6,0.10)',
        border: 'rgba(217,119,6,0.30)',
        dot: '#d97706',
    },
    ID_NUMBER: {
        label: 'Số định danh',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.10)',
        border: 'rgba(220,38,38,0.30)',
        dot: '#dc2626',
    },
    DATE: {
        label: 'Ngày tháng',
        color: '#0891b2',
        bg: 'rgba(8,145,178,0.10)',
        border: 'rgba(8,145,178,0.30)',
        dot: '#0891b2',
    },
};

const getConfig = (fieldName) =>
    ENTITY_CONFIG[fieldName] || {
        label: fieldName,
        color: '#64748b',
        bg: 'rgba(100,116,139,0.10)',
        border: 'rgba(100,116,139,0.30)',
        dot: '#64748b',
    };

/* ─── SVG Icons ──────────────────────────────────────────── */
const ShieldIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const UploadIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const SearchIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const TrashIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

const FileTextIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const CopyIcon = () => (
    <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const ChevronIcon = ({ open }) => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
        }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ value, label, accent }) {
    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px',
                borderTop: `3px solid ${accent}`,
            }}
        >
            <div
                style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: accent,
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginTop: 6,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                {label}
            </div>
        </div>
    );
}

/* ─── Entity Badge ───────────────────────────────────────── */
function EntityBadge({ fieldName, small }) {
    const cfg = getConfig(fieldName);
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                borderRadius: 6,
                padding: small ? '2px 7px' : '3px 10px',
                fontSize: small ? 11 : 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: cfg.dot,
                    display: 'inline-block',
                    flexShrink: 0,
                }}
            />
            {cfg.label}
        </span>
    );
}

/* ─── Highlighted Text Renderer ──────────────────────────── */
function renderHighlightedText(input, result) {
    if (!input)
        return <span style={{ color: '#94a3b8' }}>Không có nội dung</span>;

    const segments = [];
    let currentIdx = 0;

    while (currentIdx < input.length) {
        const entity = result.entities?.find(
            (e) => currentIdx >= e.start && currentIdx < e.end,
        );

        if (entity) {
            let endIdx = currentIdx;
            while (
                endIdx < entity.end &&
                result.entities?.find(
                    (e) => endIdx >= e.start && endIdx < e.end,
                ) === entity
            ) {
                endIdx++;
            }
            const cfg = getConfig(entity.field_name);
            const text = input.substring(currentIdx, endIdx);
            segments.push(
                <EntityTooltip key={currentIdx} entity={entity}>
                    <mark
                        style={{
                            background: cfg.bg,
                            color: cfg.color,
                            borderBottom: `2px solid ${cfg.border}`,
                            borderRadius: 3,
                            padding: '0 2px',
                            cursor: 'help',
                            fontWeight: 500,
                        }}
                    >
                        {text}
                    </mark>
                </EntityTooltip>,
            );
            currentIdx = endIdx;
        } else {
            let endIdx = currentIdx;
            while (
                endIdx < input.length &&
                !result.entities?.find(
                    (e) => endIdx >= e.start && endIdx < e.end,
                )
            ) {
                endIdx++;
            }
            segments.push(
                <span key={currentIdx}>
                    {input.substring(currentIdx, endIdx)}
                </span>,
            );
            currentIdx = endIdx;
        }
    }

    return segments;
}

/* ─── Main Page ──────────────────────────────────────────── */
const EXAMPLES = [
    {
        label: 'Ví dụ ngắn',
        text: 'Tôi tên Ngô Anh Khôi sinh ngày 01/01/2000',
    },
    {
        label: 'Hồ sơ hành chính',
        text: 'Trong quá trình trao đổi hỗ trợ qua kênh dịch vụ, ông Nguyễn Văn Tuấn đã cung cấp thông tin bổ sung liên quan đến hồ sơ công nhận và giao quyền quản lý cho tổ chức cộng đồng của mình. Ông cho biết, ngày 17/05/1972, ông sinh tại Phường/Xã Minh Tân, Quận/Huyện Nghĩa Lộ, Tỉnh/Thành phố Yên Bái. Ông là một Kỹ sư phần mềm, có biển số xe là 21A-21451. Ngoài ra, ông cung cấp mã tham chiếu sinh trắc học BIO-02525864, và VNeID-0305734467. số điện thoại là 0851915535. Hồ sơ này được xử lý bởi cán bộ tại Bộ Nông nghiệp và Môi trường, số căn cước công dân là 015943009333.',
    },
];

export default function NERDemoPage() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [error, setError] = useState(null);
    const [apiStatus, setApiStatus] = useState('checking');
    const [fileName, setFileName] = useState('');
    const [copied, setCopied] = useState(false);
    const [jsonOpen, setJsonOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('highlight'); // 'highlight' | 'table'

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        checkNERStatus().then((isOnline) =>
            setApiStatus(isOnline ? 'online' : 'offline'),
        );
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 360)}px`;
        }
    }, [input]);

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        setOcrProgress(0);
        setOcrStatus('');
        setFileName(file.name);
        try {
            const text = await processFile(file, (progress) => {
                if (progress.progress != null)
                    setOcrProgress(Math.round(progress.progress * 100));
                if (progress.status) setOcrStatus(progress.status);
            });
            setInput(text);
            setOcrProgress(0);
            setOcrStatus('');
        } catch (err) {
            setError(err.message || 'Lỗi xử lý file');
            setFileName('');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;
        if (apiStatus !== 'online') {
            setError(
                'Dịch vụ phân tích chưa sẵn sàng. Vui lòng kiểm tra kết nối API.',
            );
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await predictNER(text);
            setResult(data);
            setActiveTab('highlight');
        } catch (err) {
            setError(err.message || 'Lỗi không xác định');
            setApiStatus('offline');
        } finally {
            setLoading(false);
        }
    }, [input, loading, apiStatus]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleClear = () => {
        setInput('');
        setResult(null);
        setError(null);
        setFileName('');
        textareaRef.current?.focus();
    };

    const handleRetry = () => {
        setApiStatus('checking');
        checkNERStatus().then((ok) => setApiStatus(ok ? 'online' : 'offline'));
    };

    const handleCopyJSON = () => {
        if (!result) return;
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const entityTypes = result
        ? [...new Set(result.entities?.map((e) => e.field_name) || [])]
        : [];
    const totalEntities = result?.total_entities ?? 0;
    const sensitiveChars =
        result?.entities?.reduce((s, e) => s + (e.end - e.start), 0) ?? 0;

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f8fafc',
                fontFamily: "'Inter', 'Nunito', sans-serif",
            }}
        >
            {/* ── Top bar ────────────────────────────────────────── */}
            <header
                style={{
                    background: '#fff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                }}
            >
                <div
                    style={{
                        maxWidth: 1100,
                        margin: '0 auto',
                        padding: '0 24px',
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Brand */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background:
                                    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                            }}
                        >
                            <ShieldIcon />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    lineHeight: 1.2,
                                }}
                            >
                                DataShield
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: '#64748b',
                                    letterSpacing: '0.06em',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Phát hiện dữ liệu nhạy cảm
                            </div>
                        </div>
                    </div>

                    {/* Status pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background:
                                apiStatus === 'online'
                                    ? 'rgba(5,150,105,0.08)'
                                    : apiStatus === 'checking'
                                      ? 'rgba(100,116,139,0.08)'
                                      : 'rgba(220,38,38,0.08)',
                            border: `1px solid ${apiStatus === 'online' ? 'rgba(5,150,105,0.25)' : apiStatus === 'checking' ? 'rgba(100,116,139,0.2)' : 'rgba(220,38,38,0.25)'}`,
                            borderRadius: 20,
                            padding: '5px 12px',
                        }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background:
                                    apiStatus === 'online'
                                        ? '#059669'
                                        : apiStatus === 'checking'
                                          ? '#94a3b8'
                                          : '#dc2626',
                                boxShadow:
                                    apiStatus === 'online'
                                        ? '0 0 0 3px rgba(5,150,105,0.2)'
                                        : 'none',
                                animation:
                                    apiStatus === 'online'
                                        ? 'pulse-dot 2s infinite'
                                        : 'none',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color:
                                    apiStatus === 'online'
                                        ? '#059669'
                                        : apiStatus === 'checking'
                                          ? '#64748b'
                                          : '#dc2626',
                            }}
                        >
                            {apiStatus === 'online'
                                ? 'API Sẵn sàng'
                                : apiStatus === 'checking'
                                  ? 'Đang kiểm tra…'
                                  : 'API Ngoại tuyến'}
                        </span>
                        {apiStatus === 'offline' && (
                            <button
                                onClick={handleRetry}
                                style={{
                                    fontSize: 11,
                                    color: '#2563eb',
                                    fontWeight: 600,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0 0 0 4px',
                                }}
                            >
                                Thử lại
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Page hero ──────────────────────────────────────── */}
            <div
                style={{
                    background:
                        'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)',
                    padding: '48px 24px 56px',
                }}
            >
                <div
                    style={{
                        maxWidth: 760,
                        margin: '0 auto',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            background: 'rgba(255,255,255,0.10)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: 20,
                            padding: '5px 14px',
                            marginBottom: 20,
                        }}
                    >
                        <ShieldIcon />
                        <span
                            style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.85)',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                            }}
                        >
                            HỆ THỐNG PHÁT HIỆN DỮ LIỆU CÁ NHÂN
                        </span>
                    </div>
                    <h1
                        style={{
                            fontSize: 36,
                            fontWeight: 800,
                            color: '#fff',
                            lineHeight: 1.2,
                            margin: '0 0 14px',
                        }}
                    >
                        Phát hiện &amp; Bảo vệ
                        <br />
                        <span style={{ color: '#60a5fa' }}>
                            Dữ liệu Nhạy cảm
                        </span>
                    </h1>
                    <p
                        style={{
                            fontSize: 16,
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        Công cụ nhận diện tự động thông tin cá nhân (PII) và dữ
                        liệu nhạy cảm trong văn bản hành chính — hỗ trợ tuân thủ
                        Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
                    </p>
                </div>
            </div>

            {/* ── Main content ───────────────────────────────────── */}
            <div
                style={{
                    maxWidth: 1100,
                    margin: '0 auto',
                    padding: '32px 24px 64px',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 24,
                        alignItems: 'start',
                    }}
                >
                    {/* ── Left: Input panel ──────────────────────── */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 14,
                                overflow: 'hidden',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* Panel header */}
                            <div
                                style={{
                                    padding: '14px 18px',
                                    borderBottom: '1px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <SearchIcon />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#0f172a',
                                        }}
                                    >
                                        Văn bản đầu vào
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'center',
                                    }}
                                >
                                    {input && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: '#94a3b8',
                                            }}
                                        >
                                            {input.length} ký tự
                                        </span>
                                    )}
                                    {(input || result) && (
                                        <button
                                            onClick={handleClear}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                background: 'none',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 7,
                                                padding: '4px 10px',
                                                cursor: 'pointer',
                                                color: '#64748b',
                                                fontSize: 12,
                                                fontWeight: 500,
                                            }}
                                        >
                                            <TrashIcon /> Xóa
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Textarea */}
                            <div style={{ padding: '4px 0 0' }}>
                                <textarea
                                    id="input-text"
                                    ref={textareaRef}
                                    rows={8}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Dán văn bản hành chính vào đây… (Enter để phân tích)"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        resize: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '14px 18px',
                                        fontSize: 14,
                                        lineHeight: 1.7,
                                        color: '#1e293b',
                                        background: 'transparent',
                                        fontFamily: 'inherit',
                                        minHeight: 180,
                                    }}
                                />
                            </div>

                            {/* File name strip */}
                            <AnimatePresence>
                                {fileName && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{
                                            borderTop: '1px solid #f1f5f9',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '8px 18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                background:
                                                    'rgba(37,99,235,0.03)',
                                            }}
                                        >
                                            <FileTextIcon />
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: '#2563eb',
                                                    fontWeight: 500,
                                                    flex: 1,
                                                }}
                                            >
                                                {fileName}
                                            </span>
                                            <button
                                                onClick={() => setFileName('')}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8',
                                                    fontSize: 14,
                                                    padding: 0,
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* OCR progress */}
                            <AnimatePresence>
                                {ocrProgress > 0 && ocrProgress < 100 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{
                                            borderTop: '1px solid #f1f5f9',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{ padding: '10px 18px' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    marginBottom: 6,
                                                    fontSize: 11,
                                                    color: '#64748b',
                                                }}
                                            >
                                                <span>
                                                    🔍{' '}
                                                    {ocrStatus ||
                                                        'Đang nhận dạng chữ (OCR)…'}
                                                </span>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        color: '#2563eb',
                                                    }}
                                                >
                                                    {ocrProgress}%
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    height: 4,
                                                    background: '#e2e8f0',
                                                    borderRadius: 4,
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        width: `${ocrProgress}%`,
                                                    }}
                                                    style={{
                                                        height: '100%',
                                                        background:
                                                            'linear-gradient(90deg, #2563eb, #60a5fa)',
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div
                                style={{
                                    padding: '12px 18px',
                                    borderTop: '1px solid #f1f5f9',
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !input.trim() ||
                                        loading ||
                                        apiStatus !== 'online'
                                    }
                                    style={{
                                        flex: 1,
                                        background:
                                            !input.trim() ||
                                            loading ||
                                            apiStatus !== 'online'
                                                ? '#e2e8f0'
                                                : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                                        color:
                                            !input.trim() ||
                                            loading ||
                                            apiStatus !== 'online'
                                                ? '#94a3b8'
                                                : '#fff',
                                        border: 'none',
                                        borderRadius: 9,
                                        padding: '11px 0',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor:
                                            !input.trim() ||
                                            loading ||
                                            apiStatus !== 'online'
                                                ? 'not-allowed'
                                                : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        transition: 'all 0.18s',
                                    }}
                                >
                                    {loading && !fileName ? (
                                        <>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 14,
                                                    height: 14,
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTopColor: '#fff',
                                                    borderRadius: '50%',
                                                    animation:
                                                        'spin 0.7s linear infinite',
                                                }}
                                            />
                                            Đang phân tích…
                                        </>
                                    ) : (
                                        <>
                                            <SearchIcon /> Phân tích văn bản
                                        </>
                                    )}
                                </button>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 7,
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 9,
                                        padding: '10px 16px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#374151',
                                        cursor: loading
                                            ? 'not-allowed'
                                            : 'pointer',
                                        whiteSpace: 'nowrap',
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    <UploadIcon /> Tải file
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".txt,.docx,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
                                        onChange={handleFileUpload}
                                        disabled={loading}
                                        className="hidden"
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Examples */}
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 14,
                                padding: '14px 18px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#64748b',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                }}
                            >
                                Ví dụ mẫu
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 7,
                                }}
                            >
                                {EXAMPLES.map((ex) => (
                                    <button
                                        key={ex.label}
                                        onClick={() => setInput(ex.text)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 9,
                                            padding: '9px 13px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition:
                                                'border-color 0.15s, background 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                                '#2563eb';
                                            e.currentTarget.style.background =
                                                'rgba(37,99,235,0.04)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                '#e2e8f0';
                                            e.currentTarget.style.background =
                                                '#f8fafc';
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {ex.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {ex.text.substring(0, 50)}…
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 14,
                                                color: '#cbd5e1',
                                                flexShrink: 0,
                                            }}
                                        >
                                            →
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Format support */}
                        <div
                            style={{
                                background: 'rgba(37,99,235,0.04)',
                                border: '1px solid rgba(37,99,235,0.12)',
                                borderRadius: 14,
                                padding: '12px 18px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#2563eb',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    marginBottom: 8,
                                }}
                            >
                                Định dạng hỗ trợ
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                }}
                            >
                                {[
                                    '.txt',
                                    '.docx',
                                    '.png / .jpg',
                                    '.bmp / .tiff',
                                ].map((f) => (
                                    <span
                                        key={f}
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#2563eb',
                                            background: 'rgba(37,99,235,0.10)',
                                            border: '1px solid rgba(37,99,235,0.2)',
                                            borderRadius: 5,
                                            padding: '3px 9px',
                                        }}
                                    >
                                        {f}
                                    </span>
                                ))}
                            </div>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    marginTop: 8,
                                    lineHeight: 1.5,
                                }}
                            >
                                Hình ảnh được xử lý qua <strong>OCR</strong>{' '}
                                (Tesseract). Chất lượng nhận dạng phụ thuộc vào
                                độ rõ của ảnh.
                            </p>
                        </div>
                    </div>

                    {/* ── Right: Results panel ───────────────────── */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        background: 'rgba(220,38,38,0.06)',
                                        border: '1px solid rgba(220,38,38,0.25)',
                                        borderRadius: 12,
                                        padding: '14px 18px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#dc2626',
                                        }}
                                    >
                                        ⚠ Đã xảy ra lỗi
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#b91c1c',
                                            marginTop: 4,
                                        }}
                                    >
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading skeleton */}
                        {loading && !fileName && (
                            <div
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: 24,
                                }}
                            >
                                {[80, 60, 90, 40].map((w, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            height: 14,
                                            borderRadius: 6,
                                            background: '#f1f5f9',
                                            width: `${w}%`,
                                            marginBottom: 12,
                                            animation:
                                                'shimmer 1.4s ease-in-out infinite',
                                            backgroundSize: '200% 100%',
                                            backgroundImage:
                                                'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%)',
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Results */}
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 14,
                                    }}
                                >
                                    {/* Stats row */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns:
                                                'repeat(3, 1fr)',
                                            gap: 10,
                                        }}
                                    >
                                        <StatCard
                                            value={totalEntities}
                                            label="Thực thể phát hiện"
                                            accent="#2563eb"
                                        />
                                        <StatCard
                                            value={entityTypes.length}
                                            label="Loại dữ liệu"
                                            accent="#7c3aed"
                                        />
                                        <StatCard
                                            value={sensitiveChars}
                                            label="Ký tự nhạy cảm"
                                            accent="#dc2626"
                                        />
                                    </div>

                                    {/* Legend */}
                                    {entityTypes.length > 0 && (
                                        <div
                                            style={{
                                                background: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: '#64748b',
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    marginBottom: 10,
                                                }}
                                            >
                                                Loại dữ liệu phát hiện
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 7,
                                                }}
                                            >
                                                {entityTypes.map((t) => {
                                                    const count =
                                                        result.entities.filter(
                                                            (e) =>
                                                                e.field_name ===
                                                                t,
                                                        ).length;
                                                    const cfg = getConfig(t);
                                                    return (
                                                        <span
                                                            key={t}
                                                            style={{
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 6,
                                                                background:
                                                                    cfg.bg,
                                                                border: `1px solid ${cfg.border}`,
                                                                color: cfg.color,
                                                                borderRadius: 7,
                                                                padding:
                                                                    '4px 10px',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius:
                                                                        '50%',
                                                                    background:
                                                                        cfg.dot,
                                                                }}
                                                            />
                                                            {cfg.label}
                                                            <span
                                                                style={{
                                                                    background:
                                                                        cfg.dot,
                                                                    color: '#fff',
                                                                    borderRadius: 10,
                                                                    padding:
                                                                        '0 5px',
                                                                    fontSize: 10,
                                                                }}
                                                            >
                                                                {count}
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tabs */}
                                    <div
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 14,
                                            overflow: 'hidden',
                                            boxShadow:
                                                '0 1px 4px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        {/* Tab bar */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                borderBottom:
                                                    '1px solid #f1f5f9',
                                            }}
                                        >
                                            {[
                                                {
                                                    key: 'highlight',
                                                    label: 'Văn bản tô sáng',
                                                },
                                                {
                                                    key: 'table',
                                                    label: 'Danh sách thực thể',
                                                },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    onClick={() =>
                                                        setActiveTab(tab.key)
                                                    }
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 0',
                                                        fontSize: 13,
                                                        fontWeight:
                                                            activeTab ===
                                                            tab.key
                                                                ? 700
                                                                : 500,
                                                        color:
                                                            activeTab ===
                                                            tab.key
                                                                ? '#2563eb'
                                                                : '#64748b',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        borderBottom:
                                                            activeTab ===
                                                            tab.key
                                                                ? '2px solid #2563eb'
                                                                : '2px solid transparent',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Highlight view */}
                                        {activeTab === 'highlight' && (
                                            <div style={{ padding: 20 }}>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        lineHeight: 2,
                                                        color: '#1e293b',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    {renderHighlightedText(
                                                        input,
                                                        result,
                                                    )}
                                                </div>
                                                {result.entities?.length >
                                                    0 && (
                                                    <p
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#94a3b8',
                                                            marginTop: 12,
                                                            padding: '8px 0 0',
                                                            borderTop:
                                                                '1px solid #f1f5f9',
                                                        }}
                                                    >
                                                        💡 Trỏ chuột vào phần tô
                                                        sáng để xem chi tiết
                                                        thực thể
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Table view */}
                                        {activeTab === 'table' && (
                                            <div style={{ overflowX: 'auto' }}>
                                                {result.entities?.length > 0 ? (
                                                    <table
                                                        style={{
                                                            width: '100%',
                                                            borderCollapse:
                                                                'collapse',
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        <thead>
                                                            <tr
                                                                style={{
                                                                    background:
                                                                        '#f8fafc',
                                                                }}
                                                            >
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            '10px 16px',
                                                                        textAlign:
                                                                            'left',
                                                                        fontWeight: 700,
                                                                        color: '#374151',
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    #
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            '10px 16px',
                                                                        textAlign:
                                                                            'left',
                                                                        fontWeight: 700,
                                                                        color: '#374151',
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    Loại
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            '10px 16px',
                                                                        textAlign:
                                                                            'left',
                                                                        fontWeight: 700,
                                                                        color: '#374151',
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    Giá trị
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            '10px 16px',
                                                                        textAlign:
                                                                            'left',
                                                                        fontWeight: 700,
                                                                        color: '#374151',
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    Vị trí
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {result.entities.map(
                                                                (
                                                                    entity,
                                                                    idx,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                        style={{
                                                                            borderTop:
                                                                                '1px solid #f1f5f9',
                                                                        }}
                                                                        onMouseEnter={(
                                                                            e,
                                                                        ) =>
                                                                            (e.currentTarget.style.background =
                                                                                '#f8fafc')
                                                                        }
                                                                        onMouseLeave={(
                                                                            e,
                                                                        ) =>
                                                                            (e.currentTarget.style.background =
                                                                                'transparent')
                                                                        }
                                                                    >
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    '10px 16px',
                                                                                color: '#94a3b8',
                                                                                fontSize: 11,
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {idx +
                                                                                1}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    '10px 16px',
                                                                            }}
                                                                        >
                                                                            <EntityBadge
                                                                                fieldName={
                                                                                    entity.field_name
                                                                                }
                                                                                small
                                                                            />
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    '10px 16px',
                                                                                fontFamily:
                                                                                    'monospace',
                                                                                fontSize: 12,
                                                                                color: '#1e293b',
                                                                                maxWidth: 200,
                                                                                overflow:
                                                                                    'hidden',
                                                                                textOverflow:
                                                                                    'ellipsis',
                                                                                whiteSpace:
                                                                                    'nowrap',
                                                                            }}
                                                                        >
                                                                            {
                                                                                entity.text
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    '10px 16px',
                                                                                fontSize: 11,
                                                                                color: '#94a3b8',
                                                                                whiteSpace:
                                                                                    'nowrap',
                                                                            }}
                                                                        >
                                                                            {
                                                                                entity.start
                                                                            }
                                                                            –
                                                                            {
                                                                                entity.end
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div
                                                        style={{
                                                            padding:
                                                                '40px 20px',
                                                            textAlign: 'center',
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 32,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            ✓
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: 600,
                                                                color: '#374151',
                                                            }}
                                                        >
                                                            Không phát hiện dữ
                                                            liệu nhạy cảm
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 13,
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            Văn bản không chứa
                                                            thông tin cần bảo vệ
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* JSON accordion */}
                                    <div
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                setJsonOpen(!jsonOpen)
                                            }
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#374151',
                                            }}
                                        >
                                            <span>📄 Dữ liệu JSON thô</span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyJSON();
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        color: copied
                                                            ? '#059669'
                                                            : '#2563eb',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '3px 8px',
                                                        borderRadius: 6,
                                                        transition:
                                                            'background 0.15s',
                                                    }}
                                                >
                                                    <CopyIcon />{' '}
                                                    {copied
                                                        ? 'Đã sao chép!'
                                                        : 'Sao chép'}
                                                </button>
                                                <ChevronIcon open={jsonOpen} />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {jsonOpen && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    style={{
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <pre
                                                        style={{
                                                            margin: 0,
                                                            padding:
                                                                '12px 16px',
                                                            background:
                                                                '#0f172a',
                                                            color: '#94a3b8',
                                                            fontSize: 11,
                                                            fontFamily:
                                                                'monospace',
                                                            maxHeight: 240,
                                                            overflowY: 'auto',
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        {JSON.stringify(
                                                            result,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Empty state */}
                        {!result && !loading && !error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    background: '#fff',
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: 14,
                                    padding: '52px 24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        background:
                                            'linear-gradient(135deg, #dbeafe, #ede9fe)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        fontSize: 26,
                                    }}
                                >
                                    🔍
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#1e293b',
                                    }}
                                >
                                    Chờ văn bản để phân tích
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: '#94a3b8',
                                        marginTop: 6,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Nhập hoặc dán văn bản vào ô bên trái,
                                    <br />
                                    rồi nhấn <strong>Phân tích văn bản</strong>.
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer
                style={{
                    background: '#0f172a',
                    borderTop: '1px solid #1e293b',
                    padding: '24px',
                }}
            >
                <div
                    style={{
                        maxWidth: 1100,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background:
                                    'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ShieldIcon />
                        </div>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#e2e8f0',
                            }}
                        >
                            DataShield
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                            🔒 Dữ liệu không được lưu trữ hay chia sẻ
                        </span>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                            Hỗ trợ tuân thủ NĐ 13/2023/NĐ-CP
                        </span>
                    </div>
                </div>
            </footer>

            {/* Keyframes */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(5,150,105,0.2); }
                    50% { box-shadow: 0 0 0 5px rgba(5,150,105,0.1); }
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
