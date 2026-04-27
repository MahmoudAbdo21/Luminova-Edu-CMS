(function () {
    "use strict";

    // --- HARDCODED GITHUB URLS ---
    const DATA_URL = "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/2daa2ef06d410a633d01817e2cf33cd1cfa115e1/data.js";
    const EXAM_URL = "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/2daa2ef06d410a633d01817e2cf33cd1cfa115e1/exam.js";
    const CERTS_URL = "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/2daa2ef06d410a633d01817e2cf33cd1cfa115e1/certificates.js";

    // ==========================================
    // PART 1: Core Utilities, i18n, Icons, Atoms
    // ==========================================
    var { useState, useEffect, useMemo, useCallback } = window.React;
    var html = window.htm.bind(window.React.createElement);

    window.__LUMINOVA = { Core: {}, Components: {}, Pages: {}, Icons: {} };
    const Luminova = window.__LUMINOVA;

    Luminova.FOUNDER = {
        id: 's_founder_hardcoded', nameAr: 'محمود عبد الرحمن عبدالله', nameEn: 'Mahmoud Abdelrahman', isFounder: true, isVIP: true, isVerified: true,
        image: '../img/profile.png', majorAr: 'تكنولوجيا التعليم', majorEn: 'Educational Technology',
        socialLinks: { facebook: 'https://www.facebook.com/mahmoud.abdalrahaman.hagag', instagram: 'https://www.instagram.com/mahmoud_abdelrhman_1', linkedin: 'https://www.linkedin.com/in/mahmoud-hagag-145127346/' }
    };

    Luminova.getStudent = (id, studentsList) => {
        if (!id) return { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
        if (id === Luminova.FOUNDER.id || id === 's_founder' || id === 's_founder_hardcoded') return Luminova.FOUNDER;
        return (studentsList || []).find(s => s.id === id) || { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
    };

    Luminova.i18n = {
        ar: {
            appName: "Luminova Edu", home: "الرئيسية", community: "مجتمع الطلاب", academic: "المكتبة الأكاديمية",
            adminToggle: "الإدارة", founder: "المؤسس", vip: "مميز", verified: "موثوق", doctor: "دكتور",
            readMore: "عرض المزيد", readLess: "عرض أقل", searchPlaceholder: "ابحث هنا...", emptyState: "لا يوجد بيانات لعرضها.",
            years: "الفرق الدراسية", semesters: "الفصول الدراسية", subjects: "المواد الدراسية",
            summaries: "التلخيصات", quizzes: "الاختبارات", startQuiz: "بدء الاختبار", questions: "الأسئلة",
            quitWarning: "هل أنت متأكد من الخروج؟ سيتم فقدان التقدم.", score: "الدرجة",
            modelAnswer: "الإجابة النموذجية:", explanation: "التعليل:",
            deleteProtected: "لا يمكن الحذف.. الرجاء مسح المحتويات الداخلية أولاً",
            save: "حفظ", delete: "حذف", cancel: "إلغاء", exportData: "سحب الكود (Export initialData)",
            logout: "خروج الإدارة", passwordPrompt: "أدخل كلمة سر الإدارة:", wrongPassword: "كلمة السر خاطئة!",
            major: "التخصص", correct: "إجابة صحيحة", wrong: "إجابة خاطئة", results: "النتائج",
            topContributors: "شرف المساهمين 🏆", news: "أحدث الأخبار 📢", feed: "الخلاصة 🔥",
            certificates: "الشهادات والتوثيق"
        },
        en: {
            appName: "Luminova Edu", home: "Home", community: "Community", academic: "Academic Library",
            adminToggle: "Admin", founder: "Founder", vip: "VIP", verified: "Verified", doctor: "Doctor",
            readMore: "Read More", readLess: "Read Less", searchPlaceholder: "Search...", emptyState: "No data available.",
            years: "Academic Years", semesters: "Semesters", subjects: "Subjects",
            summaries: "Summaries", quizzes: "Quizzes", startQuiz: "Start Quiz", questions: "Questions",
            quitWarning: "Are you sure you want to quit? Progress will be lost.", score: "Score",
            modelAnswer: "Model Answer:", explanation: "Explanation:",
            deleteProtected: "Cannot delete. Please remove inner contents first.",
            save: "Save", delete: "Delete", cancel: "Cancel", exportData: "Export initialData Code",
            logout: "Admin Logout", passwordPrompt: "Enter admin password:", wrongPassword: "Wrong password!",
            major: "Major", correct: "Correct", wrong: "Wrong", results: "Results",
            topContributors: "Top Contributors 🏆", news: "Latest News 📢", feed: "The Feed 🔥",
            certificates: "Certificates Archive"
        }
    };

    Luminova.Icons = {
        User: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        Book: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
        Home: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        CheckCircle: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        XCircle: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        Trash: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        Edit: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        Facebook: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
        Instagram: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        LinkedIn: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
        VerifiedBlue: () => html`<svg className="w-5 h-5 absolute bottom-0 right-0 z-10 translate-x-1/4 translate-y-1/4 shadow-sm bg-white rounded-full p-[1px]" viewBox="0 0 24 24" fill="#1D9BF0" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 12.5C22.5 11.95 22.05 11.5 21.5 11.5L20.67 11.33C20.62 10.5 20.35 9.72 19.92 9L20.44 8.27C20.76 7.82 20.68 7.18 20.25 6.75L17.25 3.75C16.82 3.32 16.18 3.24 15.73 3.56L15 4.08C14.28 3.65 13.5 3.38 12.67 3.33L12.5 2.5C12.5 1.95 12.05 1.5 11.5 1.5H8.5C7.95 1.5 7.5 1.95 7.5 2.5L7.33 3.33C6.5 3.38 5.72 3.65 5 4.08L4.27 3.56C3.82 3.24 3.18 3.32 2.75 3.75L-0.25 6.75C-0.68 7.18 -0.76 7.82 -0.44 8.27L0.08 9C-0.35 9.72 -0.62 10.5 -0.67 11.33L-0.5 11.5C-0.5 12.05 -0.05 12.5 0.5 12.5H0.67C0.62 13.33 0.89 14.11 1.32 14.84L0.8 15.56C0.48 16.02 0.56 16.65 0.99 17.08L3.99 20.08C4.42 20.51 5.06 20.59 5.51 20.27L6.23 19.75C6.96 20.18 7.74 20.45 8.57 20.5L8.74 21.33C8.74 21.88 9.19 22.33 9.74 22.33H12.74C13.29 22.33 13.74 21.88 13.74 21.33L13.91 20.5C14.74 20.45 15.52 20.18 16.25 19.75L16.97 20.27C17.42 20.59 18.06 20.51 18.49 20.08L21.49 17.08C21.92 16.65 22.01 16.02 21.68 15.56L21.17 14.84C21.59 14.11 21.87 13.33 21.91 12.5H22.5ZM10.54 16.14L6.28 11.88L8.04 10.12L10.54 12.6L16.48 6.66L18.24 8.42L10.54 16.14Z" fill="white"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1D9BF0"/><path d="M16.966 8.404L10.3702 15L7.03403 11.6667L8.44825 10.2525L10.3702 12.1744L15.5518 6.98978L16.966 8.404Z" fill="white"/></svg>`
    };

    Luminova.Components = {};

    Luminova.Components.GlassCard = ({ children, className = "", onClick = null }) => {
        return html`
        <div onClick=${onClick} className=${`glass-card p-6 rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}>
            ${children}
        </div>
    `;
    };

    Luminova.Components.SmartText = ({ text, lang = 'ar', maxLength = 150 }) => {
        const [expanded, setExpanded] = useState(false);
        if (!text) return null;
        const isLong = text.length > maxLength;
        return html`
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <p className=${`whitespace-pre-line smart-text ${expanded ? 'expanded' : 'collapsed'}`}>
                ${expanded ? text : text.substring(0, maxLength) + (isLong ? '...' : '')}
            </p>
            ${isLong && html`
                <button onClick=${(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="inline-flex items-center mt-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-0.5 rounded-full font-bold text-xs transition-all border border-blue-200 dark:border-blue-700 cursor-pointer">
                    ${expanded ? Luminova.i18n[lang].readLess : Luminova.i18n[lang].readMore}
                </button>
            `}
        </div>
    `;
    };

    Luminova.Components.SmartMedia = ({ url, lang = 'ar' }) => {
        if (!url || (Array.isArray(url) && url.length === 0)) return null;

        const rawUrls = Array.isArray(url) ? url : [url];

        // 1. Normalize mixed arrays (strings/objects)
        // 2. Sort by custom order logically
        const sortedItems = rawUrls.map((item, idx) => {
            if (typeof item === 'string') return { url: item, titleAr: '', titleEn: '', order: idx, type: 'legacy' };
            return { ...item, order: item.order !== undefined ? item.order : idx };
        }).sort((a, b) => (a.order || 0) - (b.order || 0));

        return html`
        <div className="mt-6 w-full relative group space-y-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-DEFAULT to-brand-gold opacity-10 rounded-2xl blur transition duration-1000 group-hover:opacity-30 -z-10"></div>
            ${sortedItems.map((item, idx) => {
            if (!item || !item.url) return null;
            let embedContent = null;
            let urlStr = typeof item.url === 'string' ? item.url : String(item.url);
            const isBase64 = urlStr.startsWith('data:');
            const mimeMatch = isBase64 ? urlStr.match(/data:(.*?);/) : null;
            const mimeType = mimeMatch ? mimeMatch[1] : '';

            // Universal parsing logic: Treat non-http, non-data strings as relative paths
            const isRelative = !urlStr.startsWith('http') && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:') && !urlStr.startsWith('file://');

            // Regex Rules
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const ytMatch = urlStr.match(ytRegex);

            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${`https://www.youtube.com/embed/${videoId}` || 'about:blank'} title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" className="w-full h-[400px] border-none rounded-xl shadow-lg" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
            } else if (urlStr.includes('drive.google.com')) {
                const driveId = urlStr.match(/[-\w]{25,}/);
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${(driveId ? `https://drive.google.com/file/d/${driveId}/preview` : 'about:blank')} width="100%" height="500" allow="autoplay" className="rounded-xl shadow-lg border-2 border-brand-DEFAULT/20 bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
            } else if (urlStr.includes('docs.google.com/forms')) {
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${urlStr || 'about:blank'} width="100%" height="600" frameBorder="0" marginHeight="0" marginWidth="0" className="rounded-xl shadow-lg bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
            } else if (urlStr.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('image/'))) {
                embedContent = html`<div style=${{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }} className="w-full mb-4">
                        <img loading="lazy" src=${urlStr} alt="Smart Media" className="shadow-lg mx-auto rounded-xl cursor-pointer" onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))} style=${{ maxHeight: '400px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
                    </div>`;
            } else if (urlStr.match(/\.(mp3|wav|ogg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('audio/'))) {
                embedContent = html`<audio controls className="w-full shadow-lg rounded-xl mb-4 bg-gray-100 dark:bg-gray-800 p-2"><source src=${urlStr} type=${isBase64 ? mimeType : `audio/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الصوت.</audio>`;
            } else if (urlStr.match(/\.(mp4|webm)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('video/'))) {
                embedContent = html`<video controls className="w-full max-h-[500px] rounded-xl bg-black shadow-lg mb-4"><source src=${urlStr} type=${isBase64 ? mimeType : `video/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الفيديو.</video>`;
            } else if (urlStr.match(/\.pdf(\?.*)?$/i) || (isBase64 && mimeType === 'application/pdf')) {
                embedContent = html`<iframe src=${urlStr} width="100%" height="800px" style=${{ minHeight: '80vh' }} className="rounded-xl shadow-lg bg-white border-2 border-brand-DEFAULT/20" frameBorder="0" title="PDF Viewer"></iframe>`;
            } else {
                // Handle HTML and generic unknown links
                const isLocalHtml = urlStr.toLowerCase().endsWith('.html') || (isBase64 && mimeType === 'text/html');
                const isLocalFallback = urlStr.startsWith('file://') || isRelative;

                if (isLocalHtml) {
                    embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-4 relative z-10 w-full hover:shadow-2xl transition-all">
                            <iframe
                                src=${urlStr}
                                className="w-full h-[400px] border-none bg-white"
                                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                            ></iframe>
                            <div className="flex w-full divide-x divide-gray-700 rtl:divide-x-reverse border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))}
                                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-black transition-all flex items-center justify-center gap-2 border-none"
                                >
                                    <span className="text-xl leading-none">⛶</span>
                                    <span>${lang === 'ar' ? 'تكبير' : 'Enlarge'}</span>
                                </button>
                                <a
                                    href=${urlStr}
                                    target="_blank"
                                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-black transition-all flex items-center justify-center gap-2 no-underline"
                                >
                                    <span>${lang === 'ar' ? 'فتح بصفحة جديدة' : 'New Tab'}</span>
                                    <span className="text-xl leading-none">↗</span>
                                </a>
                            </div>
                        </div>
                        `;
                } else if (isLocalFallback) {
                    embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-4 relative z-10 w-full">
                            <div className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 bg-gray-50 dark:bg-gray-800">
                                <span style=${{ fontSize: '40px', lineHeight: 1 }}>📁</span>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center">${lang === 'ar' ? 'مرفق محلي' : 'Local Attachment'}</p>
                                <a href=${urlStr} target="_blank" className="mt-4 px-6 py-2 bg-brand-DEFAULT text-white rounded-full font-bold shadow-md hover:bg-brand-hover transition-colors">
                                    ${lang === 'ar' ? 'تنزيل / عرض الملف' : 'Download / View File'}
                                </a>
                            </div>
                        </div>
                        `;
                } else {
                    // General fallback for unknown web URLs
                    embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-4 relative z-10 w-full">
                            <iframe
                                src=${urlStr}
                                className="w-full h-[400px] border-none bg-white"
                                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                            ></iframe>
                            <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                                <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
                                    ${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}
                                </a>
                            </div>
                        </div>
                        `;
                }
            }

            const activeTitle = lang === 'ar' ? (item.titleAr || item.titleEn || item.title) : (item.titleEn || item.titleAr || item.title);
            const customTitle = typeof activeTitle === 'string' ? activeTitle.trim() : '';
            let titleBadge = null;

            if (customTitle) {
                const isArabicLang = lang === 'ar';
                const positionClass = isArabicLang ? "absolute -top-5 right-4 sm:right-6" : "absolute -top-5 left-4 sm:left-6";
                const dirAttr = isArabicLang ? "rtl" : "ltr";

                // Luxurious Nano Banana Pill Badge Overlay
                titleBadge = html`
                    <div className=${`${positionClass} z-20 pointer-events-none`} dir=${dirAttr}>
                        <div className="backdrop-blur-md bg-gray-900/80 dark:bg-black/80 border border-white/10 dark:border-white/5 shadow-xl shadow-black/20 rounded-xl px-4 py-2 flex items-center gap-3">
                            <span className="text-brand-gold text-lg drop-shadow-md">✨</span>
                            <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px] sm:max-w-md drop-shadow-sm flex-1" style=${{ direction: 'auto' }} title=${customTitle}>${customTitle}</span>
                        </div>
                    </div>`;
            }

            const padClass = titleBadge ? 'pt-2' : '';
            return html`<div key=${idx} className=${`w-full block relative hover:scale-[1.01] transition-transform duration-300 ${padClass}`}>${titleBadge}${embedContent}</div>`;
        })}
        </div>
    `;
    };


    Luminova.Components.SummaryCard = ({ item: rawItem, data, lang, onClose }) => {
        if (!rawItem) return null;
        const item = typeof rawItem === 'object' ? rawItem : ((data.summaries || []).find(s => s.id === rawItem) || (data.news || []).find(s => s.id === rawItem));
        if (!item) return html`<div className="text-center py-20 font-bold opacity-50">Content not found.</div>`;
        const author = Luminova.getStudent(item.studentId, data.students);
        const currentUrls = item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []);

        return html`
        <div className="animate-fade-in relative max-w-4xl mx-auto pb-20 mt-4 xl:mt-8 px-2 sm:px-4">
            <button onClick=${onClose} className="mb-6 flex items-center gap-2 text-brand-DEFAULT hover:text-brand-hover font-bold transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="text-xl">${lang === 'ar' ? '←' : '→'}</span>
                <span>${lang === 'ar' ? 'الرجوع للقائمة' : 'Back to Feed'}</span>
            </button>
            
            ${author && author.id !== 'unknown' && html`
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 mb-8">
                    <${Luminova.Components.Avatar} name=${author.nameAr || author.name} image=${author.image} isVIP=${author.isVIP} isVerified=${author.isVerified} isFounder=${author.isFounder} size="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-4 border-gray-50 dark:border-gray-900" />
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-xl sm:text-2xl text-brand-DEFAULT drop-shadow-sm">${lang === 'ar' ? (author.nameAr || author.name) : (author.nameEn || author.name)}</h3>
                            ${author.isVIP && html`<span className="text-xs text-brand-DEFAULT bg-brand-DEFAULT/10 px-3 py-1 rounded-full font-bold shadow-sm">VIP ✨</span>`}
                            ${author.isFounder && html`<span className="text-xs bg-brand-gold text-black shadow-lg px-3 py-1 rounded-full font-black tracking-widest">${Luminova.i18n[lang].founder}</span>`}
                            ${!author.isFounder && author.role === 'doctor' && html`<span className="text-xs bg-teal-500 text-white shadow-lg px-3 py-1 rounded-full font-black tracking-widest">🎓 ${lang === 'ar' ? 'دكتور' : 'Doctor'}</span>`}
                        </div>
                        <p className="text-sm font-bold opacity-60 text-gray-500 dark:text-gray-400 font-mono">${Luminova.formatDate(item.timestamp, lang)}</p>
                    </div>
                </div>
            `}

            <div className="mb-12 px-2 sm:px-6">
                <h1 className="text-3xl sm:text-5xl font-black mb-6 leading-tight text-gray-900 dark:text-white drop-shadow-sm">${item[`title${lang === 'ar' ? 'Ar' : 'En'}`] || item.titleAr || item.titleEn || item.title}</h1>
                <p className="whitespace-normal break-words text-lg sm:text-xl opacity-80 leading-relaxed font-semibold text-gray-700 dark:text-gray-300" style=${{ overflowWrap: 'anywhere', wordBreak: 'normal' }}>
                    ${item[`content${lang === 'ar' ? 'Ar' : 'En'}`] || item.contentAr || item.contentEn || item.text}
                </p>
            </div>

            ${currentUrls.length > 0 && html`
                <div className="space-y-12 bg-gray-50/50 dark:bg-gray-800/10 p-2 sm:p-8 rounded-3xl">
                    <div className="flex items-center gap-3 mb-8 px-4 sm:px-0">
                        <span className="text-3xl">📎</span>
                        <h3 className="text-2xl font-black text-indigo-500 drop-shadow-sm">${lang === 'ar' ? 'المرفقات والشروحات' : 'Attachments & Media'}</h3>
                    </div>
                    ${currentUrls.map((mUrl, i) => html`
                        <div key=${i} className="relative z-10 w-full hover:scale-[1.01] transition-transform duration-300">
                            ${currentUrls.length > 1 && html`<div className="absolute -top-4 -start-4 w-10 h-10 bg-indigo-500 text-white font-black rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900 z-20">${i + 1}</div>`}
                            <${Luminova.Components.SmartMedia} url=${mUrl} lang=${lang} />
                        </div>
                    `)}
                </div>
            `}
        </div>
        `;
    };

    Luminova.Components.Avatar = ({ name = "", nameEn = "", image = "", isVIP = false, isVerified = false, isFounder = false, size = "w-12 h-12" }) => {
        const getInitials = () => {
            // Enforce pulling from English name strictly if missing image 
            const targetName = (nameEn && nameEn.trim() !== '') ? nameEn : "ST";
            const words = targetName.trim().split(' ').filter(w => w);
            return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : targetName.substring(0, 2).toUpperCase();
        };
        return html`
        <div className="relative inline-block">
            <div className=${`relative ${size} flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden
                ${isFounder ? 'founder-card text-brand-gold bg-black' : isVIP ? 'vip-glow bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}>
                ${image ? html`<img src=${image} alt=${name} className="w-full h-full object-cover rounded-full" />` : getInitials()}
            </div>
            ${isVerified && !isFounder && html`<${Luminova.Icons.VerifiedBlue} />`}
        </div>
    `;
    };

    Luminova.Components.Input = ({ label, val, onChange, type = "text", placeholder = "" }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            ${type === 'checkbox' ? html`
                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 shadow-sm w-max">
                    <input type="checkbox" checked=${val || false} onChange=${(e) => onChange(e.target.checked)} className="w-6 h-6 accent-brand-DEFAULT rounded" />
                    <span className="font-bold">${label}</span>
                </label>
            ` : type === 'textarea' ? html`
                <textarea value=${val || ''} onChange=${(e) => onChange(e.target.value)} placeholder=${placeholder} className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border-2 dark:border-gray-700 focus:border-brand-DEFAULT outline-none shadow-sm min-h-[120px]" />
            ` : html`
                <input type=${type} value=${val || ''} onChange=${(e) => onChange(e.target.value)} placeholder=${placeholder} className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border-2 dark:border-gray-700 focus:border-brand-DEFAULT outline-none shadow-sm font-bold text-lg" />
            `}
        </div>
    `;
    };

    Luminova.Components.SocialInput = ({ label, val, onChange }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            <input type="url" value=${val || ''} onChange=${(e) => onChange(e.target.value)} className="w-full p-4 rounded-xl bg-white/50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 focus:border-brand-DEFAULT outline-none shadow-sm" placeholder="URL Link" />
        </div>
    `;
    };

    Luminova.Components.FileInput = ({ label, onFileLoaded, accept = "*/*" }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            <input type="file" accept=${accept} onChange=${(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => onFileLoaded(event.target.result);
                reader.readAsDataURL(file);
            }} className="w-full text-sm font-bold p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 focus:border-brand-DEFAULT outline-none cursor-pointer file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-DEFAULT file:text-white hover:file:bg-brand-hover transition-all shadow-sm" />
        </div>
    `;
    };

    Luminova.Components.SingleMediaRow = ({ val, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, idx }) => {
        const isLegacyString = typeof val === 'string';
        const urlStr = isLegacyString ? val : (val?.url || '');
        const titleAr = isLegacyString ? '' : (val?.titleAr || val?.title || '');
        const titleEn = isLegacyString ? '' : (val?.titleEn || '');
        const currentOrder = isLegacyString ? idx : (val?.order !== undefined ? val.order : idx);

        const initialType = urlStr ? (String(urlStr).startsWith('data:') ? 'base64' : (!String(urlStr).startsWith('http') ? 'local' : 'url')) : 'url';
        const [inputType, setInputType] = useState(initialType);

        const emitChange = (newUrl, newTitleAr, newTitleEn) => {
            onChange({ url: newUrl, titleAr: newTitleAr, titleEn: newTitleEn, order: currentOrder, type: inputType });
        };

        let inputContent = null;
        if (inputType === 'url') {
            inputContent = html`<${Luminova.Components.Input} label="رابط مباشر (URL YouTube, Drive, Image...)" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />`;
        } else if (inputType === 'base64') {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-400">سيتم حفظ الملف وتضمينه كـ Base64 ليعمل بدون إنترنت.</div>
                <${Luminova.Components.FileInput} label="رفع ملف (Upload File Base64)" accept="*/*" onFileLoaded=${v => emitChange(v, titleAr, titleEn)} />
            `;
        } else {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-400">مثال: file-html/lesson1/index.html أو files/document.pdf </div>
                <${Luminova.Components.Input} label="مسار ملف محلي (Local Path)" placeholder="example/path/index.html" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />
            `;
        }

        return html`
        <div className="flex flex-col gap-2 p-4 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl w-full hover:border-brand-DEFAULT/30 transition-colors">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-inner">
                    <button onClick=${() => setInputType('url')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'url' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>رابط (URL)</button>
                    <button onClick=${() => setInputType('base64')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'base64' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>ملف (Base64)</button>
                    <button onClick=${() => setInputType('local')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'local' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>مسار محلي</button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-inner">
                        <button onClick=${onMoveUp} disabled=${isFirst} className="px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300 shadow-sm" title="تحريك لأعلى (Move Up)">↑</button>
                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button onClick=${onMoveDown} disabled=${isLast} className="px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300 shadow-sm" title="تحريك لأسفل (Move Down)">↓</button>
                    </div>
                    <button onClick=${onRemove} className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm transition-all border border-red-500/20" title="حذف المرفق">✖</button>
                </div>
            </div>
            <div className="w-full flex flex-col gap-4 mt-2">
                ${inputContent}
                <div className="w-full pl-0 flex flex-col md:flex-row gap-4 border-t border-brand-DEFAULT/10 pt-4 mt-2">
                    <div className="flex-1 border-l-4 border-brand-DEFAULT/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="عنوان المرفق (عربي) - Optional" placeholder="مثال: فيديو شرح الدرس الأول..." val=${titleAr} onChange=${v => emitChange(urlStr, v, titleEn)} />
                    </div>
                    <div className="flex-1 border-l-4 border-brand-hover/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="Custom Title (English) - Optional" placeholder="e.g. Lesson One Video..." val=${titleEn} onChange=${v => emitChange(urlStr, titleAr, v)} />
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    Luminova.Components.UniversalMediaInput = ({ attachments = [], onChange, label = "إرفاق وسائط (Media Attachments)" }) => {
        // Enforce array safely and normalize items structurally
        const rawItems = Array.isArray(attachments) ? attachments : (attachments ? [attachments] : []);

        const sortedItems = rawItems.map((item, index) => {
            if (typeof item === 'string') return { url: item, titleAr: '', titleEn: '', order: index, type: 'legacy' };
            return { ...item, order: item.order !== undefined ? item.order : index };
        }).sort((a, b) => (a.order || 0) - (b.order || 0));

        const handleMove = (currentIndex, direction) => {
            if (direction === 'up' && currentIndex === 0) return;
            if (direction === 'down' && currentIndex === sortedItems.length - 1) return;

            const newArray = [...sortedItems];
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            // Swap semantic orders logically
            const tempOrder = newArray[currentIndex].order;
            newArray[currentIndex].order = newArray[targetIndex].order;
            newArray[targetIndex].order = tempOrder;

            // Re-sort and dispatch to update state universally
            newArray.sort((a, b) => (a.order || 0) - (b.order || 0));
            onChange(newArray);
        };

        const renderedItems = sortedItems.map((val, idx) => {
            return html`<${Luminova.Components.SingleMediaRow} key=${idx} idx=${idx} val=${val}
                isFirst=${idx === 0} isLast=${idx === sortedItems.length - 1}
                onMoveUp=${() => handleMove(idx, 'up')}
                onMoveDown=${() => handleMove(idx, 'down')}
                onChange=${(newVal) => {
                    const newArr = [...sortedItems];
                    newArr[idx] = newVal;
                    onChange(newArr);
                }} 
                onRemove=${() => {
                    const newArr = sortedItems.filter((_, i) => i !== idx);
                    onChange(newArr);
                }} 
            />`;
        });

        return html`
        <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner w-full space-y-4">
            <h4 className="font-black text-brand-DEFAULT border-b border-brand-DEFAULT/20 dark:border-gray-700 pb-3 flex items-center gap-2"><span>📎</span> ${label} <span className="bg-brand-DEFAULT text-white px-2.5 py-0.5 rounded-full text-xs shadow-sm">${sortedItems.length}</span></h4>
            <div className="flex flex-col gap-4 w-full">
                ${renderedItems}
            </div>
            <div className="flex justify-center pt-4">
                <button onClick=${() => onChange([...sortedItems, { url: '', titleAr: '', titleEn: '', order: sortedItems.length }])} className="px-8 py-3 bg-brand-DEFAULT/10 hover:bg-brand-DEFAULT text-brand-DEFAULT hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-brand-DEFAULT/30 border-dashed hover:border-solid">
                    <span className="text-xl">➕</span> إضافة مرفق جديد (Add Media Attachment)
                </button>
            </div>
        </div>
        `;
    };

    Luminova.Components.Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }) => {
        const variants = {
            primary: "bg-brand-DEFAULT text-white hover:bg-brand-hover",
            danger: "bg-red-500 text-white hover:bg-red-600",
            glass: "glass-card text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
        };
        return html`
        <button disabled=${disabled} onClick=${onClick} className=${`px-4 py-2 rounded-lg font-semibold transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}>
            ${children}
        </button>
    `;
    };

    Luminova.formatDate = (dateString, lang) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Loader component kept but no longer used in Suspense
    Luminova.Components.Loader = ({ lang = 'ar' }) => {
        return html`
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <p className="mt-6 text-xl font-bold opacity-80 text-brand-DEFAULT animate-pulse tracking-widest">${lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
        `;
    };

    Luminova.Components.CustomDropdown = ({ options, value, onChange, placeholder, className = "" }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => String(o.value) === String(value)) || null;

        return html`
        <div className=${`relative ${className}`}>
            <button onClick=${() => setIsOpen(!isOpen)} onBlur=${() => setTimeout(() => setIsOpen(false), 200)}
                className="w-full appearance-none bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-4 py-3.5 outline-none transition-all cursor-pointer shadow-sm font-bold flex justify-between items-center z-10 relative"
            >
                <span className=${selectedOption ? 'opacity-100' : 'opacity-70'}>
                    ${selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className=${`transition-transform duration-300 transform opacity-50 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            ${isOpen && html`
                <div className="absolute top-full left-0 right-0 mt-2 z-[999] animate-fade-in backdrop-blur-xl bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                    <ul className="py-2 flex flex-col m-0 p-0">
                        ${options.map(opt => html`
                            <li key=${opt.value} 
                                onClick=${() => { onChange(opt.value); setIsOpen(false); }}
                                className=${`px-5 py-3 cursor-pointer transition-colors font-bold ${String(value) === String(opt.value) ? 'bg-brand-DEFAULT/20 text-brand-gold' : 'text-slate-300 hover:bg-brand-DEFAULT/20 hover:text-white'}`}
                            >
                                ${opt.label}
                            </li>
                        `)}
                    </ul>
                </div>
            `}
        </div>
        `;
    };

    Luminova.Components.TabletPortraitOverlay = ({ lang }) => {
        const [showOverlay, setShowOverlay] = useState(false);
        const [ignoreOrientation, setIgnoreOrientation] = useState(false);

        useEffect(() => {
            const checkOrientation = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                // Target generic tablet boundaries in portrait (width between 768 and 1024, height > width)
                if (width >= 768 && width <= 1024 && height > width) {
                    setShowOverlay(true);
                } else {
                    setShowOverlay(false);
                }
            };
            checkOrientation();
            window.addEventListener('resize', checkOrientation);
            return () => window.removeEventListener('resize', checkOrientation);
        }, []);

        if (!showOverlay || ignoreOrientation) return null;

        return html`
        <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-slate-900/95 text-white animate-fade-in" dir=${lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col items-center text-center max-w-lg w-full">
                <!-- Rotating Tablet Icon CSS Animation -->
                <style>
                    ${`
                    @keyframes rotateTabletOS {
                        0% { transform: rotate(0deg) scale(1); }
                        25% { transform: rotate(90deg) scale(1.1); }
                        50% { transform: rotate(90deg) scale(1.1); box-shadow: 0 0 30px rgba(6,182,212,0.6); }
                        75% { transform: rotate(0deg) scale(1); }
                        100% { transform: rotate(0deg) scale(1); }
                    }
                    `}
                </style>
                <div style=${{
                width: '120px', height: '170px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.5))',
                border: '6px solid white',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }} className="mb-8 relative animate-[rotateTabletOS_4s_cubic-bezier(0.4,0,0.2,1)_infinite]">
                    <!-- Tablet Home Button / Camera Indication -->
                    <div style=${{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '2px', position: 'absolute', bottom: '10px' }}></div>
                    <div style=${{ width: '8px', height: '8px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', position: 'absolute', top: '10px' }}></div>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black mb-6 leading-tight bg-gradient-to-r from-brand-gold to-yellow-200 bg-clip-text text-transparent drop-shadow-md">
                    ${lang === 'ar' ? 'للحصول على أفضل تجربة تصفح، يرجى تدوير التابلت أو الآيباد إلى الوضع العرضي' : 'For the best browsing experience, please rotate your tablet/iPad to landscape mode'}
                </h2>
                <button onClick=${() => setIgnoreOrientation(true)} className="mt-8 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 text-xl">
                    ${lang === 'ar' ? 'إكمال على أي حال' : 'Continue anyway'}
                </button>
            </div>
        </div>
        `;
    };

    // END OF PART 1

    // ==========================================
    // PART 2: Lazy Pages + App Shell Router
    // (All pages loaded on-demand via changeView)
    // ==========================================


    const routeMap = {
        'home': 'js/pages/main-views.js',
        'community': 'js/pages/main-views.js',
        'academics': 'js/pages/main-views.js',
        'quiz': 'js/pages/quiz-engine.js',
        'cms': 'js/pages/admin-cms.js',
        'certificates': 'js/pages/certificate-engine.js'
    };

    const App = () => {
        const fallbackData = window.initialData || window.LUMINOVA_DATA || {};

        // الاعتماد الحصري على data.js كمصدر وحيد وتجاهل التخزين المحلي
        // quizzes start as [] — exam.js is lazy-loaded in the background on mount
        const [data, setData] = useState(() => {
            return { ...fallbackData, quizzes: [] };
        });

        const [lang, setLang] = useState(data.settings?.language || 'ar');
        const [view, setView] = useState('home');
        const [previousView, setPreviousView] = useState('home');
        const [activeQuiz, setActiveQuiz] = useState(null);
        const [activeSummary, setActiveSummary] = useState(null);
        const [clickCount, setClickCount] = useState(0);
        const [isNavigating, setIsNavigating] = useState(false);
        const [showAdminAuth, setShowAdminAuth] = useState(false);
        const [adminPwd, setAdminPwd] = useState('');
        const [adminPwdError, setAdminPwdError] = useState(false);
        const [showSplash, setShowSplash] = useState(true);

        // Sentinel: true while a popstate-triggered navigation is in progress.
        // Prevents changeView from pushing a duplicate history entry.
        const isPopNavRef = window.React.useRef(false);

        // MUST be defined before any useEffect that calls it
        const changeView = useCallback(async (newView) => {
            if (routeMap[newView]) {
                setIsNavigating(true);
                try {
                    await new Promise((resolve, reject) => {
                        const existing = document.querySelector(`script[data-lmv-page="${newView}"]`);
                        if (existing) return resolve();
                        const script = document.createElement('script');
                        script.src = routeMap[newView] + '?v=2';
                        script.setAttribute('data-lmv-page', newView);
                        script.onload = resolve;
                        script.onerror = () => { console.error('Failed to load:', newView); resolve(); };
                        document.body.appendChild(script);
                    });
                } catch (error) {
                    console.error('Route load error:', error);
                }
                setIsNavigating(false);
            }

            // Shallow History: push state only for detail/overlay views, and only
            // when this navigation was NOT triggered by a popstate (back-button).
            const isDetailView = ['summaryDetail', 'quiz', 'cms', 'certificates'].includes(newView);
            if (isDetailView && !isPopNavRef.current) {
                window.history.pushState({ lmv: newView }, '', '');
            }
            isPopNavRef.current = false; // reset sentinel after every navigation

            setView(prev => { setPreviousView(prev); return newView; });
        }, []);


        // Task 2: Scroll Restoration — scroll to top on every primary view change
        useEffect(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, [view]);

        useEffect(() => {
            const root = document.documentElement;
            if (data.settings?.theme === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
            root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
            root.setAttribute('lang', lang);
        }, [data.settings?.theme, lang]);

        useEffect(() => {
            const t = setTimeout(() => setShowSplash(false), 2500);
            return () => clearTimeout(t);
        }, []);

        // Shallow History: listen for hardware/browser back-button
        useEffect(() => {
            const onPopState = () => {
                isPopNavRef.current = true; // signal changeView to NOT push again
                // Dispatch a custom event that sub-pages (academics, community) can
                // listen to for closing their own internal detail views.
                const handled = window.dispatchEvent(new CustomEvent('lmv:popstate', { cancelable: true }));
                // If no sub-page cancelled the event, handle at top-level
                if (handled !== false) {
                    setView(prev => {
                        const detailViews = ['summaryDetail', 'quiz', 'cms', 'certificates'];
                        if (detailViews.includes(prev)) {
                            // Return to the logical parent
                            if (prev === 'summaryDetail') return previousView !== 'summaryDetail' ? previousView : 'home';
                            if (prev === 'quiz') return 'academics';
                            if (prev === 'cms') return 'home';
                            if (prev === 'certificates') return 'home';
                        }
                        // Already on a root view — do nothing, let the browser handle normally
                        return prev;
                    });
                }
            };
            window.addEventListener('popstate', onPopState);
            return () => window.removeEventListener('popstate', onPopState);
        }, [previousView]);

        const handleLogoClick = () => {
            setClickCount(prev => prev + 1);
            setTimeout(() => setClickCount(0), 4000);
        };

        useEffect(() => {
            if (clickCount >= 5) {
                setClickCount(0);
                setAdminPwd('');
                setAdminPwdError(false);
                setShowAdminAuth(true);
            }
        }, [clickCount]);

        const handleAdminSubmit = () => {
            if (adminPwd === 'admin') {
                setShowAdminAuth(false);
                setAdminPwd('');
                setAdminPwdError(false);
                changeView('cms');
            } else {
                setAdminPwdError(true);
            }
        };

        const handleAdminCancel = () => {
            setShowAdminAuth(false);
            setAdminPwd('');
            setAdminPwdError(false);
        };

        const toggleTheme = () => {
            setData(prev => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'dark' ? 'light' : 'dark' } }));
        };

        const toggleLang = () => {
            const newLang = lang === 'ar' ? 'en' : 'ar';
            setLang(newLang);
            setData(prev => ({ ...prev, settings: { ...prev.settings, language: newLang } }));
        };

        useEffect(() => {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('verify')) {
                changeView('certificates');
            } else {
                changeView('home');
            }

            // Silently pre-fetch exam.js in the background after initial paint.
            // Uses a dedicated script-injection loader defined inside exam.js.
            const fetchExams = () => {
                if (window.LUMINOVA_EXAMS) {
                    // Already loaded (e.g. cached by browser)
                    setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS }));
                    return;
                }
                const script = document.createElement('script');
                script.src = 'exam.js?v=2';
                script.setAttribute('data-lmv-page', 'exam');
                script.onload = () => {
                    setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS || [] }));
                };
                script.onerror = () => console.warn('Luminova: exam.js failed to load.');
                document.body.appendChild(script);
            };
            fetchExams();
        }, []);

        const renderView = () => {
            switch (view) {
                case 'summaryDetail': return html`<${Luminova.Components.SummaryCard} item=${activeSummary} data=${data} lang=${lang} onClose=${() => window.history.back()} />`;
                case 'quiz': return Luminova.Pages.QuizEngine ? html`<${Luminova.Pages.QuizEngine} quiz=${activeQuiz} data=${data} lang=${lang} goBack=${() => window.history.back()} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'cms': return Luminova.Pages.AdminCMS ? html`<${Luminova.Pages.AdminCMS} data=${data} setData=${setData} lang=${lang} goBack=${() => window.history.back()} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'community': return Luminova.Pages.StudentCommunityPage ? html`<${Luminova.Pages.StudentCommunityPage} data=${data} lang=${lang} setView=${changeView} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'academics': return Luminova.Pages.AcademicHierarchyPage ? html`<${Luminova.Pages.AcademicHierarchyPage} data=${data} lang=${lang} setView=${changeView} setActiveQuiz=${setActiveQuiz} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'certificates': return Luminova.Pages.CertificateArchivePage ? html`<${Luminova.Pages.CertificateArchivePage} lang=${lang} goBack=${() => window.history.back()} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                default: return Luminova.Pages.HomePage ? html`<${Luminova.Pages.HomePage} data=${data} lang=${lang} setView=${changeView} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
            }
        };

        return html`
        <div className="min-h-screen lmv-page-wrapper">

            <!-- Splash Screen Intro -->
            <div style=${{
                position: 'fixed', inset: 0, zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a0a2e 100%)',
                pointerEvents: showSplash ? 'all' : 'none',
                opacity: showSplash ? 1 : 0,
                transition: 'opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <div style=${{ textAlign: 'center', animation: 'lmv-splash-in 1s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
                    <div style=${{
                width: '72px', height: '72px',
                background: 'linear-gradient(135deg, #06b6d4, #f59e0b)',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: '38px',
                boxShadow: '0 0 60px rgba(6,182,212,0.5), 0 0 120px rgba(245,158,11,0.2)',
                margin: '0 auto 24px',
            }}>L</div>
                    <p style=${{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                fontWeight: 900,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #ffffff 0%, #06b6d4 40%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0, lineHeight: 1.1,
                filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.4))',
            }}>LUMINOVA</p>
                    <p style=${{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                color: 'rgba(148,163,184,0.7)',
                fontSize: '0.8rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                marginTop: '12px',
                fontWeight: 600,
            }}>Educational Platform</p>
                </div>
                <style>{'@keyframes lmv-splash-in { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }'}</style>
            </div>

            <!-- Task 4: Tablet Portrait Overlay -->
            <${Luminova.Components.TabletPortraitOverlay} lang=${lang} />

            <!-- Admin Auth Modal -->
            ${showAdminAuth && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                    onClick=${(e) => { if (e.target === e.currentTarget) handleAdminCancel(); }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.35)] p-8 w-full max-w-sm border border-white/30 dark:border-slate-700 animate-fade-in">
                        <div className="flex flex-col items-center mb-6">
                            <div style=${{ width: '56px', height: '56px', background: 'linear-gradient(135deg,#06b6d4,#f59e0b)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '28px', boxShadow: '0 4px 20px rgba(6,182,212,0.4)', marginBottom: '16px' }}>L</div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">${lang === 'ar' ? 'دخول الإدارة' : 'Admin Access'}</h2>
                            <p className="text-sm opacity-50 font-bold mt-1">${lang === 'ar' ? 'أدخل كلمة السر للمتابعة' : 'Enter password to continue'}</p>
                        </div>

                        <div className="relative mb-2">
                            <span className="absolute inset-y-0 start-4 flex items-center opacity-40 text-xl pointer-events-none">🔑</span>
                            <input
                                id="admin-password-input"
                                type="password"
                                autoFocus
                                value=${adminPwd}
                                onChange=${(e) => { setAdminPwd(e.target.value); setAdminPwdError(false); }}
                                onKeyDown=${(e) => e.key === 'Enter' && handleAdminSubmit()}
                                placeholder=${lang === 'ar' ? 'كلمة السر...' : 'Password...'}
                                className=${`w-full px-12 py-4 rounded-2xl font-bold text-gray-800 dark:text-white bg-slate-100 dark:bg-slate-900 outline-none transition-all duration-300 text-base ${adminPwdError ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:ring-2 focus:ring-brand-DEFAULT'}`}
                            />
                        </div>
                        ${adminPwdError && html`
                            <p className="text-red-500 font-bold text-sm text-center mb-3 animate-fade-in">
                                ${lang === 'ar' ? '❌ كلمة السر خاطئة، حاول مجدداً' : '❌ Wrong password, try again'}
                            </p>
                        `}

                        <div className="flex gap-3 mt-5">
                            <button
                                id="admin-modal-cancel"
                                onClick=${handleAdminCancel}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-all"
                            >${lang === 'ar' ? 'تراجع' : 'Cancel'}</button>
                            <button
                                id="admin-modal-submit"
                                onClick=${handleAdminSubmit}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-gradient-to-r from-brand-DEFAULT to-brand-gold text-white shadow-lg hover:opacity-90 hover:shadow-brand-DEFAULT/40 transition-all"
                            >${lang === 'ar' ? 'دخول' : 'Enter'}</button>
                        </div>
                    </div>
                </div>
            `}
            ${view !== 'fullscreenViewer' && html`
                <!-- Slim loading bar at top (shown during page transitions) -->
                ${isNavigating ? html`<div key="loading-bar" className="lmv-loading-bar"></div>` : null}

                <nav key="top-nav" style=${{ position: 'sticky', top: 0, zIndex: 40 }} className="glass-card px-3 sm:px-8 py-3 sm:py-4 mb-10 flex items-center gap-2 rounded-none border-t-0 border-r-0 border-l-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">

                <!-- Logo (シ) icon only — always visible on all screens -->
                <div style=${{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, cursor: 'pointer', zIndex: 10 }} className="group hover:opacity-90" onClick=${handleLogoClick}>
                    <div style=${{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #f59e0b)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '22px', boxShadow: '0 4px 15px rgba(6,182,212,0.4)', flexShrink: 0 }} className="group-hover:scale-110 transition-transform">L</div>
                    <!-- Platform name: hidden on mobile (shown in center), visible on desktop -->
                    <span className="hidden sm:inline font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-DEFAULT to-brand-gold" style=${{ fontSize: '1.2rem', whiteSpace: 'nowrap', fontWeight: '900' }}>
                        ${lang === 'ar' ? 'لومينوفا التعليمية' : 'Luminova Edu'}
                    </span>
                </div>

                <!-- Center: Platform name on MOBILE only (fills the empty space) -->
                <!-- On desktop this is replaced by the nav links -->
                ${view !== 'cms' && view !== 'quiz' ? html`
                    <!-- Desktop nav links (hidden on mobile) -->
                    <div key="dt-nav" className="lmv-top-nav-links hidden md:flex items-center gap-1 mx-auto">
                        <button onClick=${() => changeView('home')} title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}
                            className=${`px-4 py-2.5 rounded-2xl transition-all duration-200 flex gap-2 items-center font-bold text-base flex-shrink-0 ${view === 'home' ? 'text-brand-DEFAULT bg-brand-DEFAULT/15 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <${Luminova.Icons.Home} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                        </button>
                        <button onClick=${() => changeView('community')} title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}
                            className=${`px-4 py-2.5 rounded-2xl transition-all duration-200 flex gap-2 items-center font-bold text-base flex-shrink-0 ${view === 'community' ? 'text-brand-DEFAULT bg-brand-DEFAULT/15 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <${Luminova.Icons.User} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                        </button>
                        <button onClick=${() => changeView('academics')} title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}
                            className=${`px-4 py-2.5 rounded-2xl transition-all duration-200 flex gap-2 items-center font-bold text-base flex-shrink-0 ${view === 'academics' ? 'text-brand-DEFAULT bg-brand-DEFAULT/15 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <${Luminova.Icons.Book} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                        </button>
                    </div>
                    <!-- Mobile: Platform name in center (visible only on mobile) -->
                    <div key="mb-nav" className="flex md:hidden flex-1 justify-center">
                        <span style=${{ fontWeight: '900', fontSize: '1.1rem', whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #06b6d4, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            ${lang === 'ar' ? 'لومينوفا التعليمية' : 'Luminova Edu'}
                        </span>
                    </div>
                ` : html`<div key="empty-nav" className="flex-1"></div>`}

                <!-- Right controls -->
                <div style=${{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button onClick=${toggleLang}
                        className="font-black text-sm border-2 border-brand-DEFAULT text-brand-DEFAULT px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-brand-DEFAULT hover:text-white transition-all shadow-sm flex-shrink-0">
                        ${lang === 'ar' ? 'EN' : 'AR'}
                    </button>
                    <button onClick=${toggleTheme}
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-lg sm:text-xl shadow-inner flex-shrink-0" title="Toggle Theme">
                        ${data.settings?.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>
            `}

            <main className=${`container mx-auto px-4 pb-20 sm:pb-8 max-w-[1600px] ${view === 'fullscreenViewer' ? 'hidden' : ''}`}>
                ${renderView()}
            </main>

            <!-- Mobile Bottom Navigation Bar (hidden on desktop via CSS) -->
            ${view !== 'cms' && view !== 'quiz' && html`
                <nav key="bottom-nav-container" className="lmv-bottom-nav" aria-label=${lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
                    <button className=${`lmv-bottom-nav-btn ${view === 'home' ? 'active' : ''}`} onClick=${() => changeView('home')} title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}>
                        <${Luminova.Icons.Home} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                    </button>
                    <button className=${`lmv-bottom-nav-btn ${view === 'academics' ? 'active' : ''}`} onClick=${() => changeView('academics')} title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}>
                        <${Luminova.Icons.Book} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                    </button>
                    <button className=${`lmv-bottom-nav-btn ${view === 'community' ? 'active' : ''}`} onClick=${() => changeView('community')} title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}>
                        <${Luminova.Icons.User} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                    </button>
                </nav>
            `}
        </div>
    `;
    };


    Luminova.Pages.AdminCMS = ({ data, setData, lang, goBack }) => {
        const validTabs = ['news', 'years', 'semesters', 'subjects', 'students', 'summaries', 'quizzes', 'certificates'];
        const [activeTab, setActiveTab] = useState('news');
        const [editingItem, setEditingItem] = useState(null);
        const [subView, setSubView] = useState(''); // '' or 'questions'
        const [qItem, setQItem] = useState(null); // Extracted dynamically to fix rules of hooks crash
        const [cmsSearchQuery, setCmsSearchQuery] = useState('');

        const [isTranslating, setIsTranslating] = useState(false);

        const translateText = async (arabicText) => {
            if (!arabicText || !arabicText.trim()) return '';
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(arabicText)}&langpair=ar|en`);
                const resData = await response.json();
                const result = resData.responseData?.translatedText || '';
                // Task 3: Arabic Leakage Filter
                // If the "translated" result still contains Arabic characters, the API failed silently.
                // Reject it and return '' to avoid duplicating Arabic text into English fields.
                const containsArabic = /[\u0600-\u06FF]/.test(result);
                if (containsArabic) {
                    console.warn('Luminova: Translation API returned Arabic text — rejecting result.');
                    return '';
                }
                return result;
            } catch (error) {
                console.error('Translation failed:', error);
                return '';
            }
        };

        const handleAutoTranslate = async () => {
            if (!editingItem) return;
            setIsTranslating(true);
            try {
                let updates = { ...editingItem };

                if (activeTab === 'news' || activeTab === 'summaries') {
                    if (updates.titleAr && !updates.titleEn) updates.titleEn = await translateText(updates.titleAr);
                    if (updates.contentAr && !updates.contentEn) updates.contentEn = await translateText(updates.contentAr);

                    if (updates.mediaUrls && Array.isArray(updates.mediaUrls)) {
                        updates.mediaUrls = await Promise.all(updates.mediaUrls.map(async (media) => {
                            if (typeof media === 'object' && media.titleAr && !media.titleEn) {
                                return { ...media, titleEn: await translateText(media.titleAr) };
                            }
                            return media;
                        }));
                    }
                } else if (activeTab === 'quizzes') {
                    const titleToTranslate = updates.titleAr || updates.title;
                    if (titleToTranslate && !updates.titleEn) updates.titleEn = await translateText(titleToTranslate);
                } else if (activeTab === 'certificates') {
                    if (updates.title) updates.titleEn = await translateText(updates.title);
                    if (updates.description) updates.descriptionEn = await translateText(updates.description);
                    if (updates.senderName) updates.senderNameEn = await translateText(updates.senderName);
                    if (updates.studentName) updates.studentNameEn = await translateText(updates.studentName);
                    if (updates.senderRole) updates.senderRoleEn = await translateText(updates.senderRole);
                } else if (['years', 'semesters', 'subjects', 'students'].includes(activeTab)) {
                    if (updates.nameAr && !updates.nameEn) updates.nameEn = await translateText(updates.nameAr);
                    if (activeTab === 'students') {
                        if (updates.bioAr && !updates.bioEn) updates.bioEn = await translateText(updates.bioAr);
                        if (updates.majorAr && !updates.majorEn) updates.majorEn = await translateText(updates.majorAr);
                    }
                }
                setEditingItem(updates);
            } catch (error) {
                alert(lang === 'ar' ? '❌ فشلت الترجمة، تحقق من الاتصال' : '❌ Translation failed, check connection');
            } finally {
                setIsTranslating(false);
            }
        };


        const [cmsVisibleCount, setCmsVisibleCount] = useState(15);
        const [filterYear, setFilterYear] = useState('');
        const [filterSem, setFilterSem] = useState('');
        const [filterSub, setFilterSub] = useState('');

        useEffect(() => {
            setCmsVisibleCount(['subjects', 'summaries', 'quizzes'].includes(activeTab) ? 10 : 15);
            setFilterYear('');
            setFilterSem('');
            setFilterSub('');
            setCmsSearchQuery('');

            // Lazy-load certificates.js when the certificates tab is activated
            if (activeTab === 'certificates' && !data.certificates) {
                if (window.loadCertificatesData) {
                    window.loadCertificatesData().then(certs => {
                        setData(prev => ({ ...prev, certificates: certs }));
                    });
                } else {
                    const script = document.createElement('script');
                    script.src = 'js/pages/certificate-engine.js?v=' + Date.now();
                    script.onload = () => {
                        if (window.loadCertificatesData) {
                            window.loadCertificatesData().then(certs => {
                                setData(prev => ({ ...prev, certificates: certs }));
                            });
                        }
                    };
                    document.body.appendChild(script);
                }
            }

            // Lazy-load exam.js when the quizzes tab is activated
            if (activeTab === 'quizzes' && (!data.quizzes || data.quizzes.length === 0)) {
                if (window.LUMINOVA_EXAMS && window.LUMINOVA_EXAMS.length > 0) {
                    setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS }));
                } else {
                    const existing = document.querySelector('script[data-lmv-page="exam"]');
                    if (!existing) {
                        const script = document.createElement('script');
                        script.src = 'exam.js?v=2';
                        script.setAttribute('data-lmv-page', 'exam');
                        script.onload = () => {
                            setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS || [] }));
                        };
                        document.body.appendChild(script);
                    }
                }
            }
        }, [activeTab]);

        const studentsWithFounder = [Luminova.FOUNDER, ...(data.students || []).filter(s => !s.isFounder)];

        // ==========================================
        // 3-PILLAR EXPORT ENGINE
        // ==========================================

        // Export 1 — data.js: core platform data ONLY (no quizzes, no certificates)
        const handleExportData = () => {
            const { certificates, quizzes, ...coreData } = data;
            const str = `window.LUMINOVA_DATA = ${JSON.stringify(coreData, null, 2)};`;
            const blob = new Blob([str], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.js';
            a.click();
            URL.revokeObjectURL(url);
        };

        // Export 2 — certificates.js: certificate array ONLY
        const handleExportCertificates = () => {
            const certs = data.certificates || [];
            const str = `window.LUMINOVA_CERTIFICATES = ${JSON.stringify(certs, null, 2)};`;
            const blob = new Blob([str], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificates.js';
            a.click();
            URL.revokeObjectURL(url);
        };

        // Export 3 — exam.js: quiz/exam array ONLY
        const handleExportExams = () => {
            const exams = data.quizzes || [];
            const str = `window.LUMINOVA_EXAMS = ${JSON.stringify(exams, null, 2)};`;
            const blob = new Blob([str], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'exam.js';
            a.click();
            URL.revokeObjectURL(url);
        };


        const handleDelete = (collection, id) => {
            if (collection === 'years' && data.semesters.some(s => s.yearId === id)) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'semesters' && data.subjects.some(s => s.semesterId === id)) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'subjects' && (data.summaries.some(s => s.subjectId === id) || data.quizzes.some(q => q.subjectId === id))) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'students' && (data.summaries.some(s => s.studentId === id) || data.quizzes.some(q => (q.questions || []).some(qn => qn.studentId === id)))) return alert(Luminova.i18n[lang].deleteProtected);

            if (confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm deletion?')) {
                setData(prev => ({ ...prev, [collection]: prev[collection].filter(item => item.id !== id) }));
            }
        };

        const handleSave = () => {
            if (!editingItem) return;
            editingItem.timestamp = editingItem.timestamp || new Date().toISOString();
            if (activeTab === 'certificates') {
                editingItem.date = editingItem.date || editingItem.timestamp;
            }
            setData(prev => {
                const isExisting = prev[activeTab].find(i => i.id === editingItem.id);
                const newList = isExisting
                    ? prev[activeTab].map(i => i.id === editingItem.id ? editingItem : i)
                    : [editingItem, ...prev[activeTab]];
                if (!window.CMS_EDITOR_ADDED_IDS) window.CMS_EDITOR_ADDED_IDS = [];
                if (!isExisting) window.CMS_EDITOR_ADDED_IDS.push(editingItem.id);

                // CRITICAL FIX: Ensure the public API sees the newly saved certificates
                if (activeTab === 'certificates') {
                    window.LUMINOVA_CERTIFICATES = newList;
                }

                return { ...prev, [activeTab]: newList };
            });
            setEditingItem(null);
        };

        const handleSubSave = (newQ) => {
            const updatedQ = newQ.id ? editingItem.questions.map(q => q.id === newQ.id ? newQ : q) : [...(editingItem.questions || []), { ...newQ, id: `q_${Date.now()}` }];
            const updatedQuiz = { ...editingItem, questions: updatedQ };
            setEditingItem(updatedQuiz);
            setSubView('questionsList');

            // Auto-save question changes to DB instantly
            setData(prev => {
                const newList = prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i);
                return { ...prev, [activeTab]: newList };
            });
        };

        const getNewTemplate = () => {
            const base = { id: `${activeTab}_${Date.now()}`, timestamp: new Date().toISOString() };
            if (activeTab === 'news') return { ...base, titleAr: '', titleEn: '', contentAr: '', contentEn: '', mediaUrl: '' };
            if (activeTab === 'students') return { ...base, nameAr: 'عبد المنعم حجاج', nameEn: 'Abdelmonem Hagag', majorAr: '', majorEn: '', bioAr: '', bioEn: '', image: '', isVIP: false, isVerified: false, role: 'student', socialLinks: { facebook: '', instagram: '', linkedin: '' } };
            if (activeTab === 'years' || activeTab === 'semesters' || activeTab === 'subjects') return { ...base, nameAr: '', nameEn: '', yearId: '', semesterId: '' };
            if (activeTab === 'summaries') return { ...base, titleAr: '', titleEn: '', contentAr: '', contentEn: '', mediaUrl: '', subjectId: '', studentId: '' };
            if (activeTab === 'quizzes') return { ...base, titleAr: '', titleEn: '', isShuffled: false, feedbackMode: 'end', subjectId: '', publisherId: '', questions: [], examMode: 'practice', emailPolicy: 'none', adminEmails: '', startTime: '', endTime: '', latePolicy: 'hard_stop', allowBackNavigation: true };
            if (activeTab === 'certificates') return { ...base, studentName: '', studentNameEn: '', senderName: '', senderNameEn: '', senderRole: 'doctor', title: '', titleEn: '', description: '', descriptionEn: '', isFeatured: false, badges: [], date: base.timestamp };
            return base;
        };

        // Using global Inputs inside AdminCMS to prevent transient React rendering issues Focus Drop.

        // ---------------- QUESTIONS SUB-VIEW BUILDER ----------------
        if (subView === 'questionsList' || subView === 'editQuestion') {

            if (subView === 'editQuestion') {
                const tempQ = qItem || { type: 'mcq', text: '', score: 1, options: ['', '', '', ''], correctAnswers: [0], modelAnswer: '', explanation: '', studentId: Luminova.FOUNDER.id, showExp: false };
                return html`
                <div className="animate-fade-in pb-20 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        <h2 className="text-3xl font-bold text-brand-DEFAULT">${tempQ.id ? 'تعديل سؤال (Edit)' : 'سؤال جديد (New)'}</h2>
                        <${Luminova.Components.Button} onClick=${() => setSubView('questionsList')}>${Luminova.i18n[lang].cancel}</${Luminova.Components.Button}>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-4">
                             <div className="grid grid-cols-3 gap-4">
                                 <div className="col-span-1">
                                     <label className="block text-sm font-black mb-2 opacity-80">نوع السؤال (Type)</label>
                                     <select value=${tempQ.type || 'mcq'} onChange=${e => setQItem({ ...tempQ, type: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold outline-none">
                                         <option value="mcq">اختيار من متعدد (إجابة واحدة)</option>
                                         <option value="multi_select">اختيار من متعدد (عدة إجابات)</option>
                                         <option value="essay">مقال / تعليل</option>
                                     </select>
                                 </div>
                                 <div className="col-span-1">
                                     <label className="block text-sm font-black mb-2 opacity-80">درجة السؤال (Score)</label>
                                     <input type="number" value=${tempQ.score || 1} onChange=${e => setQItem({ ...tempQ, score: Number(e.target.value) })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold outline-none text-center" />
                                 </div>
                                 <div className="col-span-1">
                                    <label className="block text-sm font-black mb-2 opacity-80">المساهم (Author)</label>
                                    <select value=${tempQ.studentId || ''} onChange=${(e) => setQItem({ ...tempQ, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold z-50 outline-none">
                                        <option value="">-- بدون مساهم --</option>
                                        ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                    </select>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="col-span-2 pt-6">
                            <label className="block text-sm font-bold mb-2">السؤال (Question Text)</label>
                            <textarea value=${tempQ.text || tempQ.textAr || ''} onChange=${e => setQItem({ ...tempQ, text: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 outline-none text-lg resize-y min-h-[120px]" placeholder="اكتب نص السؤال هنا..." />
                        </div>
                        <div className="col-span-2 w-full mt-2">
                            <${Luminova.Components.UniversalMediaInput} label="مرفقات السؤال التوضيحية (اختياري)" attachments=${tempQ.mediaUrls || (tempQ.mediaUrl ? [tempQ.mediaUrl] : [])} onChange=${v => setQItem({ ...tempQ, mediaUrls: v, mediaUrl: '' })} />
                        </div>

                        ${tempQ.type !== 'essay' ? html`
                            <div className="col-span-2 space-y-3 pt-6">
                                <label className="block text-sm font-bold mb-2 flex justify-between items-center">
                                    <span>خيارات الإجابة (Options)</span>
                                    <button onClick=${() => setQItem({ ...tempQ, options: [...(tempQ.options || []), ''] })} className="px-3 py-1 bg-brand-DEFAULT text-white text-xs rounded-full font-bold shadow-md hover:scale-105">+ إضافة خيار</button>
                                </label>
                                ${(tempQ.options || ['']).map((opt, idx) => html`
                                    <div key=${idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 border-2 dark:border-gray-800 p-2 rounded-xl focus-within:border-brand-DEFAULT/50 transition-colors">
                                        <div className="pl-2 flex items-center justify-center cursor-pointer" title="تحديد كإجابة صحيحة">
                                            <input type=${tempQ.type === 'mcq' ? 'radio' : 'checkbox'} name="correct" checked=${tempQ.correctAnswers?.includes(idx)} 
                                                onChange=${(e) => {
                        if (tempQ.type === 'mcq') setQItem({ ...tempQ, correctAnswers: [idx] });
                        else {
                            const cur = tempQ.correctAnswers || [];
                            setQItem({ ...tempQ, correctAnswers: e.target.checked ? [...cur, idx] : cur.filter(x => x !== idx) });
                        }
                    }} 
                                                className="w-6 h-6 accent-brand-DEFAULT cursor-pointer" 
                                            />
                                        </div>
                                        <input type="text" value=${opt || ''} 
                                            onChange=${e => { const newOps = [...tempQ.options]; newOps[idx] = e.target.value; setQItem({ ...tempQ, options: newOps }) }} 
                                            className="flex-1 bg-transparent p-2 outline-none font-semibold text-lg" 
                                            placeholder=${`الخيار ${idx + 1}`} 
                                        />
                                        <button onClick=${() => { const newOps = tempQ.options.filter((_, i) => i !== idx); setQItem({ ...tempQ, options: newOps, correctAnswers: [0] }); }} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-50 hover:opacity-100 transition-all"><${Luminova.Icons.Trash}/></button>
                                    </div>
                                `)}
                            </div>
                        ` : html`
                            <div className="col-span-2 pt-6">
                                <label className="block text-sm font-bold mb-2">الإجابة النموذجية (Model Answer)</label>
                                <textarea value=${tempQ.modelAnswer || tempQ.modelAnswerAr || ''} onChange=${e => setQItem({ ...tempQ, modelAnswer: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 outline-none min-h-[100px]" placeholder="اكتب الإجابة النموذجية للسؤال المقالي..." />
                            </div>
                        `}

                        <div className="col-span-2 pt-6">
                            <button onClick=${() => setQItem({ ...tempQ, showExp: !tempQ.showExp })} className="text-brand-DEFAULT font-bold bg-brand-DEFAULT/10 px-4 py-2 rounded-xl flex items-center gap-2 w-max">
                                💡 ${tempQ.showExp || tempQ.explanation || tempQ.explanationAr ? 'إخفاء التعليل' : 'إضافة تعليل للإجابة (Explanation)'}
                            </button>
                            ${(tempQ.showExp || tempQ.explanation || tempQ.explanationAr) && html`
                                <textarea value=${tempQ.explanation || tempQ.explanationAr || ''} onChange=${e => setQItem({ ...tempQ, explanation: e.target.value })} className="w-full p-4 mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 outline-none min-h-[100px] text-brand-gold" placeholder="اكتب شرحاً أو تعليلاً لسبب الإجابة الصحيحة..." />
                            `}
                        </div>

                        <div className="col-span-2 mt-8 flex gap-4 border-t pt-4">
                            <${Luminova.Components.Button} onClick=${() => handleSubSave(tempQ)} className="w-full text-xl py-3 shadow-[0_5px_30px_-10px_rgba(6,182,212,0.8)]">${Luminova.i18n[lang].save} Question</${Luminova.Components.Button}>
                        </div>
                    </div>
                </div>
            `;
            } // End Edit Question

            return html`
            <div className="animate-fade-in pb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-3xl font-black text-brand-gold">Quiz Questions Matrix</h2>
                        <h3 className="text-xl font-bold opacity-70 mt-2">${editingItem.title || editingItem.titleAr || ''}</h3>
                    </div>
                    <div className="flex gap-3">
                        <${Luminova.Components.Button} onClick=${() => { setSubView(''); setEditingItem(null); }} variant="glass">العودة لقائمة الاختبارات</${Luminova.Components.Button}>
                        <${Luminova.Components.Button} onClick=${() => setSubView('')}>رجوع لصفحة الإعدادات</${Luminova.Components.Button}>
                    </div>
                </div>
                
                <div className="mb-6"><${Luminova.Components.Button} onClick=${() => { setQItem(null); setSubView('editQuestion'); }} className="bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/20 text-xl py-3 px-8">+ Add Question</${Luminova.Components.Button}></div>
                
                <div className="space-y-4">
                    ${(editingItem.questions || []).map((q, idx) => html`
                        <${Luminova.Components.GlassCard} key=${q.id} className="flex justify-between items-center border-l-4 border-brand-DEFAULT">
                            <div>
                                <span className="font-bold mr-4 text-brand-DEFAULT">Q${idx + 1}.</span>
                                <span className="text-lg font-bold">${q.textAr || q.textEn || 'Draft Question'}</span>
                                <div className="text-xs opacity-50 mt-1">${q.type} - Score: ${q.score}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick=${() => { setQItem(q); setSubView('editQuestion'); }} className="p-3 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><${Luminova.Icons.Edit} /></button>
                                <button onClick=${() => {
                    if (confirm('Delete Question?')) {
                        const updatedQ = editingItem.questions.filter(x => x.id !== q.id);
                        const updatedQuiz = { ...editingItem, questions: updatedQ };
                        setEditingItem(updatedQuiz);
                        setData(prev => ({ ...prev, [activeTab]: prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i) }));
                    }
                }} className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><${Luminova.Icons.Trash} /></button>
                            </div>
                        </${Luminova.Components.GlassCard}>
                    `)}
                    ${(!editingItem.questions || editingItem.questions.length === 0) && html`
                        <div className="p-10 border-2 border-dashed rounded-2xl text-center font-bold opacity-50">لا يوجد أسئلة.. أضف سؤالاً للاختبار.</div>
                    `}
                </div>
            </div>
        `;
        }

        // Filter logic including Real-Time Search
        let activeTableItems = data[activeTab] ? data[activeTab].filter(item => activeTab !== 'students' || !item.isFounder) : [];
        if (window.CMS_USER_ROLE === 'editor') {
            activeTableItems = activeTableItems.filter(item => window.CMS_EDITOR_ADDED_IDS && window.CMS_EDITOR_ADDED_IDS.includes(item.id));
        }

        if (['subjects', 'summaries', 'quizzes'].includes(activeTab)) {
            activeTableItems = activeTableItems.filter(item => {
                let sId, semId, yId;
                if (activeTab === 'subjects') {
                    sId = item.id;
                    semId = item.semesterId;
                    const sem = data.semesters.find(s => s.id === semId);
                    yId = sem ? sem.yearId : null;
                } else {
                    sId = item.subjectId;
                    const sub = data.subjects.find(s => s.id === sId);
                    semId = sub ? sub.semesterId : null;
                    const sem = data.semesters.find(s => s.id === semId);
                    yId = sem ? sem.yearId : null;
                }

                if (filterYear && yId !== filterYear) return false;
                if (filterSem && semId !== filterSem) return false;
                if (activeTab !== 'subjects' && filterSub && sId !== filterSub) return false;

                return true;
            });
        }

        if (cmsSearchQuery.trim() !== '') {
            const query = cmsSearchQuery.toLowerCase();
            activeTableItems = activeTableItems.filter(item =>
                (item.nameAr || item.titleAr || item.title || item.name || item.studentName || '').toLowerCase().includes(query) ||
                (item.nameEn || item.titleEn || item.title || item.studentNameEn || '').toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query)
            );
        }

        const displayedTableItems = activeTableItems.slice(0, cmsVisibleCount);

        return html`
        <div className="animate-fade-in pb-20 max-w-[1400px] mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 border-b-4 border-brand-DEFAULT pb-4 sm:pb-6 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-30 pt-4 rounded-b-3xl px-4 sm:px-8 shadow-sm">
                <h2 className="text-2xl sm:text-4xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-brand-hover to-brand-gold">⚙️ CMS</h2>
                <div className="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-end">

                    ${/* Always visible: Export core data.js */ html`
                        <${Luminova.Components.Button}
                            onClick=${handleExportData}
                            className="bg-brand-DEFAULT text-white shadow-lg hover:bg-brand-hover text-sm sm:text-base px-4 sm:px-6"
                            title=${lang === 'ar' ? 'تصدير الإعدادات والأخبار والطلاب والمواد والتلخيصات' : 'Export settings, news, students, subjects & summaries'}
                        >
                            <span className="animate-pulse">💾</span>
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير data.js' : 'Export data.js'}</span>
                            <span className="sm:hidden">data.js</span>
                        </${Luminova.Components.Button}>
                    `}

                    ${/* Context-sensitive: show certificates export only on certificates tab */ activeTab === 'certificates' && html`
                        <${Luminova.Components.Button}
                            onClick=${handleExportCertificates}
                            className="bg-brand-gold text-black shadow-lg hover:bg-yellow-500 text-sm sm:text-base px-4 sm:px-6"
                            title=${lang === 'ar' ? 'تصدير ملف الشهادات فقط' : 'Export certificates.js only'}
                        >
                            <span>📜</span>
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير certificates.js' : 'Export certificates.js'}</span>
                            <span className="sm:hidden">certs.js</span>
                        </${Luminova.Components.Button}>
                    `}

                    ${/* Context-sensitive: show exam export only on quizzes tab */ activeTab === 'quizzes' && html`
                        <${Luminova.Components.Button}
                            onClick=${handleExportExams}
                            className="bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 text-sm sm:text-base px-4 sm:px-6"
                            title=${lang === 'ar' ? 'تصدير ملف الاختبارات فقط' : 'Export exam.js only'}
                        >
                            <span>📝</span>
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير exam.js' : 'Export exam.js'}</span>
                            <span className="sm:hidden">exam.js</span>
                        </${Luminova.Components.Button}>
                    `}

                    <${Luminova.Components.Button} variant="danger" onClick=${goBack} className="text-sm sm:text-base px-4 sm:px-8">${Luminova.i18n[lang].logout}</${Luminova.Components.Button}>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 sm:gap-8">
                <div className="w-full xl:w-1/4">
                    <div className="xl:sticky xl:top-40">
                        <div className="flex xl:flex-col gap-2 sm:gap-3 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0 scrollbar-hide bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl xl:rounded-3xl p-3 sm:p-4 shadow-lg border border-white/20 dark:border-gray-700/30">
                        ${validTabs.map(key => html`
                            <button key=${key} onClick=${() => { setActiveTab(key); setEditingItem(null); setSubView(''); }}
                                className=${`whitespace-nowrap xl:whitespace-normal xl:w-full text-start px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all flex justify-between items-center gap-2 shrink-0 ${activeTab === key ? 'bg-gradient-to-r from-brand-DEFAULT/90 to-brand-hover text-white shadow-xl shadow-brand-DEFAULT/20 scale-[1.02]' : 'bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <span>${Luminova.i18n[lang][key] || key.toUpperCase()}</span>
                                <span className=${`text-xs font-black px-2 py-0.5 rounded-lg ${activeTab === key ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'}`}>
                                    ${key === 'students' ? (data.students?.filter(s => !s.isFounder).length || 0) : (data[key]?.length || 0)}
                                </span>
                            </button>
                        `)}
                        </div>
                    </div>
                </div>

                <div className="w-full xl:w-3/4">
                    <${Luminova.Components.GlassCard} className="border-none shadow-2xl bg-white/40 dark:bg-black/20 backdrop-blur-3xl min-h-[50vh] xl:min-h-[70vh]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b dark:border-gray-700 pb-4 sm:pb-6 px-4 gap-4">
                            <h3 className="text-2xl sm:text-4xl font-black text-brand-DEFAULT shrink-0">${Luminova.i18n[lang][activeTab] || activeTab}</h3>
                            ${!editingItem && html`
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-1 sm:max-w-lg sm:justify-end items-stretch">
                                    <input type="text" placeholder=${lang === 'ar' ? 'بحث سريع...' : 'Quick Search...'} value=${cmsSearchQuery} onChange=${e => setCmsSearchQuery(e.target.value)} className="w-full sm:flex-1 p-3 sm:p-4 rounded-full bg-white dark:bg-gray-800 border-2 dark:border-gray-700 focus:border-brand-DEFAULT outline-none shadow-sm font-bold placeholder:opacity-50 text-sm sm:text-base" />
                                    <${Luminova.Components.Button} onClick=${() => setEditingItem(getNewTemplate())} className="text-base sm:text-xl px-6 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg shadow-brand-DEFAULT/30 hover:shadow-brand-DEFAULT/50 transition-all font-black shrink-0 justify-center">
                                        ${lang === 'ar' ? '+ إضافة جديد' : '+ Add New'}
                                    </${Luminova.Components.Button}>
                                </div>
                            `}
                        </div>

                        ${!editingItem && ['subjects', 'summaries', 'quizzes'].includes(activeTab) && html`
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 mb-6 relative z-10">
                                <select value=${filterYear} onChange=${e => { setFilterYear(e.target.value); setFilterSem(''); setFilterSub(''); }} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1">
                                    <option value="">${lang === 'ar' ? 'كل الفرق (All Years)' : 'All Years'}</option>
                                    ${data.years.map(y => html`<option key=${y.id} value=${y.id}>${y.nameAr || y.name}</option>`)}
                                </select>
                                <select value=${filterSem} onChange=${e => { setFilterSem(e.target.value); setFilterSub(''); }} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1 text-brand-DEFAULT">
                                    <option value="">${lang === 'ar' ? 'كل الأترام (All Semesters)' : 'All Semesters'}</option>
                                    ${data.semesters.filter(s => !filterYear || s.yearId === filterYear).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                </select>
                                ${['summaries', 'quizzes'].includes(activeTab) && html`
                                    <select value=${filterSub} onChange=${e => setFilterSub(e.target.value)} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1 text-brand-hover">
                                        <option value="">${lang === 'ar' ? 'كل المواد (All Subjects)' : 'All Subjects'}</option>
                                        ${data.subjects.filter(s => {
            if (filterSem) return s.semesterId === filterSem;
            if (filterYear) {
                const validSems = data.semesters.filter(sem => sem.yearId === filterYear).map(sem => sem.id);
                return validSems.includes(s.semesterId);
            }
            return true;
        }).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                    </select>
                                `}
                            </div>
                        `}

                        ${editingItem ? html`
                            <div className="bg-white/70 dark:bg-gray-900/70 p-8 rounded-3xl border-2 border-brand-DEFAULT/20 shadow-inner">
                                <div className="flex justify-between items-center mb-8 border-b dark:border-gray-700 pb-4">
                                    <h4 className="text-2xl font-black text-brand-gold">${editingItem.id.includes(activeTab) ? (lang === 'ar' ? 'إنشاء سجل جديد' : 'Create New Record') : (lang === 'ar' ? 'تعديل السجل' : 'Edit Record')}</h4>
                                    ${activeTab === 'quizzes' && html`
                                        <${Luminova.Components.Button} onClick=${() => setSubView('questionsList')} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 relative overflow-hidden group">
                                            <span className="relative z-10 w-full flex items-center gap-2">📝 Manage Questions Matrix <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">${(editingItem.questions || []).length}</span></span>
                                        </${Luminova.Components.Button}>
                                    `}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    ${(activeTab === 'semesters' || activeTab === 'subjects' || activeTab === 'summaries' || activeTab === 'quizzes') && html`
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الفرقة (Year Hierarchy)</label>
                                            <select value=${editingItem.yearId || ''} onChange=${e => setEditingItem({ ...editingItem, yearId: e.target.value, semesterId: '', subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/30 font-bold outline-none ring-0">
                                                <option value="">-- اختار الفرقة --</option>
                                                ${data.years.map(y => html`<option key=${y.id} value=${y.id}>${y.nameAr || y.name}</option>`)}
                                            </select>
                                        </div>
                                    `}
                                    ${(activeTab === 'subjects' || activeTab === 'summaries' || activeTab === 'quizzes') && html`
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الترم (Semester Hierarchy)</label>
                                            <select value=${editingItem.semesterId || ''} onChange=${e => setEditingItem({ ...editingItem, semesterId: e.target.value, subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/30 font-bold outline-none ring-0">
                                                <option value="">-- اختار الترم --</option>
                                                ${data.semesters.filter(s => !editingItem.yearId || s.yearId === editingItem.yearId).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                    `}
                                    ${(activeTab === 'summaries' || activeTab === 'quizzes') && html`
                                        <div className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-hover drop-shadow-sm">المادة (Subject Link)</label>
                                            <select value=${editingItem.subjectId || ''} onChange=${e => setEditingItem({ ...editingItem, subjectId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-hover/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار المادة --</option>
                                                ${data.subjects.filter(s => {
            if (editingItem.semesterId) return s.semesterId === editingItem.semesterId;
            if (editingItem.yearId) {
                const validSems = data.semesters.filter(sem => sem.yearId === editingItem.yearId).map(sem => sem.id);
                return validSems.includes(s.semesterId);
            }
            return true;
        }).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                    `}
                                    ${(activeTab === 'summaries') && html`
                                        <div className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-gold drop-shadow-sm">الطالب المساهم (Author)</label>
                                            <select value=${editingItem.studentId || ''} onChange=${e => setEditingItem({ ...editingItem, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-gold/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار الطالب --</option>
                                                ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                    `}

                                    ${activeTab === 'certificates' ? html`
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم الطالب المُكرم (Recipient Name - Arabic)" val=${editingItem.studentName} onChange=${v => setEditingItem({ ...editingItem, studentName: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم الطالب المُكرم (Recipient Name - English)" val=${editingItem.studentNameEn} onChange=${v => setEditingItem({ ...editingItem, studentNameEn: v })} /></div>
                                        
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">اسم المرسل/المانح (Sender Name - Arabic)</label>
                                            <input list="senderPresets" value=${editingItem.senderName || ''} onChange=${e => setEditingItem({ ...editingItem, senderName: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all" placeholder="محمود عبد الرحمن" />
                                            <datalist id="senderPresets">
                                                <option value="محمود عبد الرحمن" />
                                            </datalist>
                                        </div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم المرسل/المانح (Sender Name - English)" val=${editingItem.senderNameEn} onChange=${v => setEditingItem({ ...editingItem, senderNameEn: v })} /></div>
                                        
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-3 opacity-80 text-brand-DEFAULT">دور المرسل أكاديمياً (Sender Role)</label>
                                            <select 
                                                value=${['زميل أكاديمي', 'دكتور مادة', 'مسؤول المنصة'].includes(editingItem.senderRole) ? editingItem.senderRole : (editingItem.senderRole ? 'custom' : '')} 
                                                onChange=${e => {
                        const val = e.target.value;
                        setEditingItem({ ...editingItem, senderRole: val === 'custom' ? '' : val, senderRoleEn: '' });
                    }} 
                                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all mb-4">
                                                <option value="">-- اختار الدور --</option>
                                                <option value="زميل أكاديمي">زميل أكاديمي</option>
                                                <option value="دكتور مادة">دكتور مادة</option>
                                                <option value="مسؤول المنصة">مسؤول المنصة</option>
                                                <option value="custom">✏️ تخصيص...</option>
                                            </select>
                                            ${!['زميل أكاديمي', 'دكتور مادة', 'مسؤول المنصة', ''].includes(editingItem.senderRole) && html`
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                    <${Luminova.Components.Input} label="Sender Role - Arabic" val=${editingItem.senderRole} onChange=${v => setEditingItem({ ...editingItem, senderRole: v })} />
                                                    <${Luminova.Components.Input} label="Sender Role - English" val=${editingItem.senderRoleEn || ''} onChange=${v => setEditingItem({ ...editingItem, senderRoleEn: v })} />
                                                </div>
                                            `}
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                             <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">عنوان الشهادة (Title - Arabic Preset)</label>
                                             <select 
                                                 value=${['شهادة إثراء محتوى تقني', 'شهادة بطل الدفعة', 'شهادة تقدير تميز أكاديمي', 'شهادة مساهمة فعالة'].includes(editingItem.title) ? editingItem.title : (editingItem.title ? 'custom' : '')} 
                                                 onChange=${e => {
                        const val = e.target.value;
                        setEditingItem({ ...editingItem, title: val === 'custom' ? '' : val });
                    }} 
                                                 className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all mb-4">
                                                 <option value="">-- اختار عنوان الشهادة --</option>
                                                 <option value="شهادة إثراء محتوى تقني">شهادة إثراء محتوى تقني</option>
                                                 <option value="شهادة بطل الدفعة">شهادة بطل الدفعة</option>
                                                 <option value="شهادة تقدير تميز أكاديمي">شهادة تقدير تميز أكاديمي</option>
                                                 <option value="شهادة مساهمة فعالة">شهادة مساهمة فعالة</option>
                                                 <option value="custom">✏️ كتابة مخصصة...</option>
                                             </select>
                                             <${Luminova.Components.Input} label="عنوان الشهادة (Title - Arabic Custom)" val=${editingItem.title} onChange=${v => setEditingItem({ ...editingItem, title: v })} />
                                        </div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان الشهادة (Title - English)" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                             <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">الوصف وسبب المنح (Reason - Arabic Preset)</label>
                                             <select 
                                                 value=${['تقديراً للمجهود الرائع والمشاركات الفعالة في إثراء المحتوى الأكاديمي.', 'لتفوقه الملحوظ وحصوله على أعلى الدرجات في التقييمات الأكاديمية.', 'لمساهمته الفعالة والمستمرة في دعم ومساعدة زملاء الدفعة.'].includes(editingItem.description) ? editingItem.description : (editingItem.description ? 'custom' : '')} 
                                                 onChange=${e => {
                        const val = e.target.value;
                        setEditingItem({ ...editingItem, description: val === 'custom' ? '' : val });
                    }} 
                                                 className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all mb-4">
                                                 <option value="">-- اختار الوصف --</option>
                                                 <option value="تقديراً للمجهود الرائع والمشاركات الفعالة في إثراء المحتوى الأكاديمي.">تقديراً للمجهود الرائع والمشاركات الفعالة في إثراء المحتوى الأكاديمي.</option>
                                                 <option value="لتفوقه الملحوظ وحصوله على أعلى الدرجات في التقييمات الأكاديمية.">لتفوقه الملحوظ وحصوله على أعلى الدرجات في التقييمات الأكاديمية.</option>
                                                 <option value="لمساهمته الفعالة والمستمرة في دعم ومساعدة زملاء الدفعة.">لمساهمته الفعالة والمستمرة في دعم ومساعدة زملاء الدفعة.</option>
                                                 <option value="custom">✏️ كتابة مخصصة...</option>
                                             </select>
                                             <${Luminova.Components.Input} type="textarea" label="الوصف وسبب المنح (Reason - Arabic Custom)" val=${editingItem.description} onChange=${v => setEditingItem({ ...editingItem, description: v })} />
                                        </div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="الوصف وسبب المنح (Reason - English)" val=${editingItem.descriptionEn} onChange=${v => setEditingItem({ ...editingItem, descriptionEn: v })} /></div>
                                        <div className="col-span-2 w-full p-4 border border-brand-DEFAULT rounded-xl"><${Luminova.Components.Input} type="checkbox" label="📌 إظهار كشهادة رئيسية في المنصة (Featured Certificate)" val=${editingItem.isFeatured} onChange=${v => setEditingItem({ ...editingItem, isFeatured: v })} /></div>
                                        
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-3 opacity-80 tracking-wide text-brand-gold">نوع الشارة (Seal Type)</label>
                                            <select value=${editingItem.sealType || 'gold'} onChange=${e => setEditingItem({ ...editingItem, sealType: e.target.value })} className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-brand-gold font-black outline-none shadow-sm cursor-pointer">
                                                <option value="gold">شارة ذهبية 🏅 (Gold Seal)</option>
                                                <option value="silver">شارة فضية 🥈 (Silver Seal)</option>
                                            </select>
                                        </div>
                                        
                                        <!-- REALTIME LIVE PREVIEW -->
                                        ${window.Luminova?.Components?.CertificateCard ? html`
                                        <div className="col-span-2 mt-8 py-8 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-gray-800 rounded-3xl overflow-hidden relative group">
                                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                                            <h4 className="font-black text-center mb-6 tracking-[0.3em] opacity-40">✨ LIVE CSS PREVIEW</h4>
                                            <div className="w-full flex justify-center origin-top pointer-events-none scale-[0.55] sm:scale-75 lg:scale-[0.85] transition-transform" style=${{ transformOrigin: 'top center' }}>
                                                <div className="w-[1000px] shadow-2xl">
                                                    <${Luminova.Components.CertificateCard} certificate=${editingItem} lang=${lang} />
                                                </div>
                                            </div>
                                        </div>
                                        ` : html`<div className="col-span-2 p-10 text-center font-bold opacity-50">Loading Certificate Engine Viewer...</div>`}
                                    ` : activeTab === 'students' ? html`
                                        <div className="col-span-2 flex flex-col md:flex-row gap-4"><div className="w-full"><${Luminova.Components.Input} label="الاسم العربي" val=${editingItem.nameAr} onChange=${v => setEditingItem({ ...editingItem, nameAr: v })} /></div> <div className="w-full"><${Luminova.Components.Input} label="English Name" val=${editingItem.nameEn} onChange=${v => setEditingItem({ ...editingItem, nameEn: v })} /></div></div>
                                        <div className="col-span-2 flex flex-col md:flex-row gap-4"><div className="w-full"><${Luminova.Components.Input} label="التخصص العربي" val=${editingItem.majorAr} onChange=${v => setEditingItem({ ...editingItem, majorAr: v })} /></div> <div className="w-full"><${Luminova.Components.Input} label="English Major" val=${editingItem.majorEn} onChange=${v => setEditingItem({ ...editingItem, majorEn: v })} /></div></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="نبذة عربية" val=${editingItem.bioAr} onChange=${v => setEditingItem({ ...editingItem, bioAr: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="English Bio" val=${editingItem.bioEn} onChange=${v => setEditingItem({ ...editingItem, bioEn: v })} /></div>
                                        <div className="col-span-2 w-full">
                                            <${Luminova.Components.UniversalMediaInput} label="مرفقات الطالب / الصورة الشخصية" attachments=${editingItem.mediaUrls || (editingItem.image ? [editingItem.image] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, image: v[0] || '' })} />
                                        </div>
                                        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <${Luminova.Components.SocialInput} label="Facebook Link" val=${editingItem.socialLinks?.facebook} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), facebook: v } })} /> 
                                            <${Luminova.Components.SocialInput} label="Instagram Link" val=${editingItem.socialLinks?.instagram} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), instagram: v } })} /> 
                                            <${Luminova.Components.SocialInput} label="LinkedIn Link" val=${editingItem.socialLinks?.linkedin} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), linkedin: v } })} />
                                        </div>
                                        <div className="col-span-2 flex gap-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <${Luminova.Components.Input} type="checkbox" label="⭐ VIP Member (مميز الإطار الخارجي)" val=${editingItem.isVIP} onChange=${v => { setEditingItem({ ...editingItem, isVIP: v }) }} />
                                            <${Luminova.Components.Input} type="checkbox" label="🔵✔️ Verified (شارة توثيق زرقاء)" val=${editingItem.isVerified} onChange=${v => { setEditingItem({ ...editingItem, isVerified: v }) }} />
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-3 opacity-80 text-teal-600 dark:text-teal-400">🎓 دور المستخدم (User Role)</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border-2 ${editingItem.role !== 'doctor' ? 'border-brand-DEFAULT' : 'border-gray-200 dark:border-gray-700'} shadow-sm flex-1">
                                                    <input type="radio" name="userRole" value="student" checked=${editingItem.role !== 'doctor'} onChange=${() => setEditingItem({ ...editingItem, role: 'student' })} className="w-5 h-5 accent-brand-DEFAULT" />
                                                    <span className="font-bold">👤 طالب (Student)</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border-2 ${editingItem.role === 'doctor' ? 'border-teal-500' : 'border-gray-200 dark:border-gray-700'} shadow-sm flex-1">
                                                    <input type="radio" name="userRole" value="doctor" checked=${editingItem.role === 'doctor'} onChange=${() => setEditingItem({ ...editingItem, role: 'doctor' })} className="w-5 h-5 accent-teal-500" />
                                                    <span className="font-bold text-teal-600 dark:text-teal-400">🎓 دكتور (Doctor)</span>
                                                </label>
                                            </div>
                                        </div>
                                    ` : activeTab === 'news' ? html`
                                        <div className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الناشر (Author)</label>
                                            <select value=${editingItem.studentId || ''} onChange=${e => setEditingItem({ ...editingItem, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار الناشر --</option>
                                                ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان الخبر" val=${editingItem.titleAr} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="News Title" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="التفاصيل (عربي)" val=${editingItem.contentAr} onChange=${v => setEditingItem({ ...editingItem, contentAr: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="Details (English)" val=${editingItem.contentEn} onChange=${v => setEditingItem({ ...editingItem, contentEn: v })} /></div>
                                        <div className="col-span-2 w-full mt-2">
                                            <${Luminova.Components.UniversalMediaInput} label="Media Attachments (مرفقات الخبر)" attachments=${editingItem.mediaUrls || (editingItem.mediaUrl ? [editingItem.mediaUrl] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, mediaUrl: '' })} />
                                        </div>
                                    ` : activeTab === 'summaries' ? html`
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان التلخيص" val=${editingItem.titleAr} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} label="Summary Title" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="نبذة محتوى (عربي)" val=${editingItem.contentAr} onChange=${v => setEditingItem({ ...editingItem, contentAr: v })} /></div>
                                        <div className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="Summary Content (English)" val=${editingItem.contentEn} onChange=${v => setEditingItem({ ...editingItem, contentEn: v })} /></div>
                                        <div className="col-span-2 w-full mt-2">
                                            <${Luminova.Components.UniversalMediaInput} label="Media Attachments (مرفقات التلخيص)" attachments=${editingItem.mediaUrls || (editingItem.mediaUrl ? [editingItem.mediaUrl] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, mediaUrl: '' })} />
                                        </div>
                                    ` : activeTab === 'quizzes' ? html`
                                        <div className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">ناشر الاختبار (Quiz Publisher - للعرض فقط بلا مساهمات)</label>
                                            <select value=${editingItem.publisherId || ''} onChange=${e => setEditingItem({ ...editingItem, publisherId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار الناشر ليعرض على غلاف الاختبار --</option>
                                                ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 w-full flex flex-col md:flex-row gap-4">
                                            <div className="w-full"><${Luminova.Components.Input} label="عنوان الاختبار التفاعلي (عربي)" val=${editingItem.titleAr || editingItem.title || ''} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} /></div>
                                            <div className="w-full"><${Luminova.Components.Input} label="Interactive Quiz Title (English)" val=${editingItem.titleEn || editingItem.title || ''} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        </div>
                                        <div className="col-span-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/50">
                                            <${Luminova.Components.Input} type="checkbox" label="ترتيب عشوائي للأسئلة (Shuffle)" val=${editingItem.isShuffled || false} onChange=${v => setEditingItem({ ...editingItem, isShuffled: v })} />
                                            <p className="text-xs opacity-60 mt-1">يظهر الترتيب بشكل مختلف لكل طالب لزيادة المصداقية.</p>
                                        </div>
                                        <div className="col-span-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/50">
                                            <label className="block text-sm font-black mb-2 opacity-80">توقيت ظهور التعليل (Feedback Mode)</label>
                                            <select value=${editingItem.feedbackMode || 'end'} onChange=${e => setEditingItem({ ...editingItem, feedbackMode: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-600 font-bold outline-none shadow-sm">
                                                <option value="end">النتيجة مع التعليل في نهاية الاختبار (At the End)</option>
                                                <option value="immediate">تجميد فور إجابة كل سؤال وإظهار التعليل (Immediate)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 mt-6 p-6 border-2 border-brand-gold/50 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 backdrop-blur-xl shadow-lg">
                                            <h3 className="text-xl font-black text-brand-gold mb-6 flex items-center gap-2">⚙️ الإعدادات المتقدمة (Advanced Settings)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="col-span-2">
                                                    <${Luminova.Components.Input} label="Webhook URL (رابط حفظ النتيجة المستقل)" val=${editingItem.webhookUrl !== undefined ? editingItem.webhookUrl : 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'} onChange=${v => setEditingItem({ ...editingItem, webhookUrl: v })} />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-black mb-2 opacity-80">نظام الاختبار (Exam Mode)</label>
                                                    <select value=${editingItem.examMode || 'practice'} onChange=${e => setEditingItem({ ...editingItem, examMode: e.target.value })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold outline-none shadow-sm focus:border-brand-gold">
                                                        <option value="practice">تدريبي (Practice)</option>
                                                        <option value="evaluation">تقييمي (Evaluation)</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-1 flex items-center justify-start mt-6">
                                                    <${Luminova.Components.Input} type="checkbox" label="السماح بالرجوع للسابق (Allow Back Nav)" val=${editingItem.allowBackNavigation !== undefined ? editingItem.allowBackNavigation : true} onChange=${v => setEditingItem({ ...editingItem, allowBackNavigation: v })} />
                                                </div>
                                                ${editingItem.examMode === 'evaluation' && html`
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-2 opacity-80 text-brand-gold">إظهار النتيجة والإجابات بعد التسليم؟ (Show results after?)</label>
                                                        <select value=${editingItem.showResultsAfter ? 'yes' : 'no'} onChange=${e => setEditingItem({ ...editingItem, showResultsAfter: e.target.value === 'yes' })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-brand-gold/30 font-bold outline-none shadow-sm focus:border-brand-gold text-brand-gold">
                                                            <option value="no">لا (No)</option>
                                                            <option value="yes">نعم (Yes)</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-2 opacity-80">سياسة البريد الإلكتروني (Email Policy)</label>
                                                        <select value=${editingItem.emailPolicy || 'none'} onChange=${e => setEditingItem({ ...editingItem, emailPolicy: e.target.value })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold outline-none shadow-sm focus:border-brand-gold">
                                                            <option value="none">لا إرسال (None)</option>
                                                            <option value="score_only">الدرجة فقط (Score Only)</option>
                                                            <option value="answers_only">الإجابات فقط (Answers Only)</option>
                                                            <option value="full_report">تقرير كامل (Full Report)</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-2 opacity-80">سياسة التأخير (Late Policy)</label>
                                                        <select value=${editingItem.latePolicy || 'hard_stop'} onChange=${e => setEditingItem({ ...editingItem, latePolicy: e.target.value })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold outline-none shadow-sm focus:border-brand-gold">
                                                            <option value="hard_stop">منع الدخول (Hard Stop)</option>
                                                            <option value="grace_period">السماح مع وضع علامة متأخر (Grace Period)</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-2 opacity-80">وقت البدء (Start Time)</label>
                                                        <input type="datetime-local" value=${editingItem.startTime || ''} onChange=${e => setEditingItem({ ...editingItem, startTime: e.target.value })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold outline-none shadow-sm focus:border-brand-gold" />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-2 opacity-80">وقت الانتهاء (End Time)</label>
                                                        <input type="datetime-local" value=${editingItem.endTime || ''} onChange=${e => setEditingItem({ ...editingItem, endTime: e.target.value })} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold outline-none shadow-sm focus:border-brand-gold" />
                                                    </div>
                                                    <div className="col-span-2 w-full space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <label className="block text-sm font-black opacity-80">إيميلات الإدارة (Admin Emails)</label>
                                                            <button onClick=${() => {
                            const arr = (editingItem.adminEmails || '').split(',').filter(Boolean);
                            arr.push('');
                            setEditingItem({ ...editingItem, adminEmails: arr.join(',') });
                        }} className="px-4 py-1.5 bg-gradient-to-r from-brand-gold to-yellow-500 text-black text-sm rounded-full font-bold shadow-lg hover:scale-105 transition-transform">+ إضافة إيميل</button>
                                                        </div>
                                                        ${((editingItem.adminEmails || '').split(',').length === 0 ? [''] : (editingItem.adminEmails || '').split(',')).map((em, idx, arr) => html`
                                                            <div key=${idx} className="flex gap-2 items-center w-full">
                                                                <div className="flex-1">
                                                                    <${Luminova.Components.Input} val=${em} onChange=${v => {
                                const newArr = [...arr];
                                newArr[idx] = v;
                                setEditingItem({ ...editingItem, adminEmails: newArr.join(',') });
                            }} />
                                                                </div>
                                                                ${arr.length > 1 && html`
                                                                    <button onClick=${() => {
                                    const newArr = arr.filter((_, i) => i !== idx);
                                    setEditingItem({ ...editingItem, adminEmails: newArr.join(',') });
                                }} className="p-4 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-colors"><${Luminova.Icons.Trash} /></button>
                                                                `}
                                                            </div>
                                                        `)}
                                                    </div>
                                                `}
                                            </div>
                                        </div>
                                    ` : html`
                                        <div className="w-full"><${Luminova.Components.Input} label="الاسم العربي" val=${editingItem.nameAr} onChange=${v => setEditingItem({ ...editingItem, nameAr: v })} /></div> <div className="w-full"><${Luminova.Components.Input} label="English Name" val=${editingItem.nameEn} onChange=${v => setEditingItem({ ...editingItem, nameEn: v })} /></div>
                                    `}
                                </div>

                                <div className="mt-10 border-t-4 border-gray-200 dark:border-gray-800 pt-6 flex flex-col md:flex-row gap-6 items-center">
                                    <${Luminova.Components.Button} onClick=${handleSave} className="flex-1 w-full text-xl py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(6,182,212,0.8)]">${Luminova.i18n[lang].save} Entity To Database</${Luminova.Components.Button}>
                                    <button
                                        onClick=${handleAutoTranslate}
                                        disabled=${isTranslating}
                                        className="w-full md:w-auto px-6 py-4 rounded-2xl font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 border border-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        ${isTranslating ? html`<span className="animate-spin">🔄</span>` : '🪄'}
                                        ${lang === 'ar' ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}
                                    </button>
                                    <${Luminova.Components.Button} variant="glass" onClick=${() => setEditingItem(null)} className="w-full md:w-[20%] text-xl py-4 rounded-2xl">${Luminova.i18n[lang].cancel}</${Luminova.Components.Button}>
                                </div>
                            </div>
                        ` : html`
                            <div className="p-2 sm:p-4 space-y-3">
                                ${displayedTableItems.map(item => html`
                                    <div key=${item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/30 hover:border-brand-DEFAULT/30 hover:shadow-md transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-mono text-gray-400 mb-1 truncate">${item.id}</div>
                                            <div className="font-bold text-base sm:text-lg">
                                                ${item.titleAr || item.nameAr || item.name || item.titleEn || item.nameEn || item.title || 'N/A'}
                                                ${(item.titleEn || item.nameEn) ? html`<span className="text-gray-400 font-normal text-sm mx-1">-</span><span className="opacity-60 text-sm font-normal">${item.titleEn || item.nameEn || ''}</span>` : null}
                                                ${item.isVIP && html`<span className="ml-1 text-brand-DEFAULT">✨</span>`}
                                                ${item.isFeatured && html`<span className="ml-1 text-brand-gold">📌</span>`}
                                                ${item.isVerified && html`<span className="ml-1">🔵✔️</span>`}
                                                ${item.role === 'doctor' && html`<span className="ml-1 text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-black">🎓</span>`}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 font-semibold">${Luminova.formatDate(item.timestamp, lang)}</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 justify-end">
                                            ${activeTab === 'quizzes' && html`
                                                <button onClick=${() => { setEditingItem({ ...item }); setSubView('questionsList'); }} className="px-3 py-2 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-xl hover:bg-brand-DEFAULT hover:text-white transition-colors font-bold text-sm flex gap-1 items-center border border-brand-DEFAULT/20">
                                                    📝 <span className="bg-white/50 dark:bg-black/20 text-xs px-1.5 py-0.5 rounded-full">${(item.questions || []).length}</span>
                                                </button>
                                            `}
                                            <button onClick=${() => setEditingItem({ ...item })} className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-colors"><${Luminova.Icons.Edit} /></button>
                                            <button onClick=${() => handleDelete(activeTab, item.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><${Luminova.Icons.Trash} /></button>
                                        </div>
                                    </div>
                                `)}
                                ${activeTableItems.length === 0 && html`
                                    <div className="p-12 sm:p-20 text-center font-bold text-xl sm:text-2xl opacity-30 border-2 border-dashed rounded-3xl">${Luminova.i18n[lang].emptyState}</div>
                                `}
                            </div>
                            
                            ${(!editingItem && cmsVisibleCount < activeTableItems.length) && html`
                                <div className="flex justify-center pt-6 pb-2">
                                    <button onClick=${() => setCmsVisibleCount(prev => prev + 5)} className="bg-brand-DEFAULT hover:bg-brand-hover text-white font-bold py-2.5 px-8 rounded-xl shadow-md transition-all">
                                        ${lang === 'ar' ? 'عرض المزيد ➕' : 'Load More ➕'}
                                    </button>
                                </div>
                            `}
                        `}
                    </${Luminova.Components.GlassCard}>
                </div>
            </div>
        </div>
    `;
    };

    // ==========================================



    // ==========================================
    // NANO BANANA CMS APPLICATION (DUAL-ACCESS)
    // ==========================================

    const CMSApp = () => {
        const [loginState, setLoginState] = useState({ loggedIn: false, role: null });
        const [authError, setAuthError] = useState('');

        // We fetch data immediately
        const [dataReady, setDataReady] = useState(false);
        const [loadingMsg, setLoadingMsg] = useState('Initializing Application... Please wait');
        const [data, setData] = useState(null);

        useEffect(() => {
            const fetchInitialData = async () => {
                setLoadingMsg('Fetching Data... Please wait');
                try {
                    const fetchAndEval = async (url, fallbackScript) => {
                        if (url && url !== "PASTE_YOUR_DATA_URL_HERE" && url !== "PASTE_YOUR_EXAM_URL_HERE" && url !== "PASTE_YOUR_CERTS_URL_HERE") {
                            try {
                                const res = await fetch(url + '?v=' + Date.now());
                                if (!res.ok) throw new Error('Fetch failed');
                                const text = await res.text();
                                // Execute the code in global scope
                                new Function(text)();
                                return true;
                            } catch (e) {
                                console.warn('Failed to fetch from GitHub URL:', url, e);
                            }
                        }

                        // Fallback to local script tag. Path is adjusted for /cms/ subfolder.
                        return new Promise((resolve) => {
                            const script = document.createElement('script');
                            script.src = '../' + fallbackScript + '?v=' + Date.now();
                            script.onload = () => resolve(true);
                            script.onerror = () => resolve(false);
                            document.body.appendChild(script);
                        });
                    };

                    await fetchAndEval(DATA_URL, 'data.js');
                    await fetchAndEval(EXAM_URL, 'exam.js');
                    await fetchAndEval(CERTS_URL, 'certificates.js');

                    // Wait a moment for global vars to settle
                    setTimeout(() => {
                        if (window.LUMINOVA_DATA) {
                            setData({
                                ...window.LUMINOVA_DATA,
                                quizzes: window.LUMINOVA_EXAMS || [],
                                certificates: window.LUMINOVA_CERTIFICATES || []
                            });
                            setDataReady(true);
                            setLoadingMsg('');
                        } else {
                            setLoadingMsg('Failed to load data.js (Check path or URL)');
                        }
                    }, 500);

                } catch (e) {
                    setLoadingMsg('Critical Error Loading Data: ' + e.message);
                }
            };
            fetchInitialData();
        }, []);

        const handleLogin = (e) => {
            e.preventDefault();
            const username = e.target.username.value.trim().toLowerCase();
            const password = e.target.password.value;

            if (username === 'admin2' && password === 'admin123@2') {
                window.CMS_USER_ROLE = 'admin';
                setLoginState({ loggedIn: true, role: 'admin' });
            } else if (username === 'admin' && password === 'admin123') {
                window.CMS_USER_ROLE = 'editor';
                window.CMS_EDITOR_ADDED_IDS = [];
                setLoginState({ loggedIn: true, role: 'editor' });
            } else {
                setAuthError('Invalid credentials');
            }
        };

        if (loadingMsg) {
            return html`
            <div className="min-h-screen flex items-center justify-center flex-col gap-6 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.1),transparent_50%)]"></div>
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-DEFAULT/30 border-t-brand-DEFAULT rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-brand-gold/50 rounded-full animate-spin" style=${{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="font-bold text-lg text-gray-300 tracking-wide">${loadingMsg}</p>
            </div>
        `;
        }

        if (!loginState.loggedIn) {
            return html`
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden px-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.2),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.12),transparent_50%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-DEFAULT/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-gold/5 rounded-full blur-3xl animate-pulse" style=${{ animationDelay: '1s' }}></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/40 p-8 sm:p-10">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-DEFAULT to-brand-gold flex items-center justify-center shadow-lg shadow-brand-DEFAULT/30">
                                <span className="text-3xl font-black text-white drop-shadow-md">L</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">LUMINOVA CMS</h1>
                            <div className="w-16 h-1 mx-auto mt-3 bg-gradient-to-r from-brand-DEFAULT to-brand-gold rounded-full"></div>
                        </div>
                        <form onSubmit=${handleLogin} className="space-y-5">
                            <div className="relative">
                                <span className="absolute inset-y-0 start-4 flex items-center text-gray-500 pointer-events-none">👤</span>
                                <input name="username" type="text" placeholder="Username" className="w-full ps-12 pe-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] outline-none focus:border-brand-DEFAULT/60 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold transition-all text-white placeholder:text-gray-600" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 start-4 flex items-center text-gray-500 pointer-events-none">🔑</span>
                                <input name="password" type="password" placeholder="Password" className="w-full ps-12 pe-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] outline-none focus:border-brand-DEFAULT/60 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold transition-all text-white placeholder:text-gray-600" required />
                            </div>
                            ${authError && html`<div className="text-red-400 font-bold text-center text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">${authError}</div>`}
                            <button type="submit" className="w-full relative overflow-hidden bg-gradient-to-r from-brand-DEFAULT to-cyan-500 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-95 group">
                                <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                                    SECURE LOGIN
                                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-brand-DEFAULT opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-gray-600 text-xs mt-6 font-bold tracking-widest">LUMINOVA EDUCATION PLATFORM</p>
                </div>
            </div>
        `;
        }

        // Render the AdminCMS component
        return html`
        <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.04),transparent_50%)] pointer-events-none z-0"></div>
            ${loginState.role === 'editor' && html`
                <div className="fixed top-4 end-4 z-50 flex items-center gap-2 bg-amber-500/90 backdrop-blur-xl text-black px-4 py-2 rounded-full shadow-lg shadow-amber-500/20 font-black text-xs sm:text-sm cursor-default group" title="Blind Addition Mode: You can only add new items. Existing data is hidden.">
                    <span className="text-lg">👁️‍🗨️</span>
                    <span className="hidden sm:inline">EDITOR MODE</span>
                    <span className="w-2 h-2 bg-black/30 rounded-full animate-pulse"></span>
                </div>
            `}
            <div className="relative z-10">
                <${Luminova.Pages.AdminCMS} data=${data} setData=${setData} lang="ar" goBack=${() => setLoginState({ loggedIn: false, role: null })} />
            </div>
        </div>
    `;
    };

    const root = window.ReactDOM.createRoot(document.getElementById('cms-root'));
    root.render(html`<${CMSApp} />`);
})();