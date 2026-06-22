(function () {
    "use strict";

    // --- روابط جت هب الثابتة ---
    const DATA_URL = "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/main/data.js";
    const CERTS_URL = "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/main/certificates.js";

    // اشتقاق رابط الاختبارات من روابط البيانات/الشهادات تلقائياً
    const deriveExamUrl = (dataUrl, certsUrl) => {
        const referenceUrl = dataUrl || certsUrl || "https://raw.githubusercontent.com/MahmoudAbdo21/Luminova-Edu/main/data.js";
        return referenceUrl.substring(0, referenceUrl.lastIndexOf('/')) + '/exam.js';
    };
    const EXAM_URL = deriveExamUrl(DATA_URL, CERTS_URL);

    // ==========================================
    // الجزء 1: أدوات أساسية وترجمة وأيقونات ومكونات
    // ==========================================
    var { useState, useEffect, useMemo, useCallback } = window.React;
    var html = window.htm.bind(window.React.createElement);

    window.__LUMINOVA = { Core: {}, Components: {}, Pages: {}, Icons: {} };
    const Luminova = window.__LUMINOVA;

    const FILE_SCHEMAS = {
        data: { variable: 'LUMINOVA_DATA', kind: 'object', url: DATA_URL, fallback: 'data.js' },
        exams: { variable: 'LUMINOVA_EXAMS', kind: 'array', url: EXAM_URL, fallback: 'exam.js' },
        certs: { variable: 'LUMINOVA_CERTIFICATES', kind: 'array', url: CERTS_URL, fallback: 'certificates.js' }
    };

    const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

    const makeQuestionPreview = (text, maxLength = 160) => {
        const value = String(text || "").trim();
        if (value.length <= maxLength) return value;
        return value.slice(0, maxLength).trim() + "...";
    };

    const normalizeSearchText = (value) =>
        String(value || "")
            .toLowerCase()
            .trim();

    const questionMatchesSearch = (question, query) => {
        const q = normalizeSearchText(query);
        if (!q) return true;

        const optionsText = Array.isArray(question.options)
            ? question.options.map(opt =>
                typeof opt === "object" && opt !== null
                    ? [opt.text, opt.label, opt.value, opt.id].join(" ")
                    : String(opt || "")
            ).join(" ")
            : "";

        const searchBody = [
            question.questionId,
            question.id,
            question.uuid,
            question.questionText,
            question.text,
            question.textAr,
            question.title,
            question.prompt,
            optionsText,
            question.modelAnswer,
            question.correctAnswerText,
            question.answer,
            question.explanation,
            question.feedback,
            Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers.join(" ") : "",
            Array.isArray(question.correctAnswers) ? question.correctAnswers.join(" ") : "",
            Array.isArray(question.correctOptionIds) ? question.correctOptionIds.join(" ") : ""
        ].join(" ").toLowerCase();

        return searchBody.includes(q);
    };

    const resolveModelAnswerForPrepare = (question) => {
        const asText = (value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "string") return value.trim();
            if (typeof value === "number" || typeof value === "boolean") return String(value);
            if (Array.isArray(value)) {
                return value.map(asText).filter(Boolean).join(" | ");
            }
            if (typeof value === "object") {
                return String(
                    value.text ??
                    value.label ??
                    value.name ??
                    value.title ??
                    value.value ??
                    value.id ??
                    ""
                ).trim();
            }
            return "";
        };

        const options = Array.isArray(question.options) ? question.options : [];

        const optionRecords = options.map((opt, index) => {
            if (Array.isArray(opt)) {
                return {
                    index,
                    id: asText(opt[0]),
                    value: asText(opt[0]),
                    key: asText(opt[0]),
                    text: asText(opt[1] ?? opt[0]),
                    letter: String.fromCharCode(65 + index)
                };
            }

            if (typeof opt === "object" && opt) {
                return {
                    index,
                    id: asText(opt.id),
                    value: asText(opt.value),
                    key: asText(opt.key),
                    text: asText(opt.text ?? opt.label ?? opt.name ?? opt.title ?? opt.value ?? opt.id),
                    letter: String.fromCharCode(65 + index)
                };
            }

            return {
                index,
                id: String(index),
                value: String(index),
                key: String(index),
                text: asText(opt),
                letter: String.fromCharCode(65 + index)
            };
        });

        const resolveOptionText = (candidate) => {
            const raw = asText(candidate);
            if (!raw) return "";

            const match = optionRecords.find((opt) => {
                return (
                    String(opt.id) === raw ||
                    String(opt.value) === raw ||
                    String(opt.key) === raw ||
                    String(opt.index) === raw ||
                    String(opt.letter).toLowerCase() === raw.toLowerCase()
                );
            });

            if (match && match.text) return match.text;

            return "";
        };

        const resolveArray = (values) => {
            if (!Array.isArray(values)) return "";

            const resolved = values
                .map((value) => resolveOptionText(value) || asText(value))
                .filter(Boolean);

            return resolved.join(" | ");
        };

        const fromCorrectOptionIds = resolveArray(question.correctOptionIds);
        if (fromCorrectOptionIds) return fromCorrectOptionIds;

        const fromAcceptedAnswers = resolveArray(question.acceptedAnswers);
        if (fromAcceptedAnswers) return fromAcceptedAnswers;

        const fromCorrectAnswers = resolveArray(question.correctAnswers);
        if (fromCorrectAnswers) return fromCorrectAnswers;

        const direct =
            asText(question.modelAnswer) ||
            asText(question.correctAnswerText) ||
            asText(question.answer);

        if (direct) {
            const mapped = resolveOptionText(direct);
            return mapped || direct;
        }

        return "";
    };

    const buildPrepareExamQuestions = (questions = []) => {
        return (Array.isArray(questions) ? questions : []).map((q, index) => {
            const questionId = String(q.questionId ?? q.id ?? q.uuid ?? `q_${index + 1}`);
            const resolvedModelAnswer = resolveModelAnswerForPrepare(q);
            
            console.log("[Luminova Prepare ModelAnswer]", {
                questionId: questionId,
                resolvedModelAnswer: resolvedModelAnswer,
                type: q.type || "mcq"
            });
            
            return {
                questionId: questionId,
                originalIndex: Number(q.originalIndex ?? q.original_index ?? q.index ?? index),
                type: String(q.type || "mcq"),
                questionText: String(q.questionText ?? q.text ?? q.textAr ?? q.title ?? q.prompt ?? ""),
                modelAnswer: resolvedModelAnswer,
                explanation: String(q.explanation ?? q.feedback ?? q.reason ?? ""),
                maxPoints: Number(q.maxPoints ?? q.points ?? q.score ?? 1),
                acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(String) : [],
                correctOptionIds: Array.isArray(q.correctOptionIds) ? q.correctOptionIds.map(String) : []
            };
        });
    };

    const stripTrailingSemicolon = (value) => String(value || '').trim().replace(/;\s*$/, '').trim();

    const createExamSourceError = (status, msg, originalError = null) => {
        const err = new Error(msg);
        err.status = status;
        err.originalError = originalError;
        return err;
    };

    const extractPackJson = (rawText) => {
        const assignmentPattern = /(?:window\s*\.\s*)?__LUMINOVA_EXAM_PACK__\s*=\s*/g;
        const match = assignmentPattern.exec(String(rawText || ""));
        if (!match) return null;

        const startIdx = rawText.indexOf('{', match.index + match[0].length);
        if (startIdx === -1) return null;

        let depth = 0;
        let inString = false;
        let escape = false;

        for (let i = startIdx; i < rawText.length; i += 1) {
            const char = rawText[i];
            if (inString) {
                if (escape) { escape = false; continue; }
                if (char === '\\') { escape = true; continue; }
                if (char === '"') { inString = false; }
                continue;
            }
            if (char === '"') { inString = true; continue; }
            if (char === '{') { depth += 1; continue; }
            if (char === '}') {
                depth -= 1;
                if (depth === 0) return rawText.slice(startIdx, i + 1);
                if (depth < 0) return null;
            }
        }
        return null;
    };

    const decodeLxp2ExamPackForCms = (pack) => {
        if (!pack || pack.v !== 2 || pack.alg !== "luminova-lxp-v2") {
            throw createExamSourceError("UNSUPPORTED_PACK_VERSION", "نسخة أو خوارزمية ملف الاختبارات غير مدعومة (LXP2 v2).");
        }

        const base64UrlToBase64 = (value) => {
            let base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
            while (base64.length % 4) base64 += "=";
            return base64;
        };

        const base64UrlToBytes = (value) => {
            const binary = atob(base64UrlToBase64(value));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        };

        const decodeUtf8 = (bytes) => {
            return new TextDecoder().decode(bytes);
        };

        const unpackQuestion = (q) => ({
            questionId: q?.[0] || "",
            id: q?.[0] || "",
            originalIndex: Number(q?.[1] || 0),
            type: q?.[2] || "mcq",
            questionText: q?.[3] || "",
            text: q?.[3] || "",
            textAr: q?.[3] || "",
            prompt: q?.[3] || "",
            options: Array.isArray(q?.[4])
                ? q[4].map(opt => (Array.isArray(opt) ? (opt[1] || opt[0] || "") : (opt || "")))
                : [],
            maxPoints: Number(q?.[5] || 1),
            score: Number(q?.[5] || 1),
            points: Number(q?.[5] || 1),
            modelAnswer: q?.[6] || "",
            correctAnswerText: q?.[6] || "",
            explanation: q?.[7] || "",
            feedback: q?.[7] || "",
            correctAnswers: Array.isArray(q?.[8]) ? q[8] : [],
            correctOptionIds: Array.isArray(q?.[9]) ? q[9] : [],
            acceptedAnswers: Array.isArray(q?.[10]) ? q[10] : []
        });

        const unpackExam = (e) => {
            const rawStatus = e?.[18] || "";
            const pubStatus = String(rawStatus).trim().toLowerCase();
            const isPub = pubStatus !== "draft" && pubStatus !== "disabled" && pubStatus !== "inactive" && pubStatus !== "false";
            const settings = e?.[19] || {};

            return {
                schemaVersion: 2,
                quizId: e?.[0] || "",
                id: e?.[0] || "",
                code: e?.[0] || "",
                title: e?.[1] || "",
                titleAr: e?.[2] || e?.[1] || "",
                titleEn: e?.[3] || e?.[1] || "",
                examMode: e?.[4] || "practice",
                mode: e?.[4] || "practice",
                webhookUrl: e?.[5] || "",
                resultSpreadsheetId: e?.[6] || "",
                spreadsheetId: e?.[6] || "",
                sheetName: e?.[7] || "",
                schemaHash: e?.[8] || "",
                preparedSchemaHash: e?.[9] || e?.[8] || "",
                expectedQuestionCount: Number(e?.[10] || 0),
                maxScore: Number(e?.[11] || 0),
                questions: Array.isArray(e?.[12]) ? e[12].map(unpackQuestion) : [],
                subjectId: e?.[13] || "",
                subject_id: e?.[13] || "",
                courseId: e?.[13] || "",
                categoryId: e?.[14] || "",
                levelId: e?.[15] || "",
                duration: Number(e?.[16] || 0),
                timeLimit: Number(e?.[16] || 0),
                passingScore: Number(e?.[17] || 0),
                status: rawStatus || "published",
                publishStatus: rawStatus || "published",
                isPublished: isPub,
                published: isPub,
                isActive: isPub,
                active: isPub,
                visible: isPub,
                enabled: isPub,

                // Settings Contract
                duplicatePolicy: settings.duplicatePolicy || "prevent_by_email",
                allowRetakes: settings.allowRetakes !== undefined ? !!settings.allowRetakes : false,
                maxAttempts: settings.maxAttempts !== undefined && settings.maxAttempts !== null ? Number(settings.maxAttempts) : 1,
                showResult: settings.showResult !== undefined ? !!settings.showResult : (settings.showResultsAfter !== undefined ? !!settings.showResultsAfter : true),
                resultDisplayMode: settings.resultDisplayMode || "score_with_answers_and_explanations",
                showScore: settings.showScore !== undefined ? !!settings.showScore : true,
                showPercentage: settings.showPercentage !== undefined ? !!settings.showPercentage : true,
                showCorrectAnswers: settings.showCorrectAnswers !== undefined ? !!settings.showCorrectAnswers : true,
                showModelAnswers: settings.showModelAnswers !== undefined ? !!settings.showModelAnswers : true,
                showExplanations: settings.showExplanations !== undefined ? !!settings.showExplanations : true,
                allowReviewAfterSubmit: settings.allowReviewAfterSubmit !== undefined ? !!settings.allowReviewAfterSubmit : true,
                startTime: settings.startTime ?? "",
                endTime: settings.endTime ?? "",
                antiCheat: settings.antiCheat && typeof settings.antiCheat === 'object' ? { ...settings.antiCheat } : {},
                latePolicy: settings.latePolicy ?? "hard_stop"
            };
        };

        const chunks = Array.isArray(pack.chunks) ? [...pack.chunks].reverse() : [];
        const payloadBase64 = chunks.join("");
        if (String(payloadBase64.length) !== String(pack.checksum || "")) {
            throw createExamSourceError("CHECKSUM_MISMATCH", "فشل مطابقة الـ Checksum الخاص بملف الاختبارات.");
        }
        const payloadBytes = base64UrlToBytes(payloadBase64);
        const saltBytes = base64UrlToBytes(pack.salt);
        if (!saltBytes.length) {
            throw createExamSourceError("INVALID_LXP2_PACK", "ملح التشفير (salt) الخاص بالملف غير صالح.");
        }
        for (let i = 0; i < payloadBytes.length; i++) {
            payloadBytes[i] ^= saltBytes[i % saltBytes.length];
        }
        const json = decodeUtf8(payloadBytes);
        let payload;
        try {
            payload = JSON.parse(json);
        } catch (e) {
            throw createExamSourceError("PARSE_ERROR", "فشل في فك تشفير محتوى حزمة LXP2 وتحليله كـ JSON.", e);
        }
        if (!Array.isArray(payload) || payload[0] !== "LXP2" || !Array.isArray(payload[1])) {
            throw createExamSourceError("INVALID_LXP2_PACK", "تنسيق حزمة LXP2 المصفك غير صالح.");
        }
        
        try {
            return payload[1].map(unpackExam);
        } catch (e) {
            throw createExamSourceError("NORMALIZATION_ERROR", "فشل في تسوية (normalize) بيانات الاختبارات بعد فك التشفير.", e);
        }
    };

    const parseLuminovaPayload = (text, target) => {
        const schema = FILE_SCHEMAS[target];
        if (!schema) throw new Error(`نوع بيانات غير معروف: ${target}`);

        const raw = String(text || '').replace(/^\uFEFF/, '').trim();

        if (target === 'exams') {
            const packText = extractPackJson(raw);
            if (!packText) {
                throw createExamSourceError(
                    "WRAPPER_NOT_FOUND",
                    "ملف الاختبارات لا يحتوي على الغلاف المناسب (__LUMINOVA_EXAM_PACK__)."
                );
            }
            let pack;
            try {
                pack = JSON.parse(packText);
            } catch (error) {
                throw createExamSourceError(
                    "PARSE_ERROR",
                    "فشل في تحليل كود JSON الخاص بالغلاف.",
                    error
                );
            }
            return decodeLxp2ExamPackForCms(pack);
        }

        const candidates = [raw];
        const assignmentRegex = new RegExp(`(?:window\\.)?_?_?${schema.variable}_?_?\\s*=\\s*([\\s\\S]*?)\\s*;?\\s*$`);
        const assignmentMatch = raw.match(assignmentRegex);
        if (assignmentMatch && assignmentMatch[1]) candidates.unshift(assignmentMatch[1]);

        const opener = schema.kind === 'array' ? '[' : '{';
        const closer = schema.kind === 'array' ? ']' : '}';
        const start = raw.indexOf(opener);
        const end = raw.lastIndexOf(closer);
        if (start !== -1 && end > start) candidates.push(raw.substring(start, end + 1));

        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(stripTrailingSemicolon(candidate));
                const isValid = schema.kind === 'array'
                    ? Array.isArray(parsed)
                    : parsed && typeof parsed === 'object' && !Array.isArray(parsed);
                if (isValid) return parsed;
            } catch (error) {
                // جرّب صيغاً أضيق قبل إظهار خطأ القراءة.
            }
        }

        throw new Error(`تعذر قراءة ${schema.variable} كبيانات JSON من نوع ${schema.kind}.`);
    };

    const assignLuminovaPayload = (target, payload) => {
        const schema = FILE_SCHEMAS[target];
        if (!schema) return;
        window[schema.variable] = payload;
    };

    // أدوات تهيئة جلب الملفات من جيت هب
    const withCacheBust = (url) => {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}lmv=${Date.now()}`;
    };

    const parseGithubRawUrl = (url) => {
        try {
            const u = new URL(url);
            if (u.hostname === 'raw.githubusercontent.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                if (parts.length >= 3) {
                    return {
                        owner: parts[0],
                        repo: parts[1],
                        branch: parts[2],
                        path: parts.slice(3).join('/')
                    };
                }
            }
        } catch (e) {
            console.error("Failed to parse GitHub URL:", url, e);
        }
        return null;
    };

    const getGithubLastCommit = async (url) => {
        const meta = parseGithubRawUrl(url);
        if (!meta) return null;
        try {
            const apiUrl = `https://api.github.com/repos/${meta.owner}/${meta.repo}/commits?path=${encodeURIComponent(meta.path)}&sha=${encodeURIComponent(meta.branch)}&per_page=1`;
            const res = await fetch(withCacheBust(apiUrl), {
                cache: "no-store",
                headers: {
                    Accept: "application/vnd.github+json"
                }
            });
            if (!res.ok) return null;
            const commits = await res.json();
            const commit = Array.isArray(commits) ? commits[0] : null;
            return commit ? (commit.commit?.committer?.date || commit.commit?.author?.date || null) : null;
        } catch (e) {
            console.warn("Failed to fetch commit meta:", e);
            return null;
        }
    };

    const calculateSourceHash = async (text) => {
        try {
            const bytes = new TextEncoder().encode(text);
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            return Array.from(new Uint8Array(digest))
                .map(byte => byte.toString(16).padStart(2, "0"))
                .join("");
        } catch (e) {
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0;
            }
            return String(hash);
        }
    };

    const fetchGithubSource = async ({ key, label, url }) => {
        const result = {
            key,
            label,
            url,
            status: 'SUCCESS',
            msg: '',
            data: null,
            hash: null,
            fetchedAt: new Date().toLocaleString('ar-EG'),
            githubUpdatedAt: null
        };

        try {
            const commitTime = await getGithubLastCommit(url);
            if (commitTime) {
                result.githubUpdatedAt = new Date(commitTime).toLocaleString('ar-EG');
            }
        } catch (e) {
            console.warn(`Failed to fetch metadata for ${label}:`, e);
        }

        try {
            const response = await fetch(withCacheBust(url), {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    Accept: 'text/plain, application/javascript'
                }
            });

            if (response.status === 404) {
                result.status = '404_NOT_FOUND';
                result.msg = `ملف ${label} غير موجود على GitHub. قد يكون الملف قد تم حذفه أو تغيير مساره.`;
                return result;
            }

            if (!response.ok) {
                result.status = 'HTTP_ERROR';
                result.msg = `خطأ في الاستجابة من GitHub (رمز الحالة: ${response.status}).`;
                return result;
            }

            const text = await response.text();
            if (!text || !text.trim()) {
                result.status = 'EMPTY_FILE';
                result.msg = `ملف ${label} فارغ أو لا يحتوي على بيانات.`;
                return result;
            }

            result.hash = await calculateSourceHash(text);

            try {
                const parsed = parseLuminovaPayload(text, key);
                result.data = parsed;
            } catch (parseError) {
                console.error(`Parse error for ${label}:`, parseError);
                if (parseError.status) {
                    result.status = parseError.status;
                    result.msg = parseError.message;
                } else if (key === 'exams' && (text.includes('__LUMINOVA_EXAM_PACK__') || text.includes('luminova-lxp-v2'))) {
                    result.status = 'INVALID_LXP2_PACK';
                    result.msg = `تم تحميل ملف الاختبارات من GitHub، لكن تنسيق LXP2 غير صالح أو غير مدعوم.`;
                } else {
                    result.status = 'PARSE_ERROR';
                    result.msg = `تم تحميل ملف ${label} من GitHub، لكن تنسيقه غير صالح أو غير مدعوم.`;
                }
            }

        } catch (networkError) {
            console.error(`Network error for ${label}:`, networkError);
            result.status = 'NETWORK_ERROR';
            result.msg = `تعذر الاتصال بملف ${label} على GitHub. تحقق من اتصال الإنترنت أو صلاحية الرابط، ثم أعد المحاولة.`;
        }

        return result;
    };

    const encodeLxp2ExamPack = (normalizedExams) => {
        // --- LXP2 Positional Pack Helpers ---
        const asText = (value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "string") return value;
          if (typeof value === "number" || typeof value === "boolean") return String(value);

          if (typeof value === "object") {
            return String(
              value.text ??
              value.textAr ??
              value.textEn ??
              value.label ??
              value.title ??
              value.name ??
              value.value ??
              value.id ??
              ""
            );
          }
          return "";
        };

        const asId = (value, fallback = "") => {
          if (value === null || value === undefined) return String(fallback);
          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return String(value);
          }
          if (typeof value === "object") {
            return String(
              value.id ??
              value.value ??
              value.key ??
              value.code ??
              value.text ??
              value.label ??
              fallback
            );
          }
          return String(fallback);
        };

        const asNumber = (value, fallback = 0) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };

        const asTextArray = (value) => {
          if (!Array.isArray(value)) return [];
          return value.map(item => asText(item)).filter(Boolean);
        };

        const asIdArray = (value) => {
          if (!Array.isArray(value)) return [];
          return value.map((item, index) => asId(item, index)).filter(Boolean);
        };

        const packOption = (opt, index) => [
          asId(opt?.id ?? opt?.value ?? opt, index),
          asText(opt)
        ];

        const packQuestion = (q, index) => [
          asId(q.questionId ?? q.id ?? q.uuid, `q_${index + 1}`),
          asNumber(q.originalIndex ?? q.original_index, index),
          asText(q.type || "mcq"),
          asText(q.questionText ?? q.text ?? q.title ?? q.prompt),
          Array.isArray(q.options) ? q.options.map(packOption) : [],
          asNumber(q.maxPoints ?? q.points ?? q.score, 1),
          asText(q.modelAnswer ?? q.correctAnswerText ?? q.answer),
          asText(q.explanation ?? q.reason ?? q.feedback),
          asTextArray(q.correctAnswers),
          asIdArray(q.correctOptionIds),
          asTextArray(q.acceptedAnswers)
        ];

        const packExam = (exam) => {
          const questions = Array.isArray(exam.questions) ? exam.questions : [];
          const packedQuestions = questions.map(packQuestion);

          const maxScore = asNumber(
            exam.maxScore,
            packedQuestions.reduce((sum, q) => sum + asNumber(q[5], 1), 0)
          );

          const settings = {
            duplicatePolicy: exam.duplicatePolicy || "prevent_by_email",
            allowRetakes: !!exam.allowRetakes,
            maxAttempts: exam.maxAttempts !== undefined && exam.maxAttempts !== null ? Number(exam.maxAttempts) : 1,
            showResult: exam.showResult !== undefined ? !!exam.showResult : true,
            resultDisplayMode: exam.resultDisplayMode || "score_with_answers_and_explanations",
            showScore: exam.showScore !== undefined ? !!exam.showScore : true,
            showPercentage: exam.showPercentage !== undefined ? !!exam.showPercentage : true,
            showCorrectAnswers: exam.showCorrectAnswers !== undefined ? !!exam.showCorrectAnswers : true,
            showModelAnswers: exam.showModelAnswers !== undefined ? !!exam.showModelAnswers : true,
            showExplanations: exam.showExplanations !== undefined ? !!exam.showExplanations : true,
            allowReviewAfterSubmit: exam.allowReviewAfterSubmit !== undefined ? !!exam.allowReviewAfterSubmit : true,
            startTime: exam.startTime || "",
            endTime: exam.endTime || "",
            antiCheat: exam.antiCheat || {},
            latePolicy: exam.latePolicy || "hard_stop"
          };

          return [
            asId(exam.quizId ?? exam.id ?? exam.code),
            asText(exam.title ?? exam.titleAr ?? exam.name),
            asText(exam.titleAr ?? exam.title ?? exam.name),
            asText(exam.titleEn ?? exam.title),
            asText(exam.examMode ?? exam.mode ?? "practice"),
            asText(exam.webhookUrl),
            asText(exam.resultSpreadsheetId ?? exam.spreadsheetId),
            asText(exam.sheetName),
            asText(exam.schemaHash),
            asText(exam.preparedSchemaHash ?? exam.schemaHash),
            asNumber(exam.expectedQuestionCount, packedQuestions.length),
            maxScore,
            packedQuestions,
            asId(exam.subjectId ?? exam.subject_id ?? exam.courseId),
            asId(exam.categoryId ?? exam.category),
            asId(exam.levelId ?? exam.level),
            asNumber(exam.duration ?? exam.timeLimit ?? exam.time),
            asNumber(exam.passingScore ?? exam.passScore ?? exam.passing),
            asText(exam.publishStatus ?? exam.status ?? "published"),
            settings
          ];
        };

        const bytesToBase64 = (bytes) => {
          const chunkSize = 0x8000;
          let binary = "";
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            let chunkString = "";
            for (let j = 0; j < chunk.length; j++) {
              chunkString += String.fromCharCode(chunk[j]);
            }
            binary += chunkString;
          }
          return btoa(binary);
        };

        const base64ToBase64Url = (value) => {
          return value
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
        };

        const packedPayload = [
          "LXP2",
          normalizedExams.map(packExam)
        ];

        let json;
        try {
          json = JSON.stringify(packedPayload);
        } catch (err) {
          console.error("Exam pack payload is not JSON-safe", err);
          throw err;
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(json);

        const saltBytes = new Uint8Array(32);
        window.crypto.getRandomValues(saltBytes);

        for (let i = 0; i < bytes.length; i++) {
          bytes[i] ^= saltBytes[i % saltBytes.length];
        }

        const saltBase64 = base64ToBase64Url(bytesToBase64(saltBytes));
        const payloadBase64 = base64ToBase64Url(bytesToBase64(bytes));

        const chunkSize = 12000;
        const chunks = [];

        for (let i = 0; i < payloadBase64.length; i += chunkSize) {
          chunks.push(payloadBase64.slice(i, i + chunkSize));
        }

        chunks.reverse();

        const pack = {
          v: 2,
          alg: "luminova-lxp-v2",
          createdAt: new Date().toISOString(),
          salt: saltBase64,
          checksum: String(payloadBase64.length),
          meta: {
            examsCount: normalizedExams.length,
            chunksCount: chunks.length,
            payloadLength: bytes.length,
            build: "lxp2-positional-v1"
          },
          chunks
        };

        const outStr = `(function () {
  "use strict";

  window.__LUMINOVA_EXAM_PACK__ = ${JSON.stringify(pack, null, 2)};
})();`;

        return outStr;
    };

    const getExamIdentity = (exam) => normalizeText(exam?.quizId || exam?.examId || exam?.examCode || exam?.code || exam?.id);

    const getQuestionSignature = (question) => {
        if (!question || typeof question !== 'object') return '';
        const textAr = normalizeText(question.textAr || question.questionAr || question.promptAr);
        const textEn = normalizeText(question.textEn || question.questionEn || question.promptEn);
        const text = normalizeText(question.text || question.question || question.prompt);
        const optionText = Array.isArray(question.options)
            ? question.options.map(opt => {
                if (opt && typeof opt === 'object') {
                    return normalizeText(opt.textAr || opt.textEn || opt.text || opt.label || opt.value);
                }
                return normalizeText(opt);
            }).join('|')
            : '';
        const correctText = Array.isArray(question.correctAnswers)
            ? question.correctAnswers.map(normalizeText).sort().join('|')
            : normalizeText(question.correctAnswer);
        const answerText = normalizeText(question.modelAnswer || question.answer);
        if (!textAr && !textEn && !text && !optionText && !correctText && !answerText) return '';
        return [
            normalizeText(question.type || 'mcq'),
            textAr,
            textEn,
            text,
            optionText,
            correctText,
            answerText
        ].join('::');
    };

    const getQuestionKeys = (question) => {
        const keys = [];
        if (question?.id) keys.push(`id:${normalizeText(question.id)}`);
        if (question?.questionId) keys.push(`questionId:${normalizeText(question.questionId)}`);
        const signature = getQuestionSignature(question);
        if (signature.replace(/[:|]/g, '').trim()) keys.push(`sig:${signature}`);
        return keys;
    };

    const createStableId = (prefix = 'id', usedIds = new Set()) => {
        let id;
        do {
            id = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        } while (usedIds.has(id));
        usedIds.add(id);
        return id;
    };

    const mergeExamMetadata = (existing, incoming) => {
        const merged = { ...existing };
        Object.entries(incoming || {}).forEach(([key, value]) => {
            if (key === 'questions' || value === undefined || value === null || value === '') return;
            if (['id', 'examCode', 'examId', 'code'].includes(key)) {
                if (!merged[key]) merged[key] = value;
                return;
            }
            const current = merged[key];
            const currentIsEmpty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
            if (currentIsEmpty) merged[key] = value;
        });
        return merged;
    };

    const createQuestionId = (usedIds) => {
        let id;
        do {
            id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        } while (usedIds.has(id));
        usedIds.add(id);
        return id;
    };

    const addUniqueQuestions = (targetQuestions, incomingQuestions, stats) => {
        const existingKeys = new Set();
        const usedIds = new Set();

        targetQuestions.forEach(question => {
            if (question?.id) usedIds.add(String(question.id));
            getQuestionKeys(question).forEach(key => existingKeys.add(key));
        });

        (incomingQuestions || []).forEach(question => {
            if (!question || typeof question !== 'object') return;
            const keys = getQuestionKeys(question);
            const isDuplicate = keys.length > 0 && keys.some(key => existingKeys.has(key));
            if (isDuplicate) {
                stats.skippedDuplicateQuestions++;
                return;
            }

            const nextQuestion = { ...question };
            if (!nextQuestion.id || usedIds.has(String(nextQuestion.id))) {
                nextQuestion.id = createQuestionId(usedIds);
            } else {
                usedIds.add(String(nextQuestion.id));
            }

            targetQuestions.push(nextQuestion);
            getQuestionKeys(nextQuestion).forEach(key => existingKeys.add(key));
            stats.addedQuestions++;
        });
    };

    const mergeExamCollections = (baseExams = [], incomingExams = []) => {
        const stats = {
            createdExams: 0,
            mergedExams: 0,
            ignoredExams: 0,
            addedQuestions: 0,
            skippedDuplicateQuestions: 0,
            finalQuestionCount: 0
        };
        const merged = (Array.isArray(baseExams) ? baseExams : []).map(exam => ({
            ...exam,
            questions: Array.isArray(exam?.questions) ? [...exam.questions] : []
        }));
        const indexByIdentity = new Map();

        merged.forEach((exam, index) => {
            const identity = getExamIdentity(exam);
            if (identity) indexByIdentity.set(identity, index);
        });

        (Array.isArray(incomingExams) ? incomingExams : []).forEach(incoming => {
            const identity = getExamIdentity(incoming);
            if (!identity) {
                stats.ignoredExams++;
                return;
            }

            const existingIndex = indexByIdentity.get(identity);
            if (existingIndex !== undefined) {
                const existing = merged[existingIndex];
                const questions = Array.isArray(existing.questions) ? [...existing.questions] : [];
                addUniqueQuestions(questions, Array.isArray(incoming.questions) ? incoming.questions : [], stats);
                merged[existingIndex] = { ...mergeExamMetadata(existing, incoming), questions };
                stats.mergedExams++;
                return;
            }

            const questions = [];
            addUniqueQuestions(questions, Array.isArray(incoming.questions) ? incoming.questions : [], stats);
            const nextExam = { ...incoming, questions };
            merged.push(nextExam);
            indexByIdentity.set(identity, merged.length - 1);
            stats.createdExams++;
        });

        stats.finalQuestionCount = merged.reduce((total, exam) => total + ((exam.questions || []).length), 0);
        return { exams: merged, stats };
    };

    const parseEmailList = (value) => String(value || '')
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);

    const isSheetNameValid = (value) => {
        const name = String(value || '').trim();
        return !!name && name.length <= 100 && !/[\[\]\*\/\\\?:]/.test(name);
    };

    const sanitizeSheetName = (value, fallback = 'Exam') => {
        const safe = String(value || fallback)
            .replace(/[\[\]\*\/\\\?:]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 90);
        return safe || fallback;
    };

    const validateWebhookUrl = (value) => {
        const urlText = String(value || '').trim();
        if (!urlText) return { ok: false, message: 'رابط سكربت جوجل غير موجود. لا يمكن نشر الاختبار قبل ضبط رابط التسليم.' };
        try {
            const url = new URL(urlText);
            const isGasHost = url.hostname === 'script.google.com';
            const isExec = /\/exec\/?$/.test(url.pathname);
            const isDev = /\/dev\/?$/.test(url.pathname);
            if (!isGasHost || !isExec || isDev) {
                return { ok: false, message: isDev ? 'رابط تطبيق الويب يشير إلى /dev. استخدم رابط النشر /exec.' : 'رابط تطبيق الويب غير صالح. يجب أن يكون رابط سكربت جوجل منتهيًا بـ /exec.' };
            }
            return { ok: true, message: 'تم ضبط رابط /exec صالح.' };
        } catch (error) {
            return { ok: false, message: 'رابط تطبيق الويب غير صالح.' };
        }
    };

    const canonicalStringify = (value) => {
        if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
        if (value && typeof value === 'object') {
            return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
        }
        return JSON.stringify(value);
    };

    const stableHash = (value) => {
        const text = typeof value === 'string' ? value : canonicalStringify(value);
        let hash = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return `fnv1a_${hash.toString(16).padStart(8, '0')}`;
    };

    const normalizeExamQuestions = (questions = []) => {
        const usedIds = new Set();
        return (Array.isArray(questions) ? questions : []).map((question, index) => {
            const nextQuestion = { ...(question || {}) };
            let stableId = nextQuestion.id || nextQuestion.questionId;
            if (!stableId || usedIds.has(String(stableId))) {
                stableId = createQuestionId(usedIds);
            } else {
                usedIds.add(String(stableId));
            }
            nextQuestion.id = String(stableId);
            nextQuestion.questionId = String(nextQuestion.questionId || stableId);
            nextQuestion.originalIndex = index;
            nextQuestion.type = nextQuestion.type || 'mcq';
            nextQuestion.score = Number(nextQuestion.score || 1);
            return nextQuestion;
        });
    };

    const buildQuestionsMatrix = (questions = []) => normalizeExamQuestions(questions).map((question, index) => ({
        index,
        id: question.id,
        questionId: question.questionId,
        type: question.type || 'mcq',
        score: Number(question.score || 1),
        text: question.text || question.textAr || question.textEn || '',
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers : [],
        modelAnswer: question.modelAnswer || question.modelAnswerAr || '',
        explanation: question.explanation || question.explanationAr || ''
    }));

    const getExamTitle = (exam) => exam?.titleAr || exam?.titleEn || exam?.title || exam?.examCode || exam?.id || '';

    const makeDefaultSheetName = (exam) => {
        const quizId = sanitizeSheetName(exam?.quizId || exam?.examId || exam?.examCode || exam?.code || exam?.id || Date.now().toString(36), 'quiz');
        return sanitizeSheetName(`Exam_${quizId}`, 'Exam');
    };

    const buildSchemaHash = (exam) => {
        const questions = normalizeExamQuestions(exam?.questions || []);
        const payload = {
            quizId: exam?.quizId || '',
            sheetName: exam?.sheetName || '',
            expectedQuestionCount: questions.length,
            questions: questions.map(question => ({
                questionId: question.questionId,
                type: question.type || 'mcq',
                score: Number(question.score || 1)
            }))
        };
        return stableHash(payload);
    };

    const getDerivedSubmissionStatus = (exam) => {
        if (exam?.examMode !== 'evaluation' || exam?.transactionalSubmissionEnabled !== true) return exam.submissionStatus || 'not_tested';
        if (!exam?.webhookUrl || !exam?.sheetName) return 'not_configured';
        const schemaHash = exam.schemaHash || buildSchemaHash(exam);
        if (exam.preparedSchemaHash && exam.preparedSchemaHash !== schemaHash) return 'schema_changed_after_prepare';
        if (exam.preparedSchemaHash && exam.preparedSchemaHash === schemaHash) {
            return exam.submissionStatus === 'tested' ? 'ready_for_students' : (exam.submissionStatus || 'prepared');
        }
        return exam.submissionStatus || 'not_tested';
    };

    const normalizeExamForControl = (exam = {}, options = {}) => {
        const identitySeed = exam.quizId || exam.examId || exam.examCode || exam.code || exam.id;
        const quizId = identitySeed ? String(identitySeed) : createStableId('quiz');
        const questions = normalizeExamQuestions(exam.questions || []);
        const transactionalSubmissionEnabled = exam.transactionalSubmissionEnabled !== undefined
            ? exam.transactionalSubmissionEnabled === true
            : options.defaultTransactional === true;

        const isEvaluation = exam.examMode === 'evaluation';
        const duplicatePolicy = isEvaluation ? 'prevent_by_email' : (exam.duplicatePolicy || 'prevent_by_email');
        const allowRetakes = isEvaluation ? false : (exam.allowRetakes !== undefined ? !!exam.allowRetakes : false);
        const allowRetry = isEvaluation ? false : (exam.allowRetry !== undefined ? !!exam.allowRetry : allowRetakes);
        const maxAttempts = isEvaluation ? 1 : (exam.maxAttempts !== undefined && exam.maxAttempts !== null ? Number(exam.maxAttempts) : 1);
        const showResult = exam.showResult !== undefined ? !!exam.showResult : (exam.showResultsAfter !== undefined ? !!exam.showResultsAfter : true);
        const resultDisplayMode = exam.resultDisplayMode || 'score_with_answers_and_explanations';
        const showScore = exam.showScore !== undefined ? !!exam.showScore : true;
        const showPercentage = exam.showPercentage !== undefined ? !!exam.showPercentage : true;
        const showCorrectAnswers = exam.showCorrectAnswers !== undefined ? !!exam.showCorrectAnswers : true;
        const showModelAnswers = exam.showModelAnswers !== undefined ? !!exam.showModelAnswers : true;
        const showExplanations = exam.showExplanations !== undefined ? !!exam.showExplanations : true;
        const allowReviewAfterSubmit = exam.allowReviewAfterSubmit !== undefined ? !!exam.allowReviewAfterSubmit : true;
        const startTime = exam.startTime ?? "";
        const endTime = exam.endTime ?? "";
        const antiCheat = exam.antiCheat && typeof exam.antiCheat === 'object' ? { ...exam.antiCheat } : {};
        const latePolicy = exam.latePolicy ?? "hard_stop";

        const nextExam = {
            ...exam,
            id: exam.id || quizId,
            quizId,
            examCode: exam.examCode || quizId,
            transactionalSubmissionEnabled,
            webhookUrl: exam.webhookUrl || '',
            spreadsheetId: exam.spreadsheetId || '',
            sheetName: exam.sheetName && exam.sheetName !== 'Sheet1' ? sanitizeSheetName(exam.sheetName, 'Exam') : makeDefaultSheetName({ ...exam, quizId }),
            questions,
            expectedQuestionCount: questions.length,

            duplicatePolicy,
            allowRetakes,
            allowRetry,
            maxAttempts,
            showResult,
            resultDisplayMode,
            showScore,
            showPercentage,
            showCorrectAnswers,
            showModelAnswers,
            showExplanations,
            allowReviewAfterSubmit,
            startTime,
            endTime,
            antiCheat,
            latePolicy
        };
        nextExam.schemaHash = buildSchemaHash(nextExam);
        nextExam.submissionStatus = getDerivedSubmissionStatus(nextExam);
        return nextExam;
    };

    const getSubmissionStatusBadge = (status) => {
        const map = {
            not_configured: { label: 'غير مضبوط', cls: 'bg-red-500/10 border-red-500/30 text-red-500' },
            not_tested: { label: 'لم يتم الاختبار', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
            tested: { label: 'تم اختبار الاتصال', cls: 'bg-blue-500/10 border-blue-500/30 text-blue-500' },
            prepared: { label: 'تم تجهيز الشيت', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
            schema_changed_after_prepare: { label: 'تم تعديل الأسئلة بعد التجهيز', cls: 'bg-red-500/10 border-red-500/30 text-red-500' },
            ready_for_students: { label: 'جاهز للطلاب', cls: 'bg-green-500/10 border-green-500/30 text-green-500' }
        };
        return map[status] || map.not_tested;
    };

    const validateExamForExport = (exam) => {
        const errors = [];
        if (exam.examMode !== 'evaluation' || exam.transactionalSubmissionEnabled !== true) return errors;
        const webhook = validateWebhookUrl(exam.webhookUrl);
        if (!webhook.ok) errors.push(webhook.message);
        if (!isSheetNameValid(exam.sheetName)) errors.push('اسم ورقة النتائج غير صالح.');
        if (!exam.quizId) errors.push('هوية الاختبار غير موجودة.');
        if (!Array.isArray(exam.questions) || exam.questions.length === 0) errors.push('لا يمكن نشر اختبار بدون أسئلة.');
        (exam.questions || []).forEach((question, index) => {
            if (!question.id || !question.questionId) errors.push(`السؤال رقم ${index + 1} لا يحتوي على هوية ثابتة.`);
            if (question.originalIndex === undefined || question.originalIndex === null) errors.push(`السؤال رقم ${index + 1} لا يحتوي على originalIndex.`);
        });
        if (exam.expectedQuestionCount !== (exam.questions || []).length) errors.push('عدد الأسئلة المتوقع لا يطابق عدد الأسئلة الفعلي.');
        if (!exam.schemaHash) errors.push('schemaHash غير موجود.');
        if (!exam.preparedSchemaHash) errors.push('لم يتم تجهيز شيت الاختبار بعد. اضغط "تجهيز شيت الاختبار" قبل النشر.');
        if (exam.preparedSchemaHash && exam.preparedSchemaHash !== exam.schemaHash) errors.push('تم تعديل الأسئلة بعد تجهيز الشيت. يجب إعادة تجهيز الشيت قبل النشر.');
        if (exam.submissionStatus === 'schema_changed_after_prepare') errors.push('تم اكتشاف اختلاف بين أسئلة الاختبار والشيت المجهز. يرجى إعادة تجهيز الشيت قبل النشر.');
        return [...new Set(errors)];
    };

    const stripExamForStudentExport = (exam) => {
        const { spreadsheetId, ...publicExam } = exam;
        return publicExam;
    };

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
            appName: "لومينوفا التعليمية", home: "الرئيسية", community: "مجتمع الطلاب", academic: "المكتبة الأكاديمية",
            adminToggle: "الإدارة", founder: "المؤسس", vip: "مميز", verified: "موثوق", doctor: "دكتور",
            readMore: "عرض المزيد", readLess: "عرض أقل", searchPlaceholder: "ابحث هنا...", emptyState: "لا يوجد بيانات لعرضها.",
            years: "الفرق الدراسية", semesters: "الفصول الدراسية", subjects: "المواد الدراسية",
            summaries: "التلخيصات", quizzes: "الاختبارات", startQuiz: "بدء الاختبار", questions: "الأسئلة",
            quitWarning: "هل أنت متأكد من الخروج؟ سيتم فقدان التقدم.", score: "الدرجة",
            modelAnswer: "الإجابة النموذجية:", explanation: "التعليل:",
            deleteProtected: "لا يمكن الحذف.. الرجاء مسح المحتويات الداخلية أولاً",
            save: "حفظ", delete: "حذف", cancel: "إلغاء", exportData: "تصدير كود البيانات",
            logout: "خروج الإدارة", passwordPrompt: "أدخل كلمة سر الإدارة:", wrongPassword: "كلمة السر خاطئة!",
            major: "التخصص", correct: "إجابة صحيحة", wrong: "إجابة خاطئة", results: "النتائج",
            topContributors: "شرف المساهمين 🏆", news: "أحدث الأخبار 📢", feed: "الخلاصة 🔥",
            certificates: "الشهادات والتوثيق",
            settings: "إعدادات التسليم",
            merger: "دمج الملفات الذكي 🤖"
        },
        en: {
            appName: "لومينوفا التعليمية", home: "الرئيسية", community: "مجتمع الطلاب", academic: "المكتبة الأكاديمية",
            adminToggle: "الإدارة", founder: "المؤسس", vip: "مميز", verified: "موثوق", doctor: "دكتور",
            readMore: "عرض المزيد", readLess: "عرض أقل", searchPlaceholder: "ابحث هنا...", emptyState: "لا توجد بيانات لعرضها.",
            years: "الفرق الدراسية", semesters: "الفصول الدراسية", subjects: "المواد الدراسية",
            summaries: "التلخيصات", quizzes: "الاختبارات", startQuiz: "بدء الاختبار", questions: "الأسئلة",
            quitWarning: "هل أنت متأكد من الخروج؟ سيتم فقدان التقدم.", score: "الدرجة",
            modelAnswer: "الإجابة النموذجية:", explanation: "التعليل:",
            deleteProtected: "لا يمكن الحذف. الرجاء حذف المحتويات الداخلية أولاً.",
            save: "حفظ", delete: "حذف", cancel: "إلغاء", exportData: "تصدير كود البيانات",
            logout: "خروج الإدارة", passwordPrompt: "أدخل كلمة سر الإدارة:", wrongPassword: "كلمة السر خاطئة!",
            major: "التخصص", correct: "إجابة صحيحة", wrong: "إجابة خاطئة", results: "النتائج",
            topContributors: "شرف المساهمين 🏆", news: "أحدث الأخبار 📢", feed: "الخلاصة 🔥",
            certificates: "أرشيف الشهادات",
            settings: "إعدادات التسليم",
            merger: "دمج الملفات الذكي 🤖"
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
                <${Luminova.Components.Button}
                    variant="ghost"
                    size="sm"
                    onClick=${(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="inline-flex items-center mt-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-0.5 rounded-full font-bold text-xs border border-blue-200 dark:border-blue-700"
                >
                    ${expanded ? Luminova.i18n[lang].readLess : Luminova.i18n[lang].readMore}
                </${Luminova.Components.Button}>
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

            // منطق قراءة عام: أي نص ليس رابط ويب أو بيانات مضمنة يعامل كمسار نسبي
            const isRelative = !urlStr.startsWith('http') && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:') && !urlStr.startsWith('file://');

            // قواعد التعرف على الروابط
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const ytMatch = urlStr.match(ytRegex);

            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${`https://www.youtube.com/embed/${videoId}` || 'about:blank'} title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" className="w-full h-[400px] border-none rounded-xl shadow-lg" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'فتح الرابط بالخارج ↗'}</a>
                        </div>`;
            } else if (urlStr.includes('drive.google.com')) {
                const driveId = urlStr.match(/[-\w]{25,}/);
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${(driveId ? `https://drive.google.com/file/d/${driveId}/preview` : 'about:blank')} width="100%" height="500" allow="autoplay" className="rounded-xl shadow-lg border-2 border-brand-DEFAULT/20 bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'فتح الرابط بالخارج ↗'}</a>
                        </div>`;
            } else if (urlStr.includes('docs.google.com/forms')) {
                embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${urlStr || 'about:blank'} width="100%" height="600" frameBorder="0" marginHeight="0" marginWidth="0" className="rounded-xl shadow-lg bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'فتح الرابط بالخارج ↗'}</a>
                        </div>`;
            } else if (urlStr.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('image/'))) {
                embedContent = html`<div style=${{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }} className="w-full mb-4">
                        <img loading="lazy" src=${urlStr} alt="وسائط تعليمية" className="shadow-lg mx-auto rounded-xl cursor-pointer" onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))} style=${{ maxHeight: '400px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
                    </div>`;
            } else if (urlStr.match(/\.(mp3|wav|ogg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('audio/'))) {
                embedContent = html`<audio controls className="w-full shadow-lg rounded-xl mb-4 bg-gray-100 dark:bg-gray-800 p-2"><source src=${urlStr} type=${isBase64 ? mimeType : `audio/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الصوت.</audio>`;
            } else if (urlStr.match(/\.(mp4|webm)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('video/'))) {
                embedContent = html`<video controls className="w-full max-h-[500px] rounded-xl bg-black shadow-lg mb-4"><source src=${urlStr} type=${isBase64 ? mimeType : `video/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الفيديو.</video>`;
            } else if (urlStr.match(/\.pdf(\?.*)?$/i) || (isBase64 && mimeType === 'application/pdf')) {
                embedContent = html`<iframe src=${urlStr} width="100%" height="800px" style=${{ minHeight: '80vh' }} className="rounded-xl shadow-lg bg-white border-2 border-brand-DEFAULT/20" frameBorder="0" title="عارض ملف PDF"></iframe>`;
            } else {
                // التعامل مع صفحات HTML والروابط العامة غير المعروفة
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
                                <${Luminova.Components.Button}
                                    onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))}
                                    variant="ghost"
                                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-black flex items-center justify-center gap-2 border-none rounded-none"
                                >
                                    <span className="text-xl leading-none">⛶</span>
                                    <span>${lang === 'ar' ? 'تكبير' : 'Full Screen'}</span>
                                </${Luminova.Components.Button}>
                                <a
                                    href=${urlStr}
                                    target="_blank"
                                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-black transition-all flex items-center justify-center gap-2 no-underline"
                                >
                                    <span>${lang === 'ar' ? 'فتح بصفحة جديدة' : 'فتح في تبويب جديد'}</span>
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
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center">${lang === 'ar' ? 'مرفق محلي' : 'مرفق محلي'}</p>
                                <a href=${urlStr} target="_blank" className="mt-4 px-6 py-2 bg-brand-DEFAULT text-white rounded-full font-bold shadow-md hover:bg-brand-hover transition-colors">
                                    ${lang === 'ar' ? 'تنزيل / عرض الملف' : 'تنزيل / عرض الملف'}
                                </a>
                            </div>
                        </div>
                        `;
                } else {
                    // بديل عام للروابط غير المعروفة
                    embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-4 relative z-10 w-full">
                            <iframe
                                src=${urlStr}
                                className="w-full h-[400px] border-none bg-white"
                                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                            ></iframe>
                            <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                                <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
                                    ${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'فتح الرابط بالخارج ↗'}
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

                // شارة عنوان المرفق
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
        if (!item) return html`<div className="text-center py-20 font-bold opacity-50">المحتوى غير موجود.</div>`;
        const author = Luminova.getStudent(item.studentId, data.students);
        const currentUrls = item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []);

        return html`
        <div className="animate-fade-in relative max-w-4xl mx-auto pb-20 mt-4 xl:mt-8 px-2 sm:px-4">
            <${Luminova.Components.Button}
                                onClick=${onClose}
                                variant="outline"
                                className="mb-6 flex items-center gap-2 bg-white dark:bg-gray-800 text-brand-DEFAULT hover:text-brand-hover border border-gray-100 dark:border-gray-700"
                            >
                                <span className="text-xl">${lang === 'ar' ? '←' : '→'}</span>
                                <span>${lang === 'ar' ? 'الرجوع للقائمة' : 'Back to List'}</span>
                            </${Luminova.Components.Button}>
            
            ${author && author.id !== 'unknown' && html`
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 mb-8">
                    <${Luminova.Components.Avatar} name=${author.nameAr || author.name} image=${author.image} isVIP=${author.isVIP} isVerified=${author.isVerified} isFounder=${author.isFounder} size="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-4 border-gray-50 dark:border-gray-900" />
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-xl sm:text-2xl text-brand-DEFAULT drop-shadow-sm">${lang === 'ar' ? (author.nameAr || author.name) : (author.nameEn || author.name)}</h3>
                            ${author.isVIP && html`<span className="text-xs text-brand-DEFAULT bg-brand-DEFAULT/10 px-3 py-1 rounded-full font-bold shadow-sm">مميز ✨</span>`}
                            ${author.isFounder && html`<span className="text-xs bg-brand-gold text-black shadow-lg px-3 py-1 rounded-full font-black tracking-widest">${Luminova.i18n[lang].founder}</span>`}
                            ${!author.isFounder && author.role === 'doctor' && html`<span className="text-xs bg-teal-500 text-white shadow-lg px-3 py-1 rounded-full font-black tracking-widest">🎓 ${lang === 'ar' ? 'دكتور' : 'دكتور'}</span>`}
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
                        <h3 className="text-2xl font-black text-indigo-500 drop-shadow-sm">${lang === 'ar' ? 'المرفقات والشروحات' : 'المرفقات والشروحات'}</h3>
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
            // استخدام الاسم اللاتيني كأحرف بديلة عند عدم وجود صورة 
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
            <input type="url" value=${val || ''} onChange=${(e) => onChange(e.target.value)} className="w-full p-4 rounded-xl bg-white/50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 focus:border-brand-DEFAULT outline-none shadow-sm" placeholder="رابط URL" />
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
            inputContent = html`<${Luminova.Components.Input} label="رابط مباشر لفيديو أو ملف أو صورة" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />`;
        } else if (inputType === 'base64') {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-500 dark:text-gray-400">سيتم حفظ الملف وتضمينه داخل البيانات ليعمل بدون إنترنت.</div>
                <${Luminova.Components.FileInput} label="رفع ملف مضمن" accept="*/*" onFileLoaded=${v => emitChange(v, titleAr, titleEn)} />
            `;
        } else {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-500 dark:text-gray-400">مثال: file-html/lesson1/index.html أو files/document.pdf </div>
                <${Luminova.Components.Input} label="مسار ملف محلي" placeholder="مثال: lessons/path/index.html" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />
            `;
        }

        return html`
        <div className="flex flex-col gap-2 p-4 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl w-full hover:border-brand-DEFAULT/30 transition-colors">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-inner">
                    <${Luminova.Components.Button} size="sm" variant=${inputType === 'url' ? 'primary' : 'ghost'} onClick=${() => setInputType('url')} className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm">رابط</${Luminova.Components.Button}>
                    <${Luminova.Components.Button} size="sm" variant=${inputType === 'base64' ? 'primary' : 'ghost'} onClick=${() => setInputType('base64')} className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm">ملف مضمن</${Luminova.Components.Button}>
                    <${Luminova.Components.Button} size="sm" variant=${inputType === 'local' ? 'primary' : 'ghost'} onClick=${() => setInputType('local')} className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm">مسار محلي</${Luminova.Components.Button}>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-inner">
                        <${Luminova.Components.Button} size="sm" variant="ghost" onClick=${onMoveUp} disabled=${isFirst} className="px-2 py-1.5 rounded-md" title="تحريك لأعلى">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </${Luminova.Components.Button}>
                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <${Luminova.Components.Button} size="sm" variant="ghost" onClick=${onMoveDown} disabled=${isLast} className="px-2 py-1.5 rounded-md" title="تحريك لأسفل">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </${Luminova.Components.Button}>
                    </div>
                    <${Luminova.Components.Button} size="sm" variant="danger" onClick=${onRemove} className="px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm border border-red-500/20" title="حذف المرفق">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </${Luminova.Components.Button}>
                </div>
            </div>
            <div className="w-full flex flex-col gap-4 mt-2">
                ${inputContent}
                <div className="w-full pl-0 flex flex-col md:flex-row gap-4 border-t border-brand-DEFAULT/10 pt-4 mt-2">
                    <div className="flex-1 border-l-4 border-brand-DEFAULT/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="عنوان المرفق - اختياري" placeholder="مثال: فيديو شرح الدرس الأول..." val=${titleAr} onChange=${v => emitChange(urlStr, v, titleEn)} />
                    </div>
                    <div className="flex-1 border-l-4 border-brand-hover/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="عنوان بديل - اختياري" placeholder="مثال: فيديو شرح الدرس الأول..." val=${titleEn} onChange=${v => emitChange(urlStr, titleAr, v)} />
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    Luminova.Components.UniversalMediaInput = ({ attachments = [], onChange, label = "إرفاق وسائط" }) => {
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
                <${Luminova.Components.Button}
                    onClick=${() => onChange([...sortedItems, { url: '', titleAr: '', titleEn: '', order: sortedItems.length }])}
                    variant="outline"
                    className="px-8 py-3 rounded-xl border-dashed hover:border-solid"
                    leadingIcon=${html`
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    `}
                >
                    <span>إضافة مرفق جديد</span>
                </${Luminova.Components.Button}>
            </div>
        </div>
        `;
    };

    // Placeholder protection helper functions
    function protectText(text) {
        if (!text) return { processed: '', tokens: [] };
        const tokens = [];
        let counter = 0;
        
        const patterns = [
            /\$\{[a-zA-Z0-9_]+\}/g, // ${variable}
            /\{\{[a-zA-Z0-9_]+\}\}/g, // {{name}}
            /\{[a-zA-Z0-9_]+\}/g, // {score}
            /%[a-zA-Z0-9_]+%/g, // %VALUE%
            /https?:\/\/[^\s]+/g, // URLs
            /[A-Za-z]:\\[a-zA-Z0-9_\-\\.]+/g, // Windows paths
            /(?:\.\.\/|\.\/|\/[a-zA-Z0-9_\-\/]+)\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+/g, // Relative/Unix paths
            /`{3}[\s\S]*?`{3}/g, // Code blocks ``` ... ```
            /`[^`\n]+`/g, // inline code `...`
            /\b(?:LXP2|LXP|CMS|LLM|NMT|ADC|IAM|CORS|HTTPS|HTTP|PORT|URL|SVG|RTL|LTR)\b/gi, // technical abbreviations/IDs
            /\b[a-zA-Z]+[0-9]+[a-zA-Z0-9]*\b/g // Alphanumeric IDs like LXP2, v3, task-1234
        ];
        
        let processed = text;
        for (const pattern of patterns) {
            processed = processed.replace(pattern, (match) => {
                const randId = Math.random().toString(36).substring(2, 8);
                const token = `__LMV_${randId}_${counter}__`;
                tokens.push({
                    token,
                    original: match,
                    regex: new RegExp(`__\\s*LMV\\s*_\\s*${randId}\\s*_\\s*${counter}\\s*__`, 'gi')
                });
                counter++;
                return token;
            });
        }
        
        return { processed, tokens };
    }

    function restoreText(translated, tokens) {
        if (!translated) return '';
        let restored = translated;
        for (const t of tokens) {
            restored = restored.replace(t.regex, t.original);
        }
        
        // Ensure no tokens remain in the output
        const remainingTokens = restored.match(/__\s*LMV\s*_[a-z0-9]+\s*_\d+\s*__/gi) || [];
        if (remainingTokens.length > 0) {
            throw new Error('PLACEHOLDER_RESTORE_FAILED');
        }
        return restored;
    }

    const CMS_TRANSLATION_PROVIDER = "auto";

    async function translateWithBrowser({
        text,
        sourceLanguage = "ar",
        targetLanguage = "en",
        onDownloadProgress
    }) {
        if (typeof window !== "undefined" && (window.location.protocol === "file:" || !window.isSecureContext)) {
            throw new Error("الترجمة المدمجة في المتصفح تحتاج تشغيل لوحة الإدارة من السيرفر المحلي أو عبر HTTPS.");
        }
        if (typeof self === "undefined" || !("Translator" in self)) {
            throw new Error("BROWSER_TRANSLATOR_UNSUPPORTED");
        }
        
        let availability;
        try {
            availability = await self.Translator.availability({
                sourceLanguage,
                targetLanguage
            });
        } catch (e) {
            throw new Error("BROWSER_PAIR_UNAVAILABLE");
        }
        
        if (availability === "unavailable") {
            throw new Error("BROWSER_PAIR_UNAVAILABLE");
        }
        
        let translator = null;
        try {
            translator = await self.Translator.create({
                sourceLanguage,
                targetLanguage,
                monitor(monitor) {
                    monitor.addEventListener("downloadprogress", event => {
                        let percentage = 0;
                        if (event.total) {
                            percentage = Math.round((event.loaded / event.total) * 100);
                        } else {
                            percentage = Math.round(event.loaded * 100);
                        }
                        onDownloadProgress?.(percentage);
                    });
                }
            });
        } catch (err) {
            const msg = err.message || String(err);
            if (msg.includes("download") || msg.includes("fetch")) {
                throw new Error("BROWSER_MODEL_DOWNLOAD_FAILED");
            }
            throw new Error("BROWSER_TRANSLATOR_CREATE_FAILED");
        }

        try {
            const translatedText = await translator.translate(text);
            return translatedText;
        } catch (err) {
            const msg = err.message || String(err);
            if (msg.includes("abort") || err.name === "AbortError") {
                throw new Error("BROWSER_ABORTED");
            }
            if (msg.includes("permission") || msg.includes("denied")) {
                throw new Error("BROWSER_PERMISSION_DENIED");
            }
            throw new Error("BROWSER_TRANSLATION_FAILED");
        } finally {
            if (translator) {
                try {
                    translator.destroy?.();
                } catch (e) {}
            }
        }
    }

    async function translateCmsText({
        text,
        sourceLanguage,
        targetLanguage,
        fieldType,
        entityType,
        mode,
        providerPreference = CMS_TRANSLATION_PROVIDER,
        onProgress
    }) {
        const { processed, tokens } = protectText(text);
        
        // 1. Determine provider selection
        const isName = mode === 'name_transliteration' || fieldType === 'name';
        const isLongOrProfessional = (
            fieldType === 'description' || 
            fieldType === 'bio' || 
            fieldType === 'instructions' || 
            text.length > 120
        );

        let useBrowser = providerPreference === 'browser' && !isName;
        let useServer = providerPreference === 'server' || isName || isLongOrProfessional;

        if (providerPreference === 'auto' && !isName && !isLongOrProfessional) {
            const isSecure = typeof window !== 'undefined' && window.isSecureContext && window.location.protocol !== 'file:';
            const hasBrowserApi = typeof self !== 'undefined' && 'Translator' in self;
            if (hasBrowserApi && isSecure) {
                useBrowser = true;
            } else {
                useServer = true;
            }
        }

        // Only support ar -> en (or en-US) for browser translator
        const isArToEn = sourceLanguage === 'ar' && (targetLanguage === 'en' || targetLanguage === 'en-US');
        if (useBrowser && !isArToEn) {
            useBrowser = false;
            useServer = true;
        }

        let browserError = null;
        let serverError = null;

        // Try Browser Translation if selected
        if (useBrowser) {
            try {
                // Map targetLanguage to "en" for browser
                const browserTarget = (targetLanguage === 'en-US') ? 'en' : targetLanguage;
                const translated = await translateWithBrowser({
                    text: processed,
                    sourceLanguage,
                    targetLanguage: browserTarget,
                    onDownloadProgress: onProgress
                });
                
                const restored = restoreText(translated, tokens);
                return {
                    ok: true,
                    translatedText: restored,
                    provider: 'browser',
                    model: 'chrome-translator',
                    targetLanguage: browserTarget,
                    fallbackUsed: false
                };
            } catch (err) {
                browserError = err.message || String(err);
                // Fallback to server if in auto mode
                if (providerPreference === 'auto') {
                    useServer = true;
                } else {
                    return {
                        ok: false,
                        code: browserError.includes("الترجمة المدمجة") ? "BROWSER_TRANSLATOR_UNSUPPORTED" : browserError,
                        message: browserError,
                        provider: 'browser'
                    };
                }
            }
        }

        // Try Server Translation if selected
        if (useServer) {
            try {
                const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
                const apiBase = (isLocalDev && window.location.port !== '3000') ? 'http://localhost:3000' : '';
                const response = await fetch(`${apiBase}/api/translation/translate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        text: processed,
                        sourceLanguage,
                        targetLanguage,
                        fieldType,
                        entityType,
                        mode
                    })
                });

                if (!response.ok) {
                    const errJson = await response.json().catch(() => ({}));
                    serverError = errJson.message || `HTTP error! status: ${response.status}`;
                    // Check if we can fallback to browser (in auto mode, if we haven't already tried it)
                    if (providerPreference === 'auto' && !useBrowser) {
                        const isSecure = typeof window !== 'undefined' && window.isSecureContext && window.location.protocol !== 'file:';
                        const hasBrowserApi = typeof self !== 'undefined' && 'Translator' in self;
                        if (hasBrowserApi && isSecure && isArToEn) {
                            try {
                                const browserTarget = (targetLanguage === 'en-US') ? 'en' : targetLanguage;
                                const translated = await translateWithBrowser({
                                    text: processed,
                                    sourceLanguage,
                                    targetLanguage: browserTarget,
                                    onDownloadProgress: onProgress
                                });
                                
                                const restored = restoreText(translated, tokens);
                                return {
                                    ok: true,
                                    translatedText: restored,
                                    provider: 'browser',
                                    model: 'chrome-translator',
                                    targetLanguage: browserTarget,
                                    fallbackUsed: true
                                };
                            } catch (fallbackErr) {
                                return {
                                    ok: false,
                                    code: "BOTH_PROVIDERS_UNAVAILABLE",
                                    message: `Both providers failed. Server error: ${serverError}. Browser error: ${fallbackErr.message || fallbackErr}`,
                                    provider: 'server'
                                };
                            }
                        }
                    }
                    return {
                        ok: false,
                        code: errJson.code || "HTTP_ERROR",
                        message: serverError,
                        provider: 'google-cloud'
                    };
                }

                const json = await response.json();
                if (json && json.ok && json.translatedText) {
                    try {
                        const restored = restoreText(json.translatedText, tokens);
                        return {
                            ok: true,
                            translatedText: restored,
                            sourceLanguage: json.sourceLanguage,
                            targetLanguage: json.targetLanguage,
                            provider: 'google-cloud',
                            model: json.model,
                            fallbackUsed: false
                        };
                    } catch (restoreErr) {
                        return {
                            ok: false,
                            code: "PLACEHOLDER_RESTORE_FAILED",
                            message: "Failed to restore protected placeholders in the translated text.",
                            provider: 'google-cloud'
                        };
                    }
                }

                return {
                    ok: false,
                    code: json.code || "INVALID_RESPONSE",
                    message: json.message || "Invalid response format from translation endpoint.",
                    provider: 'google-cloud'
                };
            } catch (err) {
                serverError = err.message || String(err);
                // Fallback to browser (in auto mode, if we haven't already tried it)
                if (providerPreference === 'auto' && !useBrowser) {
                    const isSecure = typeof window !== 'undefined' && window.isSecureContext && window.location.protocol !== 'file:';
                    const hasBrowserApi = typeof self !== 'undefined' && 'Translator' in self;
                    if (hasBrowserApi && isSecure && isArToEn) {
                        try {
                            const browserTarget = (targetLanguage === 'en-US') ? 'en' : targetLanguage;
                            const translated = await translateWithBrowser({
                                text: processed,
                                sourceLanguage,
                                targetLanguage: browserTarget,
                                onDownloadProgress: onProgress
                            });
                            
                            const restored = restoreText(translated, tokens);
                            return {
                                ok: true,
                                translatedText: restored,
                                provider: 'browser',
                                model: 'chrome-translator',
                                targetLanguage: browserTarget,
                                fallbackUsed: true
                            };
                        } catch (fallbackErr) {
                            return {
                                ok: false,
                                code: "BOTH_PROVIDERS_UNAVAILABLE",
                                message: `Both providers failed. Server error: ${serverError}. Browser error: ${fallbackErr.message || fallbackErr}`,
                                provider: 'server'
                            };
                        }
                    }
                }
                return {
                    ok: false,
                    code: "NETWORK_ERROR",
                    message: serverError,
                    provider: 'google-cloud'
                };
            }
        }

        return {
            ok: false,
            code: "NO_PROVIDER_AVAILABLE",
            message: "No translation provider is available for the current request.",
            provider: "none"
        };
    }

    // Premium Semantic Button Component
    Luminova.Components.CmsButton = ({
        children,
        onClick,
        variant = "secondary",
        size = "md",
        loading = false,
        disabled = false,
        leadingIcon = null,
        trailingIcon = null,
        className = "",
        type = "button",
        ...buttonProps
    }) => {
        const finalVariant = variant === 'glass' ? 'outline' : variant;
        const variantClass = `cms-btn-${finalVariant}`;
        const sizeClass = `cms-btn-${size}`;
        
        const handleClick = (e) => {
            if (disabled || loading) {
                e.preventDefault();
                return;
            }
            if (onClick) onClick(e);
        };
        
        return html`
        <button
            type=${type}
            disabled=${disabled || loading}
            onClick=${handleClick}
            className=${`cms-btn ${variantClass} ${sizeClass} ${className}`}
            aria-busy=${loading}
            ...${buttonProps}
        >
            ${loading ? html`
                <svg key="spinner" className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ` : leadingIcon}
            ${children}
            ${!loading && trailingIcon}
        </button>
        `;
    };

    Luminova.Components.Button = Luminova.Components.CmsButton;

    Luminova.formatDate = (dateString, lang) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Loader component kept but no longer used in Suspense
    Luminova.Components.Loader = ({ lang = 'ar' }) => {
        return html`
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <p className="mt-6 text-xl font-bold opacity-80 text-brand-DEFAULT animate-pulse tracking-widest">${lang === 'ar' ? 'جاري التحميل...' : 'جاري التحميل...'}</p>
        </div>
        `;
    };

    Luminova.Components.CustomDropdown = ({ options, value, onChange, placeholder, className = "" }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => String(o.value) === String(value)) || null;

        return html`
        <div className=${`relative ${className}`}>
            <button onClick=${() => setIsOpen(!isOpen)} onBlur=${() => setTimeout(() => setIsOpen(false), 200)}
                className="w-full appearance-none bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 outline-none transition-all cursor-pointer shadow-sm font-bold flex justify-between items-center z-10 relative"
            >
                <span className=${selectedOption ? 'opacity-100' : 'opacity-70'}>
                    ${selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className=${`transition-transform duration-300 transform opacity-50 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            ${isOpen && html`
                <div className="absolute top-full left-0 right-0 mt-2 z-[999] animate-fade-in backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                    <ul className="py-2 flex flex-col m-0 p-0">
                        ${options.map(opt => html`
                            <li key=${opt.value} 
                                onClick=${() => { onChange(opt.value); setIsOpen(false); }}
                                className=${`px-5 py-3 cursor-pointer transition-colors font-bold ${String(value) === String(opt.value) ? 'bg-brand-DEFAULT/20 text-brand-gold' : 'text-gray-700 dark:text-slate-300 hover:bg-brand-DEFAULT/10 dark:hover:bg-brand-DEFAULT/20 hover:text-brand-hover dark:hover:text-white'}`}
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
        <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 text-gray-900 dark:text-white animate-fade-in" dir=${lang === 'ar' ? 'rtl' : 'ltr'}>
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
                    ${lang === 'ar' ? 'للحصول على أفضل تجربة تصفح، يرجى تدوير التابلت أو الآيباد إلى الوضع العرضي' : 'للحصول على أفضل تجربة تصفح، يرجى تدوير الجهاز إلى الوضع العرضي'}
                </h2>
                <${Luminova.Components.Button}
                    onClick=${() => setIgnoreOrientation(true)}
                    variant="ghost"
                    size="lg"
                    className="mt-8 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm font-bold text-xl text-white"
                >
                    ${lang === 'ar' ? 'إكمال على أي حال' : 'Continue Anyway'}
                </${Luminova.Components.Button}>
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
            const newLang = 'ar';
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
                // Consume window.LUMINOVA_EXAMS populated by CMSApp. No local script injections or network requests.
                const exams = window.LUMINOVA_EXAMS || [];
                setData(prev => ({ ...prev, quizzes: exams }));
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
            }}>منصة تعليمية</p>
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
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">${lang === 'ar' ? 'دخول الإدارة' : 'دخول الإدارة'}</h2>
                            <p className="text-sm opacity-50 font-bold mt-1">${lang === 'ar' ? 'أدخل كلمة السر للمتابعة' : 'أدخل كلمة السر للمتابعة'}</p>
                        </div>

                        <div className="relative mb-2">
                            <span className="absolute inset-y-0 start-4 flex items-center opacity-40 text-xl pointer-events-none">🔑</span>
                            <input
                                id="admin-password-input"
                                type="password"
                                autoFocus
                                value=${adminPwd}
                                onChange=${(e) => { setAdminPwd(e.target.value); setAdminPwdError(false); }}
                                onKeyDown=${(e) => e.key === 'دخول' && handleAdminSubmit()}
                                placeholder=${lang === 'ar' ? 'كلمة السر...' : 'كلمة السر...'}
                                className=${`w-full px-12 py-4 rounded-2xl font-bold text-gray-800 dark:text-white bg-slate-100 dark:bg-slate-900 outline-none transition-all duration-300 text-base ${adminPwdError ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:ring-2 focus:ring-brand-DEFAULT'}`}
                            />
                        </div>
                        ${adminPwdError && html`
                            <p className="text-red-500 font-bold text-sm text-center mb-3 animate-fade-in">
                                ${lang === 'ar' ? '❌ كلمة السر خاطئة، حاول مجدداً' : '❌ كلمة السر خاطئة، حاول مجدداً'}
                            </p>
                        `}

                        <div className="flex gap-3 mt-5">
                            <${Luminova.Components.Button}
                                id="admin-modal-cancel"
                                onClick=${handleAdminCancel}
                                variant="secondary"
                                className="flex-1 py-3.5 rounded-2xl font-black"
                            >
                                ${lang === 'ar' ? 'تراجع' : 'Cancel'}
                            </${Luminova.Components.Button}>
                            <${Luminova.Components.Button}
                                id="admin-modal-submit"
                                onClick=${handleAdminSubmit}
                                variant="primary"
                                className="flex-1 py-3.5 rounded-2xl font-black bg-gradient-to-r from-brand-DEFAULT to-brand-gold text-white shadow-lg"
                            >
                                ${lang === 'ar' ? 'دخول' : 'Submit'}
                            </${Luminova.Components.Button}>
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
                        لومينوفا التعليمية
                    </span>
                </div>

                <!-- Center: Platform name on MOBILE only (fills the empty space) -->
                <!-- On desktop this is replaced by the nav links -->
                ${view !== 'cms' && view !== 'quiz' ? html`
                    <!-- Desktop nav links (hidden on mobile) -->
                    <div key="dt-nav" className="lmv-top-nav-links hidden md:flex items-center gap-1 mx-auto">
                        <${Luminova.Components.Button} onClick=${() => changeView('home')} title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}
                            variant=${view === 'home' ? 'primary' : 'ghost'}
                            className="px-4 py-2.5 rounded-2xl flex gap-2 items-center font-bold text-base flex-shrink-0"
                            leadingIcon=${html`<${Luminova.Icons.Home} />`}
                        >
                            <span>${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                        </${Luminova.Components.Button}>
                        <${Luminova.Components.Button} onClick=${() => changeView('community')} title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}
                            variant=${view === 'community' ? 'primary' : 'ghost'}
                            className="px-4 py-2.5 rounded-2xl flex gap-2 items-center font-bold text-base flex-shrink-0"
                            leadingIcon=${html`<${Luminova.Icons.User} />`}
                        >
                            <span>${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                        </${Luminova.Components.Button}>
                        <${Luminova.Components.Button} onClick=${() => changeView('academics')} title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}
                            variant=${view === 'academics' ? 'primary' : 'ghost'}
                            className="px-4 py-2.5 rounded-2xl flex gap-2 items-center font-bold text-base flex-shrink-0"
                            leadingIcon=${html`<${Luminova.Icons.Book} />`}
                        >
                            <span>${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                        </${Luminova.Components.Button}>
                    </div>
                    <!-- Mobile: Platform name in center (visible only on mobile) -->
                    <div key="mb-nav" className="flex md:hidden flex-1 justify-center">
                        <span style=${{ fontWeight: '900', fontSize: '1.1rem', whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #06b6d4, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            لومينوفا التعليمية
                        </span>
                    </div>
                ` : html`<div key="empty-nav" className="flex-1"></div>`}

                <!-- Right controls -->
                <div style=${{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <${Luminova.Components.Button}
                        onClick=${toggleLang}
                        variant="outline"
                        className="font-black text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex-shrink-0"
                    >
                        عربي
                    </${Luminova.Components.Button}>
                    <${Luminova.Components.Button}
                        onClick=${toggleTheme}
                        variant="ghost"
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-lg sm:text-xl shadow-inner flex-shrink-0"
                        title="تبديل المظهر"
                    >
                        ${data.settings?.theme === 'dark' ? html`
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                        ` : html`
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        `}
                    </${Luminova.Components.Button}>
                </div>
            </nav>
            `}

            <main className=${`container mx-auto px-4 pb-20 sm:pb-8 max-w-[1600px] ${view === 'fullscreenViewer' ? 'hidden' : ''}`}>
                ${renderView()}
            </main>

            <!-- Mobile Bottom Navigation Bar (hidden on desktop via CSS) -->
            ${view !== 'cms' && view !== 'quiz' && html`
                <nav key="bottom-nav-container" className="lmv-bottom-nav" aria-label="التنقل الرئيسي">
                    <${Luminova.Components.Button}
                        variant="ghost"
                        className=${`lmv-bottom-nav-btn ${view === 'home' ? 'active' : ''}`}
                        onClick=${() => changeView('home')}
                        title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}
                        leadingIcon=${html`<${Luminova.Icons.Home} />`}
                    >
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                    </${Luminova.Components.Button}>
                    <${Luminova.Components.Button}
                        variant="ghost"
                        className=${`lmv-bottom-nav-btn ${view === 'academics' ? 'active' : ''}`}
                        onClick=${() => changeView('academics')}
                        title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}
                        leadingIcon=${html`<${Luminova.Icons.Book} />`}
                    >
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                    </${Luminova.Components.Button}>
                    <${Luminova.Components.Button}
                        variant="ghost"
                        className=${`lmv-bottom-nav-btn ${view === 'community' ? 'active' : ''}`}
                        onClick=${() => changeView('community')}
                        title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}
                        leadingIcon=${html`<${Luminova.Icons.User} />`}
                    >
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                    </${Luminova.Components.Button}>
                </nav>
            `}
        </div>
    `;
    };


    Luminova.Pages.AdminCMS = ({ data, setData, lang, goBack, sourceStatuses, setSourceStatuses, isDirty, setIsDirty, reloadRemoteSource }) => {
        const validTabs = ['news', 'years', 'semesters', 'subjects', 'students', 'summaries', 'quizzes', 'certificates'];
        if (window.CMS_USER_ROLE === 'admin') validTabs.push('merger');

        const handleReloadClick = async (key) => {
            if (isDirty && isDirty[key]) {
                const confirmed = confirm('لديك تعديلات غير محفوظة. سيؤدي التحديث من GitHub إلى استبدال النسخة الحالية داخل المحرر. هل تريد المتابعة؟');
                if (!confirmed) return;
            }
            await reloadRemoteSource(key);
        };
        const [activeTab, setActiveTab] = useState('news');
        const [editingItem, setEditingItem] = useState(null);
        const [subView, setSubView] = useState(''); // '' or 'questions'
        const [qItem, setQItem] = useState(null); // Extracted dynamically to fix rules of hooks crash
        const [cmsSearchQuery, setCmsSearchQuery] = useState('');
        const [qSearchQuery, setQSearchQuery] = useState('');
        const getDefaultCmsVisibleCount = useCallback((tab) => {
            return ['subjects', 'summaries', 'quizzes'].includes(tab) ? 10 : 15;
        }, []);
        const [cmsVisibleCount, setCmsVisibleCount] = useState(() => getDefaultCmsVisibleCount(activeTab));
        const [filterYear, setFilterYear] = useState('');
        const [filterSem, setFilterSem] = useState('');
        const [filterSub, setFilterSub] = useState('');

        // Merger State
        const [mergerTarget, setMergerTarget] = useState('data'); // data, exams, certs
        const [mergerBase, setMergerBase] = useState(null);
        const [mergerLocal, setMergerLocal] = useState(null);
        const [mergerStatus, setMergerStatus] = useState({ state: 'idle', msg: '' });

        const [examMergeStatus, setExamMergeStatus] = useState(null);
        const [submissionActionStatus, setSubmissionActionStatus] = useState(null);
        const [isTestingSubmission, setIsTestingSubmission] = useState(false);
        const [isPreparingExam, setIsPreparingExam] = useState(false);
        const [isTranslating, setIsTranslating] = useState(false);
        const [translationMode, setTranslationMode] = useState('auto');
        const [diagnostics, setDiagnostics] = useState({
            server: 'Unknown',
            google: 'Unknown',
            browser: 'Unknown',
            secureContext: window.isSecureContext ? 'Yes' : 'No',
            lastProvider: 'None',
            lastError: 'None'
        });
        const [fieldTranslationMeta, setFieldTranslationMeta] = useState({});

        const [translationState, setTranslationState] = useState({
            activeKey: null,
            direction: null,
            status: 'idle',
            error: null,
            progress: null
        });

        const checkTranslationDiagnostics = useCallback(async () => {
            const secure = window.isSecureContext && window.location.protocol !== 'file:';
            
            let browserStatus = 'Unsupported';
            if (typeof self !== 'undefined' && 'Translator' in self) {
                try {
                    const avail = await self.Translator.availability({ sourceLanguage: 'ar', targetLanguage: 'en' });
                    if (avail === 'available') {
                        browserStatus = 'Available';
                    } else if (avail === 'downloadable') {
                        browserStatus = 'Download required';
                    } else {
                        browserStatus = 'Unsupported';
                    }
                } catch (e) {
                    browserStatus = 'Unsupported';
                }
            }
            
            let serverStatus = 'Unavailable';
            let googleStatus = 'Configuration required';
            
            try {
                const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
                const apiBase = (isLocalDev && window.location.port !== '3000') ? 'http://localhost:3000' : '';
                
                const healthRes = await fetch(`${apiBase}/api/health`).catch(() => null);
                if (healthRes && healthRes.ok) {
                    serverStatus = 'Available';
                }
                
                const transHealthRes = await fetch(`${apiBase}/api/translation/health`).catch(() => null);
                if (transHealthRes && transHealthRes.ok) {
                    const transData = await transHealthRes.json();
                    if (transData.status === 'PROVIDER_READY') {
                        googleStatus = 'Ready';
                    } else if (transData.status === 'CONFIGURATION_REQUIRED') {
                        googleStatus = 'Configuration required';
                    } else {
                        googleStatus = 'Error';
                    }
                } else {
                    googleStatus = 'Configuration required';
                }
            } catch (e) {
                serverStatus = 'Unavailable';
                googleStatus = 'Configuration required';
            }
            
            setDiagnostics(prev => ({
                ...prev,
                server: serverStatus,
                google: googleStatus,
                browser: browserStatus,
                secureContext: window.isSecureContext ? 'Yes' : 'No'
            }));
        }, []);

        useEffect(() => {
            checkTranslationDiagnostics();
        }, [checkTranslationDiagnostics]);

        const handleTranslateField = useCallback(async ({
            sourceField,
            targetField,
            sourceLanguage,
            targetLanguage,
            fieldType,
            entityType,
            mode = 'standard_translation'
        }) => {
            if (!editingItem) return;
            const sourceValue = (editingItem[sourceField] || '').trim();
            
            // Validate source
            if (!sourceValue) {
                const emptyMsg = sourceLanguage === 'ar' 
                    ? 'أدخل النص العربي أولاً قبل الترجمة.' 
                    : 'Please enter the English text first.';
                alert(emptyMsg);
                return;
            }

            // Target overwrite protection
            const targetValue = (editingItem[targetField] || '').trim();
            if (targetValue) {
                const confirmMsg = lang === 'ar'
                    ? 'الحقل المستهدف يحتوي بالفعل على محتوى. هل تريد استبداله بالترجمة الجديدة؟'
                    : 'The target field already contains content. Replace it with a new translation?';
                if (!confirm(confirmMsg)) {
                    return;
                }
            }

            // Update translation state
            setTranslationState({
                activeKey: targetField,
                direction: `${sourceLanguage}-to-${targetLanguage}`,
                status: 'translating',
                error: null,
                progress: null
            });
            setIsTranslating(true);

            // Call translateCmsText adapter
            const result = await translateCmsText({
                text: sourceValue,
                sourceLanguage,
                targetLanguage,
                fieldType,
                entityType,
                mode,
                providerPreference: translationMode,
                onProgress: (percentage) => {
                    setTranslationState(prev => ({
                        ...prev,
                        progress: percentage
                    }));
                }
            });

            setIsTranslating(false);

            if (result.ok) {
                // Populate only the intended target field
                setEditingItem(prev => {
                    const updated = { ...prev, [targetField]: result.translatedText };
                    return updated;
                });
                
                // Mark the correct source as dirty
                const sourceKey = activeTab === 'quizzes' ? 'exams' : (activeTab === 'certificates' ? 'certs' : 'data');
                if (setIsDirty) {
                    setIsDirty(prev => ({ ...prev, [sourceKey]: true }));
                }

                // Update field translation meta
                setFieldTranslationMeta(prev => ({
                    ...prev,
                    [targetField]: {
                        provider: result.provider,
                        model: result.model
                    }
                }));

                // Update diagnostics
                setDiagnostics(prev => ({
                    ...prev,
                    lastProvider: result.provider === 'browser' ? 'Browser Translator API' : 'Google Cloud Translation',
                    lastError: 'None'
                }));

                setTranslationState({
                    activeKey: null,
                    direction: null,
                    status: 'success',
                    error: null,
                    progress: null
                });
            } else {
                console.error('[Luminova CMS] Translation failed:', result);
                
                // Handle UI feedback
                let userFriendlyMsg = lang === 'ar' 
                    ? 'تعذر إتمام الترجمة حاليًا. لم يتم تغيير النص الحالي.' 
                    : 'Failed to complete translation. The current text has not been changed.';
                    
                if (result.code === 'CONFIGURATION_REQUIRED' || result.code === 'AUTHENTICATION_ERROR') {
                    userFriendlyMsg = lang === 'ar'
                        ? 'خدمة الترجمة تحتاج إلى إعداد الاتصال بالسيرفر.'
                        : 'Translation service needs server configuration setup.';
                } else if (result.message && result.message.includes("الترجمة المدمجة")) {
                    userFriendlyMsg = result.message;
                }
                
                alert(userFriendlyMsg);

                // Update diagnostics
                setDiagnostics(prev => ({
                    ...prev,
                    lastError: result.message || String(result.code)
                }));

                setTranslationState({
                    activeKey: targetField,
                    direction: `${sourceLanguage}-to-${targetLanguage}`,
                    status: 'error',
                    error: result.message,
                    progress: null
                });
            }
        }, [editingItem, activeTab, setIsDirty, lang, translationMode]);

        const handleAutoTranslate = useCallback(async () => {
            if (!editingItem) return;
            
            // Define bilingual fields per tab
            const tabFieldMappings = {
                news: [
                    { source: 'titleAr', target: 'titleEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'title' },
                    { source: 'contentAr', target: 'contentEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'content' }
                ],
                summaries: [
                    { source: 'titleAr', target: 'titleEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'title' },
                    { source: 'contentAr', target: 'contentEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'content' }
                ],
                students: [
                    { source: 'nameAr', target: 'nameEn', sl: 'ar', tl: 'en-US', mode: 'name_transliteration', fieldType: 'name' },
                    { source: 'majorAr', target: 'majorEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'major' },
                    { source: 'bioAr', target: 'bioEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'bio' }
                ],
                certificates: [
                    { source: 'studentName', target: 'studentNameEn', sl: 'ar', tl: 'en-US', mode: 'name_transliteration', fieldType: 'name' },
                    { source: 'senderName', target: 'senderNameEn', sl: 'ar', tl: 'en-US', mode: 'name_transliteration', fieldType: 'name' },
                    { source: 'senderRole', target: 'senderRoleEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'role' },
                    { source: 'title', target: 'titleEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'title' },
                    { source: 'description', target: 'descriptionEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'description' }
                ],
                quizzes: [
                    { source: 'titleAr', target: 'titleEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'title' }
                ]
            };
            
            // Fallback for custom tabs (e.g. years, semesters, subjects)
            const fallbackFields = [
                { source: 'nameAr', target: 'nameEn', sl: 'ar', tl: 'en-US', mode: 'standard_translation', fieldType: 'name' }
            ];
            
            const fieldsToTranslate = tabFieldMappings[activeTab] || fallbackFields;
            
            // Check if there's any source text available
            let hasAnySource = false;
            for (const f of fieldsToTranslate) {
                if ((editingItem[f.source] || '').trim()) {
                    hasAnySource = true;
                    break;
                }
            }
                   if (!hasAnySource) {
                alert(lang === 'ar' ? 'أدخل النص العربي أولاً قبل الترجمة.' : 'Please enter the source text first.');
                return;
            }
            
            // Check target fields overwrite protection
            let hasAnyTarget = false;
            for (const f of fieldsToTranslate) {
                if ((editingItem[f.target] || '').trim()) {
                    hasAnyTarget = true;
                    break;
                }
            }
            
            if (hasAnyTarget) {
                const confirmMsg = lang === 'ar'
                    ? 'بعض الحقول المستهدفة تحتوي بالفعل على محتوى. هل تريد استبدالها بالترجمة الجديدة؟'
                    : 'Some target fields already contain content. Replace them with new translations?';
                if (!confirm(confirmMsg)) {
                    return;
                }
            }
            
            setIsTranslating(true);
            
            let successCount = 0;
            let lastError = null;
            
            for (const f of fieldsToTranslate) {
                const sourceVal = (editingItem[f.source] || '').trim();
                if (!sourceVal) continue;
                
                setTranslationState({
                    activeKey: f.target,
                    direction: `${f.sl}-to-${f.tl}`,
                    status: 'translating',
                    error: null,
                    progress: null
                });
                
                const result = await translateCmsText({
                    text: sourceVal,
                    sourceLanguage: f.sl,
                    targetLanguage: f.tl,
                    fieldType: f.fieldType,
                    entityType: activeTab,
                    mode: f.mode,
                    providerPreference: translationMode,
                    onProgress: (percentage) => {
                        setTranslationState(prev => ({
                            ...prev,
                            progress: percentage
                        }));
                    }
                });
                
                if (result.ok) {
                    setEditingItem(prev => ({ ...prev, [f.target]: result.translatedText }));
                    
                    // Update field meta
                    setFieldTranslationMeta(prev => ({
                        ...prev,
                        [f.target]: {
                            provider: result.provider,
                            model: result.model
                        }
                    }));

                    // Update diagnostics
                    setDiagnostics(prev => ({
                        ...prev,
                        lastProvider: result.provider === 'browser' ? 'Browser Translator API' : 'Google Cloud Translation',
                        lastError: 'None'
                    }));

                    successCount++;
                } else {
                    lastError = result;
                    setDiagnostics(prev => ({
                        ...prev,
                        lastError: result.message || String(result.code)
                    }));
                }
            }
            
            setIsTranslating(false);
            
            if (successCount > 0) {
                const sourceKey = activeTab === 'quizzes' ? 'exams' : (activeTab === 'certificates' ? 'certs' : 'data');
                if (setIsDirty) {
                    setIsDirty(prev => ({ ...prev, [sourceKey]: true }));
                }
                
                setTranslationState({
                    activeKey: null,
                    direction: null,
                    status: 'success',
                    error: null,
                    progress: null
                });
                
                if (lastError) {
                    alert(lang === 'ar' ? 'تمت ترجمة بعض الحقول بنجاح، بينما فشل البعض الآخر.' : 'Some fields were translated, but others failed.');
                }
            } else if (lastError) {
                let userFriendlyMsg = lang === 'ar' 
                    ? 'تعذر إتمام الترجمة حاليًا. لم يتم تغيير النص الحالي.' 
                    : 'Failed to complete translation. The current text has not been changed.';
                    
                if (lastError.code === 'CONFIGURATION_REQUIRED' || lastError.code === 'AUTHENTICATION_ERROR') {
                    userFriendlyMsg = lang === 'ar'
                        ? 'خدمة الترجمة تحتاج إلى إعداد الاتصال بالسيرفر.'
                        : 'Translation service needs server configuration setup.';
                } else if (lastError.message && lastError.message.includes("الترجمة المدمجة")) {
                    userFriendlyMsg = lastError.message;
                }
                alert(userFriendlyMsg);
                
                setTranslationState({
                    activeKey: null,
                    direction: null,
                    status: 'error',
                    error: lastError.message,
                    progress: null
                });
            }
        }, [editingItem, activeTab, setIsDirty, lang, translationMode]);

        const renderFieldTranslator = (sourceField, targetField, mode = 'standard_translation', fieldType = 'content') => {
            const isStandard = mode === 'standard_translation';
            const isTranslatingField = translationState.activeKey === targetField && translationState.status === 'translating';
            
            let toEnLabel = isStandard 
                ? (lang === 'ar' ? 'ترجمة إلى الإنجليزية' : 'Translate to English')
                : (lang === 'ar' ? 'كتابة الاسم بالإنجليزية' : 'Convert to English spelling');
                
            if (isTranslatingField && translationState.direction === 'ar-to-en') {
                if (translationState.progress !== null) {
                    toEnLabel = `جارٍ تجهيز نموذج الترجمة — ${translationState.progress}%`;
                } else {
                    toEnLabel = 'جارٍ الترجمة...';
                }
            } else if (isTranslatingField && translationState.direction === 'ar-to-en-upgrade') {
                toEnLabel = 'جارٍ الترجمة...';
            }
                
            let toArLabel = lang === 'ar' ? 'ترجمة إلى العربية' : 'Translate to Arabic';
            if (isTranslatingField && translationState.direction === 'en-to-ar') {
                toArLabel = 'جارٍ الترجمة...';
            }

            const langIcon = html`
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M
                        </div>
                        
                        <!-- Translation Diagnostics Panel -->
                        <div key="trans-diag-panel" className="mt-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl xl:rounded-3xl p-4 shadow-lg border border-white/20 dark:border-gray-700/30 space-y-3">
                            <h4 className="font-black text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">فحص خدمة الترجمة</h4>
                            <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-400">
                                <div className="flex justify-between"><span>سيرفر CMS:</span> <span className=${diagnostics.server === 'Available' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>${diagnostics.server}</span></div>
                                <div className="flex justify-between"><span>محرّك Google:</span> <span className=${diagnostics.google === 'Ready' ? 'text-green-500 font-bold' : (diagnostics.google === 'Configuration required' ? 'text-amber-500 font-bold' : 'text-red-500 font-bold')}>${diagnostics.google}</span></div>
                                <div className="flex justify-between"><span>ترجمة المتصفح:</span> <span className=${diagnostics.browser === 'Available' ? 'text-green-500 font-bold' : (diagnostics.browser === 'Download required' ? 'text-amber-500 font-bold' : 'text-gray-500')}>${diagnostics.browser}</span></div>
                                <div className="flex justify-between"><span>اتصال آمن (Secure):</span> <span>${diagnostics.secureContext}</span></div>
                                <div className="flex justify-between items-center mt-2">
                                    <span>وضع الترجمة:</span>
                                    <select 
                                        value=${translationMode} 
                                        onChange=${e => setTranslationMode(e.target.value)}
                                        className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-xs focus:outline-none"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="browser">Browser</option>
                                        <option value="server">Server</option>
                                    </select>
                                </div>
                                <div className="flex justify-between"><span>آخر محرّك مستخدم:</span> <span>${diagnostics.lastProvider}</span></div>
                                <div className="flex justify-between flex-col gap-0.5 mt-1 border-t border-gray-100 dark:border-gray-800 pt-1.5">
                                    <span>آخر خطأ:</span>
                                    <span className="text-red-400 break-all font-mono text-[10px] block max-h-16 overflow-y-auto">${diagnostics.lastError}</span>
                                </div>
                            </div>
                            <${Luminova.Components.Button}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs py-1.5 rounded-lg border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick=${checkTranslationDiagnostics}
                            >
                                فحص خدمة الترجمة
                            </${Luminova.Components.Button}>
                        </div>
                    </div>11 21l5-10 5 10M12.751 5c-.347 2.225-1.162 4.356-2.396 6.25" />
                </svg>
            `;

            const meta = fieldTranslationMeta[targetField];
            const targetVal = editingItem ? (editingItem[targetField] || '').trim() : '';

            return html`
                <div key=${`trans-container-${targetField}`} className="w-full flex flex-col items-end col-span-2 mt-1 mb-3">
                    <div className="flex gap-2 justify-end w-full">
                        <${Luminova.Components.Button}
                            variant="outline"
                            size="sm"
                            loading=${isTranslatingField && (translationState.direction === 'ar-to-en' || translationState.direction === 'ar-to-en-upgrade')}
                            disabled=${isTranslating || !editingItem}
                            onClick=${() => handleTranslateField({
                                sourceField,
                                targetField,
                                sourceLanguage: 'ar',
                                targetLanguage: 'en-US',
                                fieldType,
                                entityType: activeTab,
                                mode
                            })}
                            leadingIcon=${langIcon}
                        >
                            ${toEnLabel}
                        </${Luminova.Components.Button}>
                        
                        ${isStandard && html`
                            <${Luminova.Components.Button}
                                variant="outline"
                                size="sm"
                                loading=${isTranslatingField && translationState.direction === 'en-to-ar'}
                                disabled=${isTranslating || !editingItem}
                                onClick=${() => handleTranslateField({
                                    sourceField: targetField,
                                    targetField: sourceField,
                                    sourceLanguage: 'en-US',
                                    targetLanguage: 'ar',
                                    fieldType,
                                    entityType: activeTab,
                                    mode
                                })}
                                leadingIcon=${langIcon}
                            >
                                ${toArLabel}
                            </${Luminova.Components.Button}>
                        `}

                        ${meta && meta.provider === 'browser' && targetVal && html`
                            <${Luminova.Components.Button}
                                variant="outline"
                                size="sm"
                                loading=${isTranslatingField && translationState.direction === 'ar-to-en-upgrade'}
                                disabled=${isTranslating || !editingItem}
                                onClick=${() => handleTranslateField({
                                    sourceField,
                                    targetField,
                                    sourceLanguage: 'ar',
                                    targetLanguage: 'en-US',
                                    fieldType,
                                    entityType: activeTab,
                                    mode,
                                    forceProviderPreference: 'server'
                                })}
                                className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            >
                                تحسين الترجمة إلى الإنجليزية الأمريكية
                            </${Luminova.Components.Button}>
                        `}
                    </div>
                    
                    ${meta && html`
                        <div key=${`note-${targetField}`} className="text-xs text-gray-400 dark:text-gray-500 mt-1 mr-2 text-right">
                            ${meta.provider === 'browser' 
                                ? 'تمت الترجمة محليًا داخل المتصفح' 
                                : 'تمت الترجمة عبر خدمة الترجمة الاحترافية'}
                        </div>
                    `}
                </div>
            `;
        };

        const handleOpenReportsHub = useCallback(() => {
            window.open('admin-reports.html', '_blank', 'noopener,noreferrer');
        }, []);

        useEffect(() => {
            setCmsVisibleCount(getDefaultCmsVisibleCount(activeTab));
            setFilterYear('');
            setFilterSem('');
            setFilterSub('');
            setCmsSearchQuery('');
            setQSearchQuery('');
        }, [activeTab, getDefaultCmsVisibleCount]);

        useEffect(() => {
            setQSearchQuery('');
        }, [subView, editingItem]);

        const persistEditedQuiz = (exam) => {
            const normalized = normalizeExamForControl(exam, { settings: data.settings || {} });
            setEditingItem(normalized);
            setData(prev => {
                const exists = (prev.quizzes || []).some(item => item.id === normalized.id || getExamIdentity(item) === getExamIdentity(normalized));
                if (!exists) return prev;
                const newQuizzes = (prev.quizzes || []).map(item => (item.id === normalized.id || getExamIdentity(item) === getExamIdentity(normalized)) ? normalized : item);
                window.LUMINOVA_EXAMS = newQuizzes;
                if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                return { ...prev, quizzes: newQuizzes };
            });
            return normalized;
        };

        const postSubmissionAction = async (webhookUrl, payload) => {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            const responseText = await response.text();
            try {
                return responseText ? JSON.parse(responseText) : {};
            } catch (err) {
                return { status: response.ok ? 'ok' : 'error', message: responseText };
            }
        };

        const handleTestSubmissionConnection = async () => {
            const exam = normalizeExamForControl(editingItem || {}, { settings: data.settings || {} });
            const webhookStatus = validateWebhookUrl(exam.webhookUrl);
            if (!webhookStatus.ok) {
                setSubmissionActionStatus({ state: 'error', msg: 'فشل الاتصال بسكربت جوجل. تأكد من رابط تطبيق الويب وصلاحيات النشر.' });
                return;
            }
            setIsTestingSubmission(true);
            setSubmissionActionStatus({ state: 'loading', msg: 'جاري اختبار اتصال التسليم...' });
            try {
                const base = exam.spreadsheetId ? { spreadsheetId: exam.spreadsheetId } : {};
                const timeResult = await postSubmissionAction(exam.webhookUrl, { action: 'get_time', ...base });
                if (timeResult.status !== 'ok') throw new Error(timeResult.message || 'فشل اختبار وقت الخادم');

                const verifyResult = await postSubmissionAction(exam.webhookUrl, {
                    action: 'verify_submission',
                    submissionId: 'cms_test_missing',
                    verificationHash: 'cms_test_missing',
                    payloadHash: 'cms_test_missing',
                    responseCount: 0,
                    expectedQuestionCount: 0,
                    ...base
                });
                if (!['not_found', 'mismatch'].includes(verifyResult.status)) {
                    throw new Error(verifyResult.message || 'أعاد اختبار التحقق حالة غير متوقعة');
                }

                try {
                    await postSubmissionAction(exam.webhookUrl, { action: 'health_check', ...base });
                } catch (healthErr) {
                    console.warn('Optional health_check failed:', healthErr);
                }

                const updated = persistEditedQuiz({ ...exam, submissionStatus: 'tested' });
                setSubmissionActionStatus({ state: 'success', msg: 'تم الاتصال بسكربت جوجل بنجاح. نظام التسليم جاهز.' });
                setEditingItem(updated);
            } catch (err) {
                setSubmissionActionStatus({ state: 'error', msg: 'فشل الاتصال بسكربت جوجل. تأكد من رابط تطبيق الويب وصلاحيات النشر.' });
            } finally {
                setIsTestingSubmission(false);
            }
        };

        const handlePrepareExamSheet = async () => {
            const exam = normalizeExamForControl(editingItem || {}, { settings: data.settings || {} });
            const webhookStatus = validateWebhookUrl(exam.webhookUrl);
            if (!webhookStatus.ok || !exam.sheetName || !exam.quizId) {
                setSubmissionActionStatus({ state: 'error', msg: 'فشل تجهيز شيت الاختبار. راجع رابط السكربت والصلاحيات.' });
                return;
            }
            setIsPreparingExam(true);
            setSubmissionActionStatus({ state: 'loading', msg: 'جاري تجهيز شيت الاختبار...' });
            try {
                const payload = {
                    action: 'prepare_exam',
                    schemaVersion: 2,
                    quizId: exam.quizId,
                    examTitle: getExamTitle(exam),
                    sheetName: exam.sheetName,
                    schemaHash: exam.schemaHash,
                    expectedQuestionCount: exam.expectedQuestionCount,
                    maxScore: exam.maxScore,
                    duplicatePolicy: exam.duplicatePolicy || 'prevent_by_email',
                    allowRetakes: !!exam.allowRetakes,
                    maxAttempts: exam.maxAttempts !== undefined && exam.maxAttempts !== null ? Number(exam.maxAttempts) : 1,
                    questions: buildPrepareExamQuestions(exam.questions)
                };
                if (exam.spreadsheetId) payload.spreadsheetId = exam.spreadsheetId;
                const result = await postSubmissionAction(exam.webhookUrl, payload);
                if (result.status === 'schema_mismatch') {
                    persistEditedQuiz({ ...exam, submissionStatus: 'schema_changed_after_prepare' });
                    setSubmissionActionStatus({ state: 'error', msg: 'تم اكتشاف اختلاف بين أسئلة الاختبار والشيت المجهز. يرجى إعادة تجهيز الشيت قبل النشر.' });
                    return;
                }
                if (result.status !== 'prepared') throw new Error(result.message || 'فشل تجهيز الاختبار');
                const updated = persistEditedQuiz({
                    ...exam,
                    preparedAt: new Date().toISOString(),
                    preparedSchemaHash: result.schemaHash || exam.schemaHash,
                    submissionStatus: 'ready_for_students'
                });
                setEditingItem(updated);
                setSubmissionActionStatus({ state: 'success', msg: 'تم تجهيز شيت الاختبار بنجاح. الاختبار جاهز لاستقبال تسليمات الطلاب.' });
            } catch (err) {
                setSubmissionActionStatus({ state: 'error', msg: 'فشل تجهيز شيت الاختبار. راجع رابط السكربت والصلاحيات.' });
            } finally {
                setIsPreparingExam(false);
            }
        };

        const handleMultiExamImport = (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            const readPromises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            resolve(parseLuminovaPayload(event.target.result, 'exams'));
                        } catch (err) {
                            resolve([]);
                        }
                    };
                    reader.readAsText(file);
                });
            });

            Promise.all(readPromises).then(results => {
                const allExams = results.flat();
                if (!allExams.length) {
                    setExamMergeStatus('لم يتم العثور على اختبارات صالحة في الملفات المحددة.');
                    setTimeout(() => setExamMergeStatus(null), 8000);
                    return;
                }

                const groups = {};
                allExams.forEach(ex => {
                    const identity = getExamIdentity(ex);
                    if (!identity) return;
                    if (!groups[identity]) groups[identity] = [];
                    groups[identity].push(ex);
                });

                let totalFinalQuestions = 0;
                let newExamsCount = 0;
                let mergedExamsCount = 0;
                let addedQuestionsCount = 0;
                let skippedDuplicateQuestions = 0;

                if (Object.keys(groups).length === 0) {
                    setExamMergeStatus('لم يتم العثور على اختبارات قابلة للاستيراد. يجب أن يحتوي كل اختبار على هوية ثابتة.');
                    setTimeout(() => setExamMergeStatus(null), 8000);
                    return;
                }

                if (Object.keys(groups).length > 0) {
                    setData(prev => {
                        const newQuizzes = [...prev.quizzes];
                        Object.keys(groups).forEach(code => {
                            const group = groups[code];
                            const existingIdx = newQuizzes.findIndex(q => getExamIdentity(q) === code);

                            let baseExam;
                            let existingQuestions = [];

                            if (existingIdx !== -1) {
                                // MERGE: Start with existing test as base
                                baseExam = { ...newQuizzes[existingIdx] };
                                existingQuestions = [...(baseExam.questions || [])];
                                mergedExamsCount++;
                                
                                // Optionally update metadata from the uploaded file if it's "richer"
                                const firstRichUpload = group.find(g => g.titleAr || g.title);
                                if (firstRichUpload) {
                                    baseExam = { ...mergeExamMetadata(baseExam, firstRichUpload), questions: existingQuestions };
                                }
                            } else {
                                // UPLOAD NEW: Use first item from group as base
                                baseExam = { ...group[0] };
                                existingQuestions = [];
                                newExamsCount++;
                            }

                            const questionStats = { addedQuestions: 0, skippedDuplicateQuestions: 0 };
                            group.forEach(g => {
                                addUniqueQuestions(existingQuestions, Array.isArray(g.questions) ? g.questions : [], questionStats);
                            });
                            addedQuestionsCount += questionStats.addedQuestions;
                            skippedDuplicateQuestions += questionStats.skippedDuplicateQuestions;

                            baseExam.questions = existingQuestions;
                            totalFinalQuestions += baseExam.questions.length;

                            if (existingIdx !== -1) {
                                newQuizzes[existingIdx] = baseExam;
                            } else {
                                newQuizzes.push(baseExam);
                            }
                        });
                        window.LUMINOVA_EXAMS = newQuizzes;
                        if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                        return { ...prev, quizzes: newQuizzes };
                    });

                    const statusMsg = `تمت المعالجة: ${newExamsCount} اختبار جديد، ${mergedExamsCount} اختبار مدمج، ${addedQuestionsCount} سؤال مضاف، ${skippedDuplicateQuestions} سؤال مكرر تم تجاهله. إجمالي الأسئلة: ${totalFinalQuestions}.`;
                    
                    setExamMergeStatus(statusMsg);
                    setTimeout(() => setExamMergeStatus(null), 8000);
                }
            });
            e.target.value = '';
        };

                const studentsWithFounder = [Luminova.FOUNDER, ...(data.students || []).filter(s => !s.isFounder)];

        // ==========================================
        // 3-PILLAR EXPORT ENGINE
        // ==========================================

        // Export 1 — data.js: core platform data ONLY (no quizzes, no certificates)
        const handleExportData = () => {
            const { certificates, quizzes, ...coreData } = data;
            coreData.settings = { ...(coreData.settings || {}) };
            delete coreData.settings[['submission', 'Profiles'].join('')];
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
            let certs = data.certificates || [];
            if (window.CMS_USER_ROLE === 'editor') {
                certs = certs.filter(item => window.CMS_EDITOR_ADDED_IDS && window.CMS_EDITOR_ADDED_IDS.includes(item.id));
            }
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
            let exams = data.quizzes || [];

            if (window.CMS_USER_ROLE === 'editor') {
                exams = exams.filter(item => window.CMS_EDITOR_ADDED_IDS && window.CMS_EDITOR_ADDED_IDS.includes(item.id));
            }

            const legacyWarnings = exams
                .filter(exam => exam && exam.transactionalSubmissionEnabled === undefined)
                .map(exam => `- ${getExamTitle(exam) || getExamIdentity(exam) || 'اختبار بدون عنوان'}: اختبار قديم غير مفعل على نظام التسليم التعاقدي. سيتم تصديره كاختبار Legacy ولن يتم اعتباره جاهزًا للتسليم التعاقدي.`);
            
            const normalizedExams = exams.map(exam => normalizeExamForControl(exam, { settings: data.settings || {} }));
            const validationErrors = [];
            normalizedExams.forEach(exam => {
                const errors = validateExamForExport(exam);
                if (errors.length) {
                    validationErrors.push(`- ${getExamTitle(exam) || exam.quizId}:`);
                    errors.forEach(error => validationErrors.push(`  • ${error}`));
                }
            });
            if (validationErrors.length) {
                alert(['تم منع التصدير لحماية بيانات الطلاب من التسليم الناقص.', '', ...validationErrors].join('\n'));
                return;
            }
            if (legacyWarnings.length && !confirm(['تنبيه قبل تصدير exam.js:', 'بعض الاختبارات القديمة غير مفعلة على نظام التسليم التعاقدي ولن يتم منع تصديرها تلقائيًا.', '', ...legacyWarnings, '', 'هل تريد متابعة التصدير؟'].join('\n'))) {
                return;
            }

            try {
                const outStr = encodeLxp2ExamPack(normalizedExams);
                const blob = new Blob([outStr], { type: "text/javascript;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "exam.js";
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Failed to export exam pack:", err);
                alert("فشل تصدير ملف الاختبارات.");
            }
        };

        // --- MERGER LOGIC ---
        const handleFetchBase = async () => {
            setMergerStatus({ state: 'loading', msg: 'جاري جلب البيانات الحالية من جت هب...' });
            const urls = { data: DATA_URL, exams: EXAM_URL, certs: CERTS_URL };
            const label = mergerTarget === 'data' ? 'البيانات' : mergerTarget === 'exams' ? 'الاختبارات' : 'الشهادات';
            try {
                const res = await fetchGithubSource({ key: mergerTarget, label, url: urls[mergerTarget] });
                if (res.status === 'SUCCESS') {
                    setMergerBase(res.data);
                    setMergerStatus({ state: 'success', msg: `تم جلب بيانات ${mergerTarget} بنجاح.` });
                } else {
                    throw new Error(res.msg);
                }
            } catch (e) {
                setMergerStatus({ state: 'error', msg: 'خطأ: ' + e.message });
            }
        };

        const handleFileDrop = (e) => {
            e.preventDefault();
            const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                try {
                    const extracted = parseLuminovaPayload(text, mergerTarget);

                    if (extracted) {
                        setMergerLocal(extracted);
                        setMergerStatus({ state: 'success', msg: `تمت قراءة الملف المحلي ${file.name} بنجاح.` });
                    } else {
                        throw new Error('بنية الملف غير متطابقة. تأكد من رفع نوع الملف الصحيح.');
                    }
                } catch (e) {
                    setMergerStatus({ state: 'error', msg: 'خطأ في القراءة: ' + e.message });
                }
            };
            reader.readAsText(file);
        };

        const handleExecuteMerge = () => {
            if (!mergerBase || !mergerLocal) return;

            let finalData;
            let addedCount = 0;
            let updatedCount = 0;

            const mergeArray = (baseArr, localArr) => {
                const map = new Map(baseArr.map(item => [item.id, item]));
                localArr.forEach(item => {
                    if (map.has(item.id)) {
                        map.set(item.id, { ...map.get(item.id), ...item });
                        updatedCount++;
                    } else {
                        map.set(item.id, item);
                        addedCount++;
                    }
                });
                return Array.from(map.values());
            };

            if (mergerTarget === 'data') {
                finalData = { ...mergerBase };
                ['years', 'semesters', 'subjects', 'students', 'summaries', 'news'].forEach(key => {
                    if (mergerLocal[key]) {
                        finalData[key] = mergeArray(mergerBase[key] || [], mergerLocal[key]);
                    }
                });
            } else if (mergerTarget === 'exams') {
                const result = mergeExamCollections(mergerBase, mergerLocal);
                finalData = result.exams;
                addedCount = result.stats.createdExams + result.stats.addedQuestions;
                updatedCount = result.stats.mergedExams;
                setMergerStatus({
                    state: 'merged',
                    msg: `اكتمل دمج الاختبارات. اختبارات جديدة: ${result.stats.createdExams}، اختبارات مدمجة: ${result.stats.mergedExams}، أسئلة مضافة: ${result.stats.addedQuestions}، مكررات متجاهلة: ${result.stats.skippedDuplicateQuestions}، اختبارات متجاهلة: ${result.stats.ignoredExams}. إجمالي الاختبارات: ${finalData.length}.`
                });
                setMergerBase(finalData);
                setMergerLocal(null);
                if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                return;
            } else {
                finalData = mergeArray(mergerBase, mergerLocal);
            }

            setMergerBase(finalData);
            setMergerLocal(null);
            if (setIsDirty) setIsDirty(prev => ({ ...prev, [mergerTarget]: true }));
            setMergerStatus({
                state: 'merged',
                msg: `اكتمل الدمج. تمت الإضافة: ${addedCount}، تم التحديث: ${updatedCount}. الإجمالي: ${mergerTarget === 'data' ? 'غير متاح' : finalData.length}`
            });
        };

        const handleDownloadMerged = () => {
            if (!mergerBase) return;
            let str = '';
            let filename = '';
            if (mergerTarget === 'data') {
                str = `window.LUMINOVA_DATA = ${JSON.stringify(mergerBase, null, 2)};`;
                filename = 'data.js';
            } else if (mergerTarget === 'exams') {
                const rawMergedExams = Array.isArray(mergerBase) ? mergerBase : [];
                const legacyWarnings = rawMergedExams
                    .filter(exam => exam && exam.transactionalSubmissionEnabled === undefined)
                    .map(exam => `- ${getExamTitle(exam) || getExamIdentity(exam) || 'اختبار بدون عنوان'}: اختبار قديم غير مفعل على نظام التسليم التعاقدي.`);
                const normalizedExams = rawMergedExams.map(exam => normalizeExamForControl(exam, { settings: data.settings || {} }));
                const validationErrors = [];
                normalizedExams.forEach(exam => {
                    const errors = validateExamForExport(exam);
                    if (errors.length) {
                        validationErrors.push(`- ${getExamTitle(exam) || exam.quizId}:`);
                        errors.forEach(error => validationErrors.push(`  • ${error}`));
                    }
                });
                if (validationErrors.length) {
                    alert(['تم منع التصدير لحماية بيانات الطلاب من التسليم الناقص.', '', ...validationErrors].join('\n'));
                    return;
                }
                if (legacyWarnings.length && !confirm(['تنبيه قبل تحميل exam.js المدمج:', 'بعض الاختبارات القديمة سيتم تصديرها بوضع Legacy بدون تجهيز شيت تعاقدي.', '', ...legacyWarnings, '', 'هل تريد المتابعة؟'].join('\n'))) {
                    return;
                }
                str = encodeLxp2ExamPack(normalizedExams);
                filename = 'exam.js';
            } else if (mergerTarget === 'certs') {
                str = `window.LUMINOVA_CERTIFICATES = ${JSON.stringify(mergerBase, null, 2)};`;
                filename = 'certificates.js';
            }

            const blob = new Blob([str], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        };


        const handleDelete = (collection, id) => {
            if (collection === 'years' && data.semesters.some(s => s.yearId === id)) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'semesters' && data.subjects.some(s => s.semesterId === id)) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'subjects' && (data.summaries.some(s => s.subjectId === id) || data.quizzes.some(q => q.subjectId === id))) return alert(Luminova.i18n[lang].deleteProtected);
            if (collection === 'students' && (data.summaries.some(s => s.studentId === id) || data.quizzes.some(q => (q.questions || []).some(qn => qn.studentId === id)))) return alert(Luminova.i18n[lang].deleteProtected);

            if (confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'تأكيد الحذف؟')) {
                setData(prev => ({ ...prev, [collection]: prev[collection].filter(item => item.id !== id) }));
                if (setIsDirty) {
                    const sourceKey = collection === 'quizzes' ? 'exams' : (collection === 'certificates' ? 'certs' : 'data');
                    setIsDirty(prev => ({ ...prev, [sourceKey]: true }));
                }
            }
        };

        const handleSave = () => {
            if (!editingItem) return;

            // ========== SUMMARIES VALIDATION GATE ==========
            if (activeTab === 'summaries') {
                // 1. Chapter Tag is MANDATORY for the frontend Timeline UI
                if (!editingItem.chapterTag || !editingItem.chapterTag.trim()) {
                    return alert(lang === 'ar'
                        ? '❌ يجب تحديد الفصل الدراسي (Chapter Tag) — مطلوب لعرض الخلاصة الزمنية.'
                        : '❌ يجب تحديد وسم الفصل لعرض الخلاصة الزمنية.');
                }

                // 2. If mediaType is "interactive", validate the lessonUrl strictly
                if (editingItem.mediaType === 'interactive') {
                    const path = (editingItem.lessonUrl || '').trim();
                    if (!path) {
                        return alert(lang === 'ar'
                            ? '❌ يجب إدخال مسار ملف الدرس التفاعلي (Lesson File Path).'
                            : '❌ يجب إدخال مسار ملف الدرس التفاعلي.');
                    }
                    // Must end with .jsx or .js
                    if (!/\.(jsx|js)$/i.test(path)) {
                        return alert(lang === 'ar'
                            ? '❌ مسار الملف يجب أن ينتهي بـ .jsx أو .js'
                            : '❌ مسار الملف يجب أن ينتهي بـ .jsx أو .js');
                    }
                    // No spaces allowed
                    if (/\s/.test(path)) {
                        return alert(lang === 'ar'
                            ? '❌ مسار الملف لا يجب أن يحتوي على مسافات فارغة.'
                            : '❌ مسار الملف لا يجب أن يحتوي على مسافات فارغة.');
                    }
                    // No invalid URL characters (allow alphanumerics, hyphens, underscores, dots, slashes)
                    if (/[^a-zA-Z0-9\-_.\/]/.test(path)) {
                        return alert(lang === 'ar'
                            ? '❌ مسار الملف يحتوي على أحرف غير صالحة. يُسمح فقط بالأحرف والأرقام و - و _ و . و /'
                            : '❌ مسار الملف يحتوي على أحرف غير صالحة.');
                    }
                    // Sanitize: commit the trimmed path back
                    editingItem.lessonUrl = path;
                }
            }

            if (activeTab === 'quizzes') {
                const normalizedQuiz = normalizeExamForControl(editingItem, { settings: data.settings || {} });
                Object.keys(editingItem).forEach(key => delete editingItem[key]);
                Object.assign(editingItem, normalizedQuiz);
            }

            editingItem.timestamp = editingItem.timestamp || new Date().toISOString();
            if (activeTab === 'certificates') {
                editingItem.date = editingItem.date || editingItem.timestamp;
            }
            if (activeTab === 'quizzes') {
                editingItem.sheetName = (editingItem.sheetName || 'Sheet1').trim() || 'Sheet1';
                editingItem.entryGate = { name: true, department: true, email: true, ...(editingItem.entryGate || {}) };
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
                if (activeTab === 'quizzes') {
                    window.LUMINOVA_EXAMS = newList;
                }

                if (setIsDirty) {
                    const sourceKey = activeTab === 'quizzes' ? 'exams' : (activeTab === 'certificates' ? 'certs' : 'data');
                    setIsDirty(prev => ({ ...prev, [sourceKey]: true }));
                }

                return { ...prev, [activeTab]: newList };
            });
            setEditingItem(null);
        };

        const handleSubSave = (newQ) => {
            const normalizedCurrent = normalizeExamForControl(editingItem || {}, { settings: data.settings || {} });
            const usedIds = new Set((normalizedCurrent.questions || []).map(q => q.id));
            const nextQuestion = { ...newQ };
            const existingQuestionId = nextQuestion.id || nextQuestion.questionId;
            if (!nextQuestion.id && !nextQuestion.questionId) nextQuestion.id = createQuestionId(usedIds);
            const updatedQ = existingQuestionId
                ? normalizedCurrent.questions.map(q => q.id === nextQuestion.id ? { ...q, ...nextQuestion } : q)
                : [...(normalizedCurrent.questions || []), nextQuestion];
            const updatedQuiz = normalizeExamForControl({
                ...normalizedCurrent,
                questions: updatedQ,
                submissionStatus: normalizedCurrent.preparedSchemaHash ? 'schema_changed_after_prepare' : normalizedCurrent.submissionStatus
            }, { settings: data.settings || {} });
            setEditingItem(updatedQuiz);
            setSubView('questionsList');

            // Auto-save question changes to DB instantly
            setData(prev => {
                const newList = prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i);
                window.LUMINOVA_EXAMS = newList;
                if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                return { ...prev, [activeTab]: newList };
            });
        };

        const getNewTemplate = () => {
            const base = { id: `${activeTab}_${Date.now()}`, timestamp: new Date().toISOString() };
            if (activeTab === 'news') return { ...base, titleAr: '', titleEn: '', contentAr: '', contentEn: '', mediaUrl: '' };
            if (activeTab === 'students') return { ...base, nameAr: 'عبد المنعم حجاج', nameEn: 'Abdelmonem Hagag', majorAr: '', majorEn: '', bioAr: '', bioEn: '', image: '', isVIP: false, isVerified: false, role: 'student', socialLinks: { facebook: '', instagram: '', linkedin: '' } };
            if (activeTab === 'years' || activeTab === 'semesters' || activeTab === 'subjects') return { ...base, nameAr: '', nameEn: '', yearId: '', semesterId: '' };
            if (activeTab === 'summaries') return { ...base, titleAr: '', titleEn: '', contentAr: '', contentEn: '', mediaUrl: '', subjectId: '', studentId: '', mediaType: 'video', chapterTag: '', lessonUrl: '' };
            if (activeTab === 'quizzes') {
                const quizId = 'EXM_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                return normalizeExamForControl({ ...base, id: quizId, quizId, titleAr: '', titleEn: '', examCode: quizId, isShuffled: false, feedbackMode: 'end', subjectId: '', publisherId: '', questions: [], examMode: 'practice', sheetName: `Exam_${quizId}`, startTime: '', endTime: '', latePolicy: 'hard_stop', allowBackNavigation: true, webhookUrl: '', transactionalSubmissionEnabled: false, duplicatePolicy: 'prevent_success_by_email_when_no_retakes', entryGate: { name: true, department: true, email: true } }, { settings: data.settings || {}, defaultTransactional: true });
            }
            if (activeTab === 'certificates') return { ...base, studentName: '', studentNameEn: '', senderName: '', senderNameEn: '', senderRole: 'doctor', title: '', titleEn: '', description: '', descriptionEn: '', isFeatured: false, badges: [], date: base.timestamp, level: 'standard' };
            return base;
        };

        // Using global Inputs inside AdminCMS to prevent transient React rendering issues Focus Drop.

        // ---------------- QUESTIONS SUB-VIEW BUILDER ----------------
        if (subView === 'questionsList' || subView === 'editQuestion') {

            if (subView === 'editQuestion') {
                const tempQ = qItem || { type: 'mcq', text: '', score: 1, options: ['', '', '', ''], correctAnswers: [0], modelAnswer: '', explanation: '', studentId: Luminova.FOUNDER.id, showExp: false };
                return html`
                <div key="edit-question-view" className="animate-fade-in pb-20 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        <h2 className="text-3xl font-bold text-brand-DEFAULT">${tempQ.id ? 'تعديل سؤال' : 'سؤال جديد'}</h2>
                        <${Luminova.Components.Button} onClick=${() => setSubView('questionsList')}>${Luminova.i18n[lang].cancel}</${Luminova.Components.Button}>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-4">
                             <div className="grid grid-cols-3 gap-4">
                                 <div className="col-span-1">
                                     <label className="block text-sm font-black mb-2 opacity-80">نوع السؤال</label>
                                     <select value=${tempQ.type || 'mcq'} onChange=${e => setQItem({ ...tempQ, type: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold outline-none">
                                         <option value="mcq">اختيار من متعدد (إجابة واحدة)</option>
                                         <option value="multi_select">اختيار من متعدد (عدة إجابات)</option>
                                         <option value="essay">مقال / تعليل</option>
                                     </select>
                                 </div>
                                 <div className="col-span-1">
                                     <label className="block text-sm font-black mb-2 opacity-80">درجة السؤال</label>
                                     <input type="number" value=${tempQ.score || 1} onChange=${e => setQItem({ ...tempQ, score: Number(e.target.value) })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold outline-none text-center" />
                                 </div>
                                 <div className="col-span-1">
                                    <label className="block text-sm font-black mb-2 opacity-80">المساهم</label>
                                    <select value=${tempQ.studentId || ''} onChange=${(e) => setQItem({ ...tempQ, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 font-bold z-50 outline-none">
                                        <option value="">-- بدون مساهم --</option>
                                        ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                    </select>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="col-span-2 pt-6">
                            <label className="block text-sm font-bold mb-2">نص السؤال</label>
                            <textarea value=${tempQ.text || tempQ.textAr || ''} onChange=${e => setQItem({ ...tempQ, text: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 outline-none text-lg resize-y min-h-[120px]" placeholder="اكتب نص السؤال هنا..." />
                        </div>
                        <div className="col-span-2 w-full mt-2">
                            <${Luminova.Components.UniversalMediaInput} label="مرفقات السؤال التوضيحية (اختياري)" attachments=${tempQ.mediaUrls || (tempQ.mediaUrl ? [tempQ.mediaUrl] : [])} onChange=${v => setQItem({ ...tempQ, mediaUrls: v, mediaUrl: '' })} />
                        </div>

                        ${tempQ.type !== 'essay' ? html`
                            <div key="options-editor-section" className="col-span-2 space-y-3 pt-6">
                                <label className="block text-sm font-bold mb-2 flex justify-between items-center">
                                    <span>خيارات الإجابة</span>
                                    <${Luminova.Components.Button} onClick=${() => setQItem({ ...tempQ, options: [...(tempQ.options || []), ''] })} variant="primary" size="sm">+ إضافة خيار</${Luminova.Components.Button}>
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
                                        <${Luminova.Components.Button} variant="ghost" size="sm" className="text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-50 hover:opacity-100 transition-all" onClick=${() => { const newOps = tempQ.options.filter((_, i) => i !== idx); setQItem({ ...tempQ, options: newOps, correctAnswers: [0] }); }} title="حذف الخيار"><${Luminova.Icons.Trash} /></${Luminova.Components.Button}>
                                    </div>
                                `)}
                            </div>
                        ` : html`
                            <div className="col-span-2 pt-6">
                                <label className="block text-sm font-bold mb-2">الإجابة النموذجية</label>
                                <textarea value=${tempQ.modelAnswer || tempQ.modelAnswerAr || ''} onChange=${e => setQItem({ ...tempQ, modelAnswer: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 dark:border-gray-700 outline-none min-h-[100px]" placeholder="اكتب الإجابة النموذجية للسؤال المقالي..." />
                            </div>
                        `}

                        <div className="col-span-2 pt-6">
                            <label className="block text-sm font-bold mb-2">التعليل</label>
                            <textarea value=${tempQ.explanation || tempQ.explanationAr || ''} onChange=${e => setQItem({ ...tempQ, explanation: e.target.value })} className="w-full p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 outline-none min-h-[100px] text-brand-gold" placeholder="اكتب شرحاً أو تعليلاً لسبب الإجابة الصحيحة..." />
                        </div>

                        <div className="col-span-2 mt-8 flex gap-4 border-t pt-4">
                            <${Luminova.Components.Button} onClick=${() => handleSubSave(tempQ)} className="w-full text-xl py-3 rounded-2xl shadow-[0_5px_30px_-10px_rgba(6,182,212,0.8)]">${Luminova.i18n[lang].save} السؤال</${Luminova.Components.Button}>
                        </div>
                    </div>
                </div>
            `;
            } // End Edit Question

            const allQuestions = normalizeExamQuestions(editingItem.questions || []);
            const filteredQuestions = allQuestions.filter(q => questionMatchesSearch(q, qSearchQuery));

            return html`
            <div key="questions-list-view" className="animate-fade-in pb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-3xl font-black text-brand-gold">مصفوفة أسئلة الاختبار</h2>
                        <h3 className="text-xl font-bold opacity-70 mt-2">${editingItem.title || editingItem.titleAr || ''}</h3>
                    </div>
                    <div className="flex gap-3">
                        <${Luminova.Components.Button} onClick=${() => { setSubView(''); setEditingItem(null); }} variant="glass">العودة لقائمة الاختبارات</${Luminova.Components.Button}>
                        <${Luminova.Components.Button} onClick=${() => setSubView('')}>رجوع لصفحة الإعدادات</${Luminova.Components.Button}>
                    </div>
                </div>
                
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <${Luminova.Components.Button} onClick=${() => { setQItem(null); setSubView('editQuestion'); }} variant="success" size="lg" className="shrink-0 flex items-center justify-center gap-2 rounded-2xl">
                        <span>+ إضافة سؤال</span>
                    </${Luminova.Components.Button}>
                    <div className="relative flex-1 max-w-md">
                        <input 
                            type="text" 
                            value=${qSearchQuery} 
                            onChange=${e => setQSearchQuery(e.target.value)} 
                            placeholder="ابحث داخل أسئلة الاختبار..." 
                            className="w-full px-5 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold focus:border-brand-DEFAULT outline-none transition-all text-right" 
                            dir="rtl"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 text-lg">🔍</span>
                        ${qSearchQuery && html`
                            <${Luminova.Components.Button}
                                key="clear-q-search"
                                variant="ghost"
                                size="sm"
                                onClick=${() => setQSearchQuery('')}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                                title="مسح البحث"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </${Luminova.Components.Button}>
                        `}
                    </div>
                </div>

                <div className="mb-4 text-sm font-bold text-gray-600 dark:text-gray-400">
                    عدد الأسئلة المطابقة: ${filteredQuestions.length} من إجمالي ${allQuestions.length}
                </div>
                
                <div className="space-y-4">
                    ${filteredQuestions.map((q) => {
                        const originalIdx = allQuestions.findIndex(x => x.id === q.id);
                        return html`
                            <${Luminova.Components.GlassCard} key=${q.id || `q_${originalIdx}`} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-brand-DEFAULT p-4">
                                <div className="flex-1 min-w-0 text-right" dir="rtl">
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold text-brand-DEFAULT shrink-0 text-lg">س${originalIdx + 1}.</span>
                                        <span className="text-lg font-bold text-gray-800 dark:text-gray-200 break-words cursor-help" title=${q.text || q.textAr || q.textEn || ''}>
                                            ${makeQuestionPreview(q.text || q.textAr || q.textEn || 'سؤال بدون عنوان', 160)}
                                        </span>
                                    </div>
                                    <div className="text-xs opacity-60 mt-2 flex flex-wrap gap-x-3 gap-y-1 font-semibold text-gray-600 dark:text-gray-400">
                                        <span className="px-2 py-0.5 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-md">${q.type === 'mcq' ? 'اختيار من متعدد' : q.type === 'multi_select' ? 'اختيارات متعددة' : 'مقال / تعليل'}</span>
                                        <span>درجة: ${q.score}</span>
                                        <span>المعرّف: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-700 dark:text-gray-300">${q.questionId || q.id}</code></span>
                                        ${q.originalIndex !== undefined && html`<span>الترتيب الأصلي: ${q.originalIndex}</span>`}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                                    <${Luminova.Components.Button}
                                        disabled=${originalIdx === 0}
                                        variant="ghost"
                                        size="sm"
                                        onClick=${() => {
                                            const reordered = [...allQuestions];
                                            const temp = reordered[originalIdx - 1];
                                            reordered[originalIdx - 1] = reordered[originalIdx];
                                            reordered[originalIdx] = temp;
                                            const updatedQuiz = normalizeExamForControl({ ...editingItem, questions: reordered, submissionStatus: editingItem.preparedSchemaHash ? 'schema_changed_after_prepare' : editingItem.submissionStatus }, { settings: data.settings || {} });
                                            setEditingItem(updatedQuiz);
                                            setData(prev => {
                                                const newList = prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i);
                                                window.LUMINOVA_EXAMS = newList;
                                                if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                                                return { ...prev, [activeTab]: newList };
                                            });
                                        }}
                                        className="p-3 text-gray-500 rounded-lg"
                                        title="تحريك لأعلى"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </${Luminova.Components.Button}>
                                    <${Luminova.Components.Button}
                                        disabled=${originalIdx === allQuestions.length - 1}
                                        variant="ghost"
                                        size="sm"
                                        onClick=${() => {
                                            const reordered = [...allQuestions];
                                            const temp = reordered[originalIdx + 1];
                                            reordered[originalIdx + 1] = reordered[originalIdx];
                                            reordered[originalIdx] = temp;
                                            const updatedQuiz = normalizeExamForControl({ ...editingItem, questions: reordered, submissionStatus: editingItem.preparedSchemaHash ? 'schema_changed_after_prepare' : editingItem.submissionStatus }, { settings: data.settings || {} });
                                            setEditingItem(updatedQuiz);
                                            setData(prev => {
                                                const newList = prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i);
                                                window.LUMINOVA_EXAMS = newList;
                                                if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                                                return { ...prev, [activeTab]: newList };
                                            });
                                        }}
                                        className="p-3 text-gray-500 rounded-lg"
                                        title="تحريك لأسفل"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </${Luminova.Components.Button}>
                                    <${Luminova.Components.Button}
                                        variant="outline"
                                        size="sm"
                                        onClick=${() => { setQItem(q); setSubView('editQuestion'); }}
                                        className="p-3 text-blue-500 rounded-lg"
                                        title="تعديل السؤال"
                                    >
                                        <${Luminova.Icons.Edit} />
                                    </${Luminova.Components.Button}>
                                    <${Luminova.Components.Button}
                                        variant="danger"
                                        size="sm"
                                        onClick=${() => {
                                            if (confirm('هل تريد حذف السؤال؟')) {
                                                const updatedQ = allQuestions.filter(x => x.id !== q.id);
                                                const updatedQuiz = normalizeExamForControl({ ...editingItem, questions: updatedQ, submissionStatus: editingItem.preparedSchemaHash ? 'schema_changed_after_prepare' : editingItem.submissionStatus }, { settings: data.settings || {} });
                                                setEditingItem(updatedQuiz);
                                                setData(prev => {
                                                    const newList = prev[activeTab].map(i => i.id === updatedQuiz.id ? updatedQuiz : i);
                                                    window.LUMINOVA_EXAMS = newList;
                                                    if (setIsDirty) setIsDirty(prev => ({ ...prev, exams: true }));
                                                    return { ...prev, [activeTab]: newList };
                                                });
                                            }
                                        }}
                                        className="p-3 text-red-500 rounded-lg"
                                        title="حذف السؤال"
                                    >
                                        <${Luminova.Icons.Trash} />
                                    </${Luminova.Components.Button}>
                                </div>
                            </${Luminova.Components.GlassCard}>
                        `;
                    })}
                    ${allQuestions.length === 0 && html`
                        <div key="empty-questions-alert" className="p-10 border-2 border-dashed rounded-2xl text-center font-bold opacity-50">لا يوجد أسئلة.. أضف سؤالاً للاختبار.</div>
                    `}
                    ${allQuestions.length > 0 && filteredQuestions.length === 0 && html`
                        <div key="no-matching-questions-alert" className="p-10 border-2 border-dashed rounded-2xl text-center font-bold opacity-50">لا توجد أسئلة تطابق البحث.</div>
                    `}
                </div>
            </div>
        `;
        }

        // Filter logic including Real-Time Search
        let activeTableItems = data[activeTab] ? data[activeTab].filter(item => activeTab !== 'students' || !item.isFounder) : [];
        if (window.CMS_USER_ROLE === 'editor' && (activeTab === 'quizzes' || activeTab === 'certificates')) {
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
                String(item.id || '').toLowerCase().includes(query)
            );
        }

        const displayedTableItems = activeTableItems.slice(0, cmsVisibleCount);
        const isEditingEvaluativeExam = activeTab === 'quizzes' && editingItem && editingItem.examMode === 'evaluation';
        const editingExamControl = isEditingEvaluativeExam
            ? normalizeExamForControl({ ...editingItem, transactionalSubmissionEnabled: editingItem.transactionalSubmissionEnabled !== false }, { settings: data.settings || {} })
            : null;
        const editingExamBadge = editingExamControl ? getSubmissionStatusBadge(editingExamControl.submissionStatus) : null;
        const editingExamWebhookStatus = editingExamControl ? validateWebhookUrl(editingExamControl.webhookUrl) : null;

        return html`
        <div className="animate-fade-in pb-20 max-w-[1400px] mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 border-b-4 border-brand-DEFAULT pb-4 sm:pb-6 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-30 pt-4 rounded-b-3xl px-4 sm:px-8 shadow-sm">
                <h2 className="text-2xl sm:text-4xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-brand-hover to-brand-gold">⚙️ CMS</h2>
                <div className="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-end">

                    
                        <${Luminova.Components.Button}
                            key="export-data"
                            onClick=${handleExportData}
                            variant="primary"
                            className="text-sm sm:text-base px-4 sm:px-6"
                            title=${lang === 'ar' ? 'تصدير الإعدادات والأخبار والطلاب والمواد والتلخيصات' : 'تصدير الإعدادات والأخبار والطلاب والمواد والتلخيصات'}
                            leadingIcon=${html`
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            `}
                        >
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير data.js' : 'تصدير data.js'}</span>
                            <span className="sm:hidden">data.js</span>
                        </${Luminova.Components.Button}>
                    

                    ${/* Context-sensitive: show certificates export only on certificates tab */ activeTab === 'certificates' && html`
                        <${Luminova.Components.Button}
                            key="export-certs"
                            onClick=${handleExportCertificates}
                            variant="warning"
                            className="text-sm sm:text-base px-4 sm:px-6 rounded-2xl"
                            title=${lang === 'ar' ? 'تصدير ملف الشهادات فقط' : 'تصدير ملف الشهادات فقط'}
                            leadingIcon=${html`
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            `}
                        >
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير certificates.js' : 'تصدير certificates.js'}</span>
                            <span className="sm:hidden">certs.js</span>
                        </${Luminova.Components.Button}>
                    `}

                    ${/* Context-sensitive: show exam export only on quizzes tab */ activeTab === 'quizzes' && html`
                        <${Luminova.Components.Button}
                            key="export-exams"
                            onClick=${handleExportExams}
                            variant="secondary"
                            className="text-sm sm:text-base px-4 sm:px-6 rounded-2xl"
                            title=${lang === 'ar' ? 'تصدير ملف الاختبارات فقط' : 'تصدير ملف الاختبارات فقط'}
                            leadingIcon=${html`
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            `}
                        >
                            <span className="hidden sm:inline">${lang === 'ar' ? 'تصدير exam.js' : 'تصدير exam.js'}</span>
                            <span className="sm:hidden">exam.js</span>
                        </${Luminova.Components.Button}>
                    `}

                    <${Luminova.Components.Button} key="logout-btn" variant="danger" onClick=${goBack} className="text-sm sm:text-base px-4 sm:px-8 rounded-2xl">${Luminova.i18n[lang].logout}</${Luminova.Components.Button}>
                </div>
            </div>

            <div key="cms-main-content" className="flex flex-col xl:flex-row gap-4 sm:gap-8">
                <div key="cms-sidebar" className="w-full xl:w-1/4">
                    <div className="xl:sticky xl:top-40">
                        <div className="flex xl:flex-col gap-2 sm:gap-3 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0 scrollbar-hide bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl xl:rounded-3xl p-3 sm:p-4 shadow-lg border border-white/20 dark:border-gray-700/30">
                        ${validTabs.map(key => html`
                            <${Luminova.Components.Button}
                                key=${key}
                                onClick=${() => { setActiveTab(key); setEditingItem(null); setSubView(''); }}
                                variant=${activeTab === key ? 'primary' : 'ghost'}
                                className=${`whitespace-nowrap xl:whitespace-normal xl:w-full text-start px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all flex justify-between items-center gap-2 shrink-0 ${activeTab === key ? 'bg-gradient-to-r from-brand-DEFAULT/90 to-brand-hover text-white shadow-xl shadow-brand-DEFAULT/20 scale-[1.02]' : 'bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <span>${Luminova.i18n[lang][key] || key.toUpperCase()}</span>
                                <span className=${`text-xs font-black px-2 py-0.5 rounded-lg ${activeTab === key ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'}`}>
                                    ${key === 'students' ? (data.students?.filter(s => !s.isFounder).length || 0) : (data[key]?.length || 0)}
                                </span>
                            </${Luminova.Components.Button}>
                        `)}
                        </div>
                    </div>
                </div>

                <div key="cms-content-card-wrapper" className="w-full xl:w-3/4">
                    <${Luminova.Components.GlassCard} className="border-none shadow-2xl bg-white/40 dark:bg-black/20 backdrop-blur-3xl min-h-[50vh] xl:min-h-[70vh]">
                        <div key="glasscard-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b dark:border-gray-700 pb-4 sm:pb-6 px-4 gap-4">
                            <h3 className="text-2xl sm:text-4xl font-black text-brand-DEFAULT shrink-0">${Luminova.i18n[lang][activeTab] || activeTab}</h3>
                            ${!editingItem && html`
                                <div key="search-add-bar" className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-1 sm:max-w-xl sm:justify-end items-stretch">
                                    <input type="text" placeholder=${lang === 'ar' ? 'بحث في هذا القسم...' : 'بحث في هذا القسم...'} value=${cmsSearchQuery} onChange=${e => setCmsSearchQuery(e.target.value)} className="w-full sm:flex-1 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border-2 border-brand-DEFAULT/30 focus:border-brand-DEFAULT focus:shadow-[0_0_20px_rgba(6,182,212,0.6)] outline-none shadow-lg text-brand-DEFAULT dark:text-brand-gold font-black placeholder:text-gray-400 text-sm sm:text-base transition-all" />
                                    ${activeTab === 'quizzes' && html`
                                        <div key="import-merge-zone" className="relative overflow-hidden group border-none">
                                            <${Luminova.Components.Button} className="text-base sm:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all font-black shrink-0 justify-center border-none flex items-center gap-2">
                                                <span>📥</span> ${lang === 'ar' ? 'رفع ودمج ملفات الاختبار' : 'رفع ودمج ملفات الاختبار'}
                                            </${Luminova.Components.Button}>
                                            <input type="file" multiple accept=".js,.json" onChange=${handleMultiExamImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="رفع ودمج ملفات الاختبار" />
                                        </div>
                                    `}
                                    <${Luminova.Components.Button} key="add-new-btn" onClick=${() => setEditingItem(getNewTemplate())} className="text-base sm:text-xl px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-brand-DEFAULT to-brand-hover hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all font-black shrink-0 justify-center border-none">
                                        ${lang === 'ar' ? '+ إضافة جديد' : '+ إضافة جديد'}
                                    </${Luminova.Components.Button}>
                                </div>
                            `}
                        </div>

                        ${!editingItem && activeTab !== 'merger' && sourceStatuses && sourceStatuses[activeTab === 'quizzes' ? 'exams' : (activeTab === 'certificates' ? 'certs' : 'data')] && (() => {
                            const sourceKey = activeTab === 'quizzes' ? 'exams' : (activeTab === 'certificates' ? 'certs' : 'data');
                            const statusInfo = sourceStatuses[sourceKey];
                            const label = sourceKey === 'data' ? 'البيانات' : sourceKey === 'exams' ? 'الاختبارات' : 'الشهادات';
                            
                            let statusColor = 'text-green-500 bg-green-500/10 border-green-500/20';
                            let statusIndicator = '🟢';
                            let statusText = 'متصل';
                            
                            if (statusInfo.status === 'SUCCESS') {
                                if (statusInfo.githubUpdatedAt) {
                                    statusColor = 'text-green-500 bg-green-500/10 border-green-500/20';
                                    statusIndicator = '🟢';
                                    statusText = `متصل — تم تحميل ملف ${label} من GitHub بنجاح`;
                                } else {
                                    statusColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
                                    statusIndicator = '🟡';
                                    statusText = `تعذر فحص آخر Commit — تم تحميل ملف ${label} بنجاح`;
                                }
                            } else if (statusInfo.status === '404_NOT_FOUND') {
                                statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                                statusIndicator = '🔴';
                                statusText = `الملف ${label} غير موجود على GitHub`;
                            } else if (statusInfo.status === 'NETWORK_ERROR' || statusInfo.status === 'HTTP_ERROR') {
                                statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                                statusIndicator = '🔴';
                                statusText = `تعذر الاتصال بمصدر ${label}`;
                            } else if (statusInfo.status === 'INVALID_LXP2_PACK') {
                                statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                                statusIndicator = '🔴';
                                statusText = `تنسيق LXP2 غير صالح لملف ${label}`;
                            } else {
                                statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                                statusIndicator = '🔴';
                                statusText = `خطأ في قراءة أو تحليل ملف ${label}`;
                            }

                            return html`
                            <div key=${`source-status-${sourceKey}`} className=${`mx-4 mb-6 p-4 rounded-2xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${statusColor}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <span className="text-xl animate-pulse">${statusIndicator}</span>
                                    <div>
                                        <div className="font-black text-sm md:text-base flex items-center gap-2 flex-wrap">
                                            <span>المصدر: GitHub</span>
                                            <span className="opacity-40">|</span>
                                            <span>الحالة: ${statusText}</span>
                                            ${isDirty && isDirty[sourceKey] && html`<span className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded font-black animate-pulse">تعديلات غير محفوظة</span>`}
                                        </div>
                                        <div className="text-xs font-bold opacity-75 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            <span>آخر تحميل: ${statusInfo.fetchedAt || 'غير معروف'}</span>
                                            ${statusInfo.githubUpdatedAt && html`
                                                <span>آخر تحديث على GitHub: ${statusInfo.githubUpdatedAt}</span>
                                            `}
                                            <span>الرابط المستخدم: <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono select-all">${statusInfo.url}</code></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <${Luminova.Components.Button}
                                        onClick=${() => handleReloadClick(sourceKey)}
                                        variant="outline"
                                        size="sm"
                                        className="px-4 py-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
                                        leadingIcon=${html`
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17" />
                                            </svg>
                                        `}
                                    >
                                        <span>تحديث من GitHub</span>
                                    </${Luminova.Components.Button}>
                                </div>
                            </div>
                            `;
                        })()}

                        ${examMergeStatus && html`
                            <div key="exam-merge-status" className="mx-4 mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-black text-center animate-bounce-subtle">
                                ✅ ${examMergeStatus}
                            </div>
                        `}

                        ${!editingItem && ['subjects', 'summaries', 'quizzes'].includes(activeTab) && html`
                            <div key="table-filters" className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 mb-6 relative z-10">
                                <select key="filter-year" value=${filterYear} onChange=${e => { setFilterYear(e.target.value); setFilterSem(''); setFilterSub(''); }} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1">
                                    <option value="">${lang === 'ar' ? 'كل الفرق' : 'كل الفرق'}</option>
                                    ${data.years.map(y => html`<option key=${y.id} value=${y.id}>${y.nameAr || y.name}</option>`)}
                                </select>
                                <select key="filter-semester" value=${filterSem} onChange=${e => { setFilterSem(e.target.value); setFilterSub(''); }} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1 text-brand-DEFAULT">
                                    <option value="">${lang === 'ar' ? 'كل الأترام' : 'كل الأترام'}</option>
                                    ${data.semesters.filter(s => !filterYear || s.yearId === filterYear).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                </select>
                                ${['summaries', 'quizzes'].includes(activeTab) && html`
                                    <select key="filter-subject" value=${filterSub} onChange=${e => setFilterSub(e.target.value)} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 font-bold outline-none flex-1 text-brand-hover">
                                        <option value="">${lang === 'ar' ? 'كل المواد' : 'كل المواد'}</option>
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
                            <div key="editing-form-container" className="bg-white/70 dark:bg-gray-900/70 p-8 rounded-3xl border-2 border-brand-DEFAULT/20 shadow-inner">
                                <div className="flex justify-between items-center mb-8 border-b dark:border-gray-700 pb-4">
                                    <h4 className="text-2xl font-black text-brand-gold">${editingItem.id.includes(activeTab) ? (lang === 'ar' ? 'إنشاء سجل جديد' : 'إنشاء سجل جديد') : (lang === 'تعديل السجل')}</h4>
                                    ${activeTab === 'quizzes' && html`
                                        <${Luminova.Components.Button} key="manage-q-matrix" onClick=${() => setSubView('questionsList')} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 relative overflow-hidden group">
                                            <span className="relative z-10 w-full flex items-center gap-2">📝 إدارة مصفوفة الأسئلة <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">${(editingItem.questions || []).length}</span></span>
                                        </${Luminova.Components.Button}>
                                    `}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    ${(activeTab === 'semesters' || activeTab === 'subjects' || activeTab === 'summaries') && html`
                                        <div key="edit-year-select" className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الفرقة</label>
                                            <select value=${editingItem.yearId || ''} onChange=${e => setEditingItem({ ...editingItem, yearId: e.target.value, semesterId: '', subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/30 font-bold outline-none ring-0">
                                                <option value="">-- اختار الفرقة --</option>
                                                ${data.years.map(y => html`<option key=${y.id} value=${y.id}>${y.nameAr || y.name}</option>`)}
                                            </select>
                                        </div>
                                    `}
                                    ${(activeTab === 'subjects' || activeTab === 'summaries') && html`
                                        <div key="edit-semester-select" className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الترم</label>
                                            <select value=${editingItem.semesterId || ''} onChange=${e => setEditingItem({ ...editingItem, semesterId: e.target.value, subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/30 font-bold outline-none ring-0">
                                                <option value="">-- اختار الترم --</option>
                                                ${data.semesters.filter(s => !editingItem.yearId || s.yearId === editingItem.yearId).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                    `}
                                    ${(activeTab === 'summaries') && html`
                                        <div key="edit-subject-select" className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-hover drop-shadow-sm">المادة</label>
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
                                        <div key="edit-student-select" className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-gold drop-shadow-sm">الطالب المساهم</label>
                                            <select value=${editingItem.studentId || ''} onChange=${e => setEditingItem({ ...editingItem, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-gold/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار الطالب --</option>
                                                ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                    `}

                                    ${activeTab === 'certificates' ? html`
                                        <div key="cert-student-name" className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم الطالب المُكرم بالعربية" val=${editingItem.studentName} onChange=${v => setEditingItem({ ...editingItem, studentName: v })} /></div>
                                        <div key="cert-student-name-en" className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم الطالب المُكرم بلغة أخرى" val=${editingItem.studentNameEn} onChange=${v => setEditingItem({ ...editingItem, studentNameEn: v })} /></div>
                                        
                                        <div key="cert-sender-name" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">اسم المرسل/المانح بالعربية</label>
                                            <input list="senderPresets" value=${editingItem.senderName || ''} onChange=${e => setEditingItem({ ...editingItem, senderName: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all" placeholder="محمود عبد الرحمن" />
                                            <datalist id="senderPresets">
                                                <option value="محمود عبد الرحمن" />
                                            </datalist>
                                        </div>
                                        ${renderFieldTranslator('senderName', 'senderNameEn', 'name_transliteration', 'name')}
                                         <div key="cert-sender-name-en" className="col-span-2 w-full"><${Luminova.Components.Input} label="اسم المرسل/المانح بلغة أخرى" val=${editingItem.senderNameEn} onChange=${v => setEditingItem({ ...editingItem, senderNameEn: v })} /></div>
                                        
                                        <div key="cert-sender-role" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                                                                                                <div key="cert-custom-sender-role-inputs" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div className="w-full"><${Luminova.Components.Input} label="صفة المرسل بالعربية" val=${editingItem.senderRole} onChange=${v => setEditingItem({ ...editingItem, senderRole: v })} /></div>
                                                ${renderFieldTranslator('senderRole', 'senderRoleEn', 'standard_translation', 'role')}
                                                <div className="w-full"><${Luminova.Components.Input} label="صفة المرسل بلغة أخرى" val=${editingItem.senderRoleEn || ''} onChange=${v => setEditingItem({ ...editingItem, senderRoleEn: v })} /></div>
                                                </div>
                                            `}
                                        </div>
                                        <div key="cert-title-select" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                             <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">عنوان الشهادة من القائمة</label>
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
                                                                                          <${Luminova.Components.Input} label="عنوان الشهادة المخصص" val=${editingItem.title} onChange=${v => setEditingItem({ ...editingItem, title: v })} />
                                             </div>
                                             ${renderFieldTranslator('title', 'titleEn', 'standard_translation', 'title')}
                                             <div key="cert-title-en" className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان الشهادة بلغة أخرى" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        
                                        <div key="cert-desc-select" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                             <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT">الوصف وسبب المنح من القائمة</label>
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
                                                                                          <${Luminova.Components.Input} type="textarea" label="الوصف وسبب المنح المخصص" val=${editingItem.description} onChange=${v => setEditingItem({ ...editingItem, description: v })} />
                                             </div>
                                             ${renderFieldTranslator('description', 'descriptionEn', 'standard_translation', 'description')}
                                             <div key="cert-desc-en" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="الوصف وسبب المنح بلغة أخرى" val=${editingItem.descriptionEn} onChange=${v => setEditingItem({ ...editingItem, descriptionEn: v })} /></div>
                                        <div key="cert-featured" className="col-span-2 w-full p-4 border border-brand-DEFAULT rounded-xl"><${Luminova.Components.Input} type="checkbox" label="📌 إظهار كشهادة رئيسية في المنصة" val=${editingItem.isFeatured} onChange=${v => setEditingItem({ ...editingItem, isFeatured: v })} /></div>
                                        
                                        <div key="cert-level" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-3 opacity-80 tracking-wide text-brand-gold">مستوى الشهادة</label>
                                            <select value=${editingItem.level || 'standard'} onChange=${e => setEditingItem({ ...editingItem, level: e.target.value })} className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-brand-gold font-black outline-none shadow-sm cursor-pointer">
                                                <option value="standard">عادية 📜</option>
                                                <option value="gold">ذهبية 🏅</option>
                                                <option value="silver">فضية 🥈</option>
                                            </select>
                                        </div>
                                        
                                        <!-- REALTIME LIVE PREVIEW -->
                                        ${window.Luminova?.Components?.CertificateCard ? html`
                                        <div key="cert-live-preview-box" className="col-span-2 mt-8 py-8 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-gray-800 rounded-3xl overflow-hidden relative group">
                                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                                            <h4 className="font-black text-center mb-6 tracking-[0.3em] opacity-40">✨ معاينة مباشرة للشهادة</h4>
                                            <div className="w-full flex justify-center origin-top pointer-events-none scale-[0.55] sm:scale-75 lg:scale-[0.85] transition-transform" style=${{ transformOrigin: 'top center' }}>
                                                <div className="w-[1000px] shadow-2xl">
                                                    <${Luminova.Components.CertificateCard} certificate=${editingItem} lang=${lang} />
                                                </div>
                                            </div>
                                        </div>
                                        ` : html`<div key="cert-preview-loading" className="col-span-2 p-10 text-center font-bold opacity-50">جاري تحميل معاينة الشهادة...</div>`}
                                    ` : activeTab === 'students' ? html`
                                        <div key="stud-names" className="col-span-2 flex flex-col md:flex-row gap-4">
                                            <div className="w-full"><${Luminova.Components.Input} label="الاسم العربي" val=${editingItem.nameAr} onChange=${v => setEditingItem({ ...editingItem, nameAr: v })} /></div>
                                            ${renderFieldTranslator('nameAr', 'nameEn', 'name_transliteration', 'name')}
                                            <div className="w-full"><${Luminova.Components.Input} label="الاسم بلغة أخرى" val=${editingItem.nameEn} onChange=${v => setEditingItem({ ...editingItem, nameEn: v })} /></div>
                                         </div>
                                        <div key="stud-majors" className="col-span-2 flex flex-col md:flex-row gap-4">
                                            <div className="w-full"><${Luminova.Components.Input} label="التخصص العربي" val=${editingItem.majorAr} onChange=${v => setEditingItem({ ...editingItem, majorAr: v })} /></div>
                                            ${renderFieldTranslator('majorAr', 'majorEn', 'standard_translation', 'major')}
                                            <div className="w-full"><${Luminova.Components.Input} label="التخصص بلغة أخرى" val=${editingItem.majorEn} onChange=${v => setEditingItem({ ...editingItem, majorEn: v })} /></div>
                                         </div>
                                        <div key="stud-bio-ar" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="نبذة عربية" val=${editingItem.bioAr} onChange=${v => setEditingItem({ ...editingItem, bioAr: v })} /></div>
                                        ${renderFieldTranslator('bioAr', 'bioEn', 'standard_translation', 'bio')}
                                         <div key="stud-bio-en" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="نبذة بلغة أخرى" val=${editingItem.bioEn} onChange=${v => setEditingItem({ ...editingItem, bioEn: v })} /></div>
                                        <div key="stud-media" className="col-span-2 w-full">
                                            <${Luminova.Components.UniversalMediaInput} label="مرفقات الطالب / الصورة الشخصية" attachments=${editingItem.mediaUrls || (editingItem.image ? [editingItem.image] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, image: v[0] || '' })} />
                                        </div>
                                        <div key="stud-social" className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <${Luminova.Components.SocialInput} label="رابط فيسبوك" val=${editingItem.socialLinks?.facebook} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), facebook: v } })} /> 
                                            <${Luminova.Components.SocialInput} label="رابط إنستجرام" val=${editingItem.socialLinks?.instagram} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), instagram: v } })} /> 
                                            <${Luminova.Components.SocialInput} label="رابط لينكدإن" val=${editingItem.socialLinks?.linkedin} onChange=${v => setEditingItem({ ...editingItem, socialLinks: { ...(editingItem.socialLinks || {}), linkedin: v } })} />
                                        </div>
                                        <div key="stud-flags" className="col-span-2 flex gap-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <${Luminova.Components.Input} type="checkbox" label="⭐ عضو مميز بإطار خاص" val=${editingItem.isVIP} onChange=${v => { setEditingItem({ ...editingItem, isVIP: v }) }} />
                                            <${Luminova.Components.Input} type="checkbox" label="🔵✔️ موثق بشارة زرقاء" val=${editingItem.isVerified} onChange=${v => { setEditingItem({ ...editingItem, isVerified: v }) }} />
                                        </div>
                                        <div key="stud-role" className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-black mb-3 opacity-80 text-teal-600 dark:text-teal-400">🎓 دور المستخدم</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border-2 ${editingItem.role !== 'doctor' ? 'border-brand-DEFAULT' : 'border-gray-200 dark:border-gray-700'} shadow-sm flex-1">
                                                    <input type="radio" name="userRole" value="student" checked=${editingItem.role !== 'doctor'} onChange=${() => setEditingItem({ ...editingItem, role: 'student' })} className="w-5 h-5 accent-brand-DEFAULT" />
                                                    <span className="font-bold">👤 طالب</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border-2 ${editingItem.role === 'doctor' ? 'border-teal-500' : 'border-gray-200 dark:border-gray-700'} shadow-sm flex-1">
                                                    <input type="radio" name="userRole" value="doctor" checked=${editingItem.role === 'doctor'} onChange=${() => setEditingItem({ ...editingItem, role: 'doctor' })} className="w-5 h-5 accent-teal-500" />
                                                    <span className="font-bold text-teal-600 dark:text-teal-400">🎓 دكتور</span>
                                                </label>
                                            </div>
                                        </div>
                                    ` : activeTab === 'news' ? html`
                                        <div key="news-publisher" className="col-span-2">
                                            <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الناشر</label>
                                            <select value=${editingItem.studentId || ''} onChange=${e => setEditingItem({ ...editingItem, studentId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-brand-DEFAULT/50 font-bold outline-none ring-0">
                                                <option value="">-- اختار الناشر --</option>
                                                ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                            </select>
                                        </div>
                                        <div key="news-title-ar" className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان الخبر" val=${editingItem.titleAr} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} /></div>
                                        <div key="news-title-en" className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان الخبر بلغة أخرى" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        <div key="news-content-ar" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="التفاصيل (عربي)" val=${editingItem.contentAr} onChange=${v => setEditingItem({ ...editingItem, contentAr: v })} /></div>
                                        <div key="news-content-en" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="التفاصيل بلغة أخرى" val=${editingItem.contentEn} onChange=${v => setEditingItem({ ...editingItem, contentEn: v })} /></div>
                                        <div key="news-media" className="col-span-2 w-full mt-2">
                                            <${Luminova.Components.UniversalMediaInput} label="مرفقات الخبر" attachments=${editingItem.mediaUrls || (editingItem.mediaUrl ? [editingItem.mediaUrl] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, mediaUrl: '' })} />
                                        </div>
                                    ` : activeTab === 'summaries' ? html`
                                        <div key="sum-title-ar" className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان التلخيص" val=${editingItem.titleAr} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} /></div>
                                        <div key="sum-title-en" className="col-span-2 w-full"><${Luminova.Components.Input} label="عنوان التلخيص بلغة أخرى" val=${editingItem.titleEn} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} /></div>
                                        <div key="sum-content-ar" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="نبذة محتوى (عربي)" val=${editingItem.contentAr} onChange=${v => setEditingItem({ ...editingItem, contentAr: v })} /></div>
                                        <div key="sum-content-en" className="col-span-2 w-full"><${Luminova.Components.Input} type="textarea" label="محتوى التلخيص بلغة أخرى" val=${editingItem.contentEn} onChange=${v => setEditingItem({ ...editingItem, contentEn: v })} /></div>
                                        <div key="sum-meta" className="col-span-2 flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="w-full">
                                                <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">نوع المحتوى</label>
                                                <select value=${editingItem.mediaType || 'video'} onChange=${e => setEditingItem({ ...editingItem, mediaType: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all">
                                                    <option value="video">فيديو</option>
                                                    <option value="pdf">ملف PDF</option>
                                                    <option value="interactive">شرح تفاعلي</option>
                                                    <option value="exam">اختبار</option>
                                                    <option value="other">أرشيف / أخرى</option>
                                                </select>
                                            </div>
                                            <div className="w-full">
                                                <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الفصل الدراسي (Chapter Tag) - للتجميع في الخلاصة</label>
                                                <input list="chapterPresets" value=${editingItem.chapterTag || ''} onChange=${e => setEditingItem({ ...editingItem, chapterTag: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-brand-DEFAULT transition-all" placeholder="مثال: الفصل الأول" />
                                                <datalist id="chapterPresets">
                                                    <option value="الفصل الأول" />
                                                    <option value="الفصل الثاني" />
                                                    <option value="الفصل الثالث" />
                                                    <option value="الفصل الرابع" />
                                                    <option value="الفصل الخامس" />
                                                    <option value="الفصل السادس" />
                                                    <option value="الفصل السابع" />
                                                    <option value="الفصل الثامن" />
                                                </datalist>
                                            </div>
                                        </div>
                                        ${editingItem.mediaType === 'interactive' ? html`
                                            <div key="sum-interactive-url" className="col-span-2 w-full mt-2 p-6 rounded-2xl border-2 border-purple-400/40 bg-gradient-to-br from-purple-50/60 to-indigo-50/60 dark:from-purple-900/15 dark:to-indigo-900/15 backdrop-blur-xl shadow-lg">
                                                <label className="block text-sm font-black mb-3 text-purple-600 dark:text-purple-400 drop-shadow-sm flex items-center gap-2">
                                                    <span>🧩</span> مسار ملف الدرس التفاعلي
                                                </label>
                                                <input
                                                    type="text"
                                                    value=${editingItem.lessonUrl || ''}
                                                    onChange=${e => {
                            const val = e.target.value;
                            setEditingItem({ ...editingItem, lessonUrl: val });
                        }}
                                                    className=${`w-full p-4 rounded-xl bg-white dark:bg-gray-800 border-2 font-mono font-bold outline-none transition-all ${editingItem.lessonUrl && !/\.(jsx|js)$/i.test(editingItem.lessonUrl.trim())
                            ? 'border-red-400 focus:border-red-500 text-red-600 dark:text-red-400'
                            : editingItem.lessonUrl && /\.(jsx|js)$/i.test(editingItem.lessonUrl.trim())
                                ? 'border-green-400 focus:border-green-500 text-green-700 dark:text-green-400'
                                : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                        }`}
                                                    placeholder="lessons/interactive/chapter1-intro.jsx"
                                                    dir="ltr"
                                                />
                                                <div className="flex items-center gap-2 mt-3">
                                                    ${editingItem.lessonUrl && /\.(jsx|js)$/i.test(editingItem.lessonUrl.trim()) && !/\s/.test(editingItem.lessonUrl.trim())
                            ? html`<span key="path-valid" className="text-green-500 text-sm font-bold flex items-center gap-1">✅ مسار صالح</span>`
                            : editingItem.lessonUrl
                                ? html`<span key="path-invalid" className="text-red-500 text-sm font-bold flex items-center gap-1">⚠️ يجب أن ينتهي بـ .jsx أو .js بدون مسافات</span>`
                                : html`<span key="path-help" className="text-gray-500 dark:text-gray-400 text-xs">يجب أن ينتهي المسار بـ .jsx أو .js — مثال: lessons/physics/force-sim.jsx</span>`
                        }
                                                </div>
                                            </div>
                                        ` : html`
                                            <div key="sum-media-input" className="col-span-2 w-full mt-2">
                                                <${Luminova.Components.UniversalMediaInput} label="مرفقات التلخيص" attachments=${editingItem.mediaUrls || (editingItem.mediaUrl ? [editingItem.mediaUrl] : [])} onChange=${v => setEditingItem({ ...editingItem, mediaUrls: v, mediaUrl: '' })} />
                                            </div>
                                        `}
                                    ` : activeTab === 'quizzes' ? html`
                                        <!-- كارت 1 — بيانات الاختبار -->
                                        <div key="card-1-info" className="col-span-2 bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                                            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                <span className="text-brand-DEFAULT text-2xl">📋</span> بيانات الاختبار
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="col-span-2 md:col-span-1">
                                                     <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الفرقة</label>
                                                     <select value=${editingItem.yearId || ''} onChange=${e => setEditingItem({ ...editingItem, yearId: e.target.value, semesterId: '', subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 font-bold outline-none focus:border-brand-DEFAULT transition-all">
                                                         <option value="">-- اختار الفرقة --</option>
                                                         ${data.years.map(y => html`<option key=${y.id} value=${y.id}>${y.nameAr || y.name}</option>`)}
                                                     </select>
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                     <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">الترم</label>
                                                     <select value=${editingItem.semesterId || ''} onChange=${e => setEditingItem({ ...editingItem, semesterId: e.target.value, subjectId: '' })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 font-bold outline-none focus:border-brand-DEFAULT transition-all">
                                                         <option value="">-- اختار الترم --</option>
                                                         ${data.semesters.filter(s => !editingItem.yearId || s.yearId === editingItem.yearId).map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                                     </select>
                                                </div>
                                                <div className="col-span-2">
                                                     <label className="block text-sm font-black mb-2 opacity-80 text-brand-hover drop-shadow-sm">المادة</label>
                                                     <select value=${editingItem.subjectId || ''} onChange=${e => setEditingItem({ ...editingItem, subjectId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 font-bold outline-none focus:border-brand-DEFAULT transition-all">
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
                                                <div className="col-span-2">
                                                     <label className="block text-sm font-black mb-2 opacity-80 text-brand-DEFAULT drop-shadow-sm">ناشر الاختبار (للعرض فقط بلا مساهمات)</label>
                                                     <select value=${editingItem.publisherId || ''} onChange=${e => setEditingItem({ ...editingItem, publisherId: e.target.value })} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 font-bold outline-none focus:border-brand-DEFAULT transition-all">
                                                         <option value="">-- اختار الناشر ليعرض على غلاف الاختبار --</option>
                                                         ${studentsWithFounder.map(s => html`<option key=${s.id} value=${s.id}>${s.nameAr || s.name}</option>`)}
                                                     </select>
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <${Luminova.Components.Input} label="عنوان الاختبار العربي" val=${editingItem.titleAr || editingItem.title || ''} onChange=${v => setEditingItem({ ...editingItem, titleAr: v })} />
                                                </div>
                                                ${renderFieldTranslator('titleAr', 'titleEn', 'standard_translation', 'title')}
                                                <div className="col-span-2 md:col-span-1">
                                                    <${Luminova.Components.Input} label="عنوان الاختبار الإنجليزي" val=${editingItem.titleEn || editingItem.title || ''} onChange=${v => setEditingItem({ ...editingItem, titleEn: v })} />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- كارت 2 — سلوك الاختبار -->
                                        <div key="card-2-behavior" className="col-span-2 bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                                            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                <span className="text-brand-DEFAULT text-2xl">⚙️</span> سلوك الاختبار
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="col-span-1 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/50 flex flex-col justify-center">
                                                    <${Luminova.Components.Input} type="checkbox" label="ترتيب عشوائي للأسئلة" val=${editingItem.isShuffled || false} onChange=${v => setEditingItem({ ...editingItem, isShuffled: v })} />
                                                    <p className="text-xs opacity-60 mt-1">يظهر الترتيب بشكل مختلف لكل طالب لزيادة المصداقية.</p>
                                                </div>
                                                <div className="col-span-1 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/50">
                                                    <label className="block text-sm font-black mb-2 opacity-80">توقيت ظهور التعليل</label>
                                                    <select value=${editingItem.feedbackMode || 'end'} onChange=${e => setEditingItem({ ...editingItem, feedbackMode: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-600 font-bold outline-none shadow-sm">
                                                        <option value="end">النتيجة مع التعليل في نهاية الاختبار</option>
                                                        <option value="immediate">تجميد فور إجابة كل سؤال وإظهار التعليل</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-1 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/50 flex flex-col justify-center">
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" checked=${editingItem.allowBackNavigation !== undefined ? editingItem.allowBackNavigation : true} onChange=${e => setEditingItem({ ...editingItem, allowBackNavigation: e.target.checked })} className="w-6 h-6 accent-brand-DEFAULT rounded" />
                                                        <label className="text-sm font-black text-gray-900 dark:text-white cursor-pointer" onClick=${() => setEditingItem({ ...editingItem, allowBackNavigation: !(editingItem.allowBackNavigation !== undefined ? editingItem.allowBackNavigation : true) })}>السماح بالرجوع للسؤال السابق</label>
                                                    </div>
                                                    <p className="text-xs opacity-60 mt-1">يسمح للطالب بالعودة لتعديل إجاباته السابقة.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- كارت 3 — التسليم الرسمي -->
                                        <div key="card-3-delivery" className="col-span-2 bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <h4 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="text-brand-DEFAULT text-2xl">🔗</span> التسليم والتحقق
                                                    </h4>
                                                    <p className="text-sm font-bold opacity-70 mt-1">يتم ضبط اتصال سكربت جوجل لكل اختبار رسمي مباشرة. يجهز الشيت قبل دخول الطلاب ولا يسجل أي طالب وهمي.</p>
                                                </div>
                                                <div className="col-span-1 min-w-[200px]">
                                                    <label className="block text-xs font-black mb-1 opacity-70">نوع الاختبار</label>
                                                    <select value=${editingItem.examMode || 'practice'} onChange=${e => setEditingItem({ ...editingItem, examMode: e.target.value, transactionalSubmissionEnabled: e.target.value === 'evaluation' ? editingItem.transactionalSubmissionEnabled !== false : false })} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-600 font-bold outline-none text-brand-DEFAULT">
                                                        <option value="practice">تدريبي</option>
                                                        <option value="evaluation">رسمي</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                ${editingItem.examMode === 'evaluation' ? html`
                                                    <div key="eval-webhook-url" className="col-span-2">
                                                        <${Luminova.Components.Input} label="رابط التسليم النهائي /exec" val=${editingExamControl?.webhookUrl || ''} onChange=${v => setEditingItem(normalizeExamForControl({ ...editingItem, webhookUrl: v, transactionalSubmissionEnabled: true, submissionStatus: editingItem.preparedSchemaHash ? 'schema_changed_after_prepare' : editingItem.submissionStatus }, { settings: data.settings || {} }))} />
                                                        <p className="text-xs font-bold opacity-70 -mt-2 mb-2">رابط تطبيق الويب النهائي من سكربت جوجل ويجب أن ينتهي بـ /exec.</p>
                                                        ${editingExamWebhookStatus && html`<p className="text-xs font-black mb-3 text-brand-DEFAULT">${editingExamWebhookStatus.message}</p>`}
                                                    </div>
                                                    <div key="eval-sheet-name" className="col-span-2">
                                                        <${Luminova.Components.Input} label="اسم ورقة النتائج" val=${editingExamControl?.sheetName || ''} onChange=${v => setEditingItem(normalizeExamForControl({ ...editingItem, sheetName: sanitizeSheetName(v, 'Exam'), transactionalSubmissionEnabled: true, submissionStatus: editingItem.preparedSchemaHash ? 'schema_changed_after_prepare' : editingItem.submissionStatus }, { settings: data.settings || {} }))} />
                                                        <p className="text-xs font-bold opacity-70 -mt-2">اسم ورقة النتائج داخل ملف ملف جوجل شيت، سيتم تسجيل إجابات الطلاب فيها.</p>
                                                    </div>
                                                    
                                                    <div key="eval-stats-grid" className="col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
                                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"><div className="text-xs opacity-60 font-black">حالة الاتصال</div><div className="font-black text-brand-DEFAULT">${editingExamWebhookStatus?.ok ? 'صالحة' : 'تحتاج ضبط'}</div></div>
                                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"><div className="text-xs opacity-60 font-black">حالة تجهيز الشيت</div><div className="font-black text-brand-DEFAULT">${editingExamControl?.preparedSchemaHash ? 'تم التجهيز' : 'غير مجهز'}</div></div>
                                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"><div className="text-xs opacity-60 font-black">عدد الأسئلة المتوقع</div><div className="font-black text-brand-DEFAULT">${editingExamControl?.expectedQuestionCount || 0}</div></div>
                                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"><div className="text-xs opacity-60 font-black">تطابق النسخة</div><div className="font-black text-brand-DEFAULT">${editingExamControl?.preparedSchemaHash === editingExamControl?.schemaHash ? 'مطابقة' : 'تحتاج تجهيز'}</div></div>
                                                    </div>

                                                    <div key="eval-action-buttons" className="col-span-2 flex flex-col sm:flex-row gap-3 items-stretch mt-2">
                                                        <${Luminova.Components.Button} onClick=${handleTestSubmissionConnection} disabled=${isTestingSubmission || !editingExamControl?.transactionalSubmissionEnabled} loading=${isTestingSubmission} variant="primary" className="flex-1 p-4 rounded-2xl">اختبار اتصال التسليم</${Luminova.Components.Button}>
                                                        <${Luminova.Components.Button} onClick=${handlePrepareExamSheet} disabled=${isPreparingExam || !editingExamControl?.transactionalSubmissionEnabled} loading=${isPreparingExam} variant="success" className="flex-1 p-4 rounded-2xl">تجهيز شيت الاختبار</${Luminova.Components.Button}>
                                                    </div>

                                                    ${submissionActionStatus && html`<div key="submission-status-alert" className="col-span-2 p-4 rounded-xl text-sm font-black border bg-brand-DEFAULT/10 border-brand-DEFAULT/30 text-brand-DEFAULT">${submissionActionStatus.msg}</div>`}

                                                    <details key="eval-tech-details" className="col-span-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-4">
                                                        <summary className="cursor-pointer font-black text-brand-gold">تفاصيل تقنية متقدمة</summary>
                                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                                                            <div><span className="opacity-60">Webhook URL</span><div className="font-mono break-all">${editingExamControl?.webhookUrl || ''}</div></div>
                                                            <div><span className="opacity-60">Result sheet name</span><div className="font-mono break-all">${editingExamControl?.sheetName || ''}</div></div>
                                                            <div><span className="opacity-60">Last prepare status</span><div className="font-mono break-all">${editingExamControl?.preparedAt ? `مجهز في ${editingExamControl.preparedAt} (${editingExamControl.submissionStatus})` : 'غير مجهز'}</div></div>
                                                            <div><span className="opacity-60">Question count</span><div className="font-mono break-all">${editingExamControl?.expectedQuestionCount || 0}</div></div>
                                                            <div><span className="opacity-60">Schema match</span><div className="font-mono break-all">${editingExamControl?.preparedSchemaHash === editingExamControl?.schemaHash ? 'مطابقة' : 'غير مطابقة'}</div></div>
                                                            <div><span className="opacity-60">quizId</span><div className="font-mono break-all">${editingExamControl?.quizId || ''}</div></div>
                                                        </div>
                                                    </details>
                                                ` : html`
                                                    <div className="col-span-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 font-bold">
                                                        هذا الاختبار مضبوط كـ "تدريبي". لحفظ وتجهيز نتائج الطلاب، يرجى تغيير نوع الاختبار إلى "رسمي".
                                                    </div>
                                                `}
                                            </div>
                                        </div>

                                        ${editingItem.examMode === 'evaluation' && html`
                                            <!-- كارت 4 — عرض النتيجة -->
                                            <div key="card-4-result" className="col-span-2 bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                                                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                    <span className="text-brand-DEFAULT text-2xl">📊</span> عرض النتيجة
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-sm font-black mb-3 text-brand-gold">إظهار النتيجة بعد التسليم</label>
                                                        <select value=${editingItem.showResult !== undefined ? (editingItem.showResult ? 'yes' : 'no') : (editingItem.showResultsAfter ? 'yes' : 'no')} onChange=${e => setEditingItem({ ...editingItem, showResult: e.target.value === 'yes', showResultsAfter: e.target.value === 'yes' })} className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-gold/50 text-brand-gold font-bold outline-none focus:border-brand-gold transition-all">
                                                            <option value="no">لا — إخفاء النتيجة تماماً</option>
                                                            <option value="yes">نعم — عرض النتيجة</option>
                                                        </select>
                                                    </div>
                                                    ${(editingItem.showResult || editingItem.showResultsAfter) && html`
                                                        <div key="result-display-mode" className="col-span-2 md:col-span-1">
                                                            <label className="block text-sm font-black mb-3 text-brand-gold">وضع عرض النتيجة</label>
                                                            <select value=${editingItem.resultDisplayMode || 'score_only'} onChange=${e => setEditingItem({ ...editingItem, resultDisplayMode: e.target.value })} className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-gold/50 text-brand-gold font-bold outline-none focus:border-brand-gold transition-all">
                                                                <option value="score_only">الدرجة فقط</option>
                                                                <option value="score_with_answers">الدرجة مع الإجابات</option>
                                                                <option value="score_with_answers_and_explanations">الدرجة مع الإجابات والتعليلات</option>
                                                            </select>
                                                        </div>
                                                        <div key="result-details-grid" className="col-span-2 space-y-3">
                                                            <label className="block text-sm font-black text-brand-gold">تفاصيل العرض</label>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div key="show-score-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600">
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="checkbox" checked=${editingItem.showScore !== false} onChange=${e => setEditingItem({ ...editingItem, showScore: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                        <span className="text-sm font-bold">عرض الدرجة</span>
                                                                    </div>
                                                                </div>
                                                                <div key="show-percentage-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600">
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="checkbox" checked=${editingItem.showPercentage !== false} onChange=${e => setEditingItem({ ...editingItem, showPercentage: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                        <span className="text-sm font-bold">عرض النسبة المئوية</span>
                                                                    </div>
                                                                </div>
                                                                ${(editingItem.resultDisplayMode === 'score_with_answers' || editingItem.resultDisplayMode === 'score_with_answers_and_explanations') && html`
                                                                    <div key="show-correct-answers-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600">
                                                                        <div className="flex items-center gap-3">
                                                                            <input type="checkbox" checked=${editingItem.showCorrectAnswers !== false} onChange=${e => setEditingItem({ ...editingItem, showCorrectAnswers: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                            <span className="text-sm font-bold">عرض الإجابات الصحيحة</span>
                                                                        </div>
                                                                    </div>
                                                                    <div key="show-model-answers-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600">
                                                                        <div className="flex items-center gap-3">
                                                                            <input type="checkbox" checked=${editingItem.showModelAnswers !== false} onChange=${e => setEditingItem({ ...editingItem, showModelAnswers: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                            <span className="text-sm font-bold">عرض الإجابات النموذجية (المقالية)</span>
                                                                        </div>
                                                                    </div>
                                                                `}
                                                                ${editingItem.resultDisplayMode === 'score_with_answers_and_explanations' && html`
                                                                    <div key="show-explanations-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600 md:col-span-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <input type="checkbox" checked=${editingItem.showExplanations !== false} onChange=${e => setEditingItem({ ...editingItem, showExplanations: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                            <span className="text-sm font-bold">عرض التعليلات</span>
                                                                        </div>
                                                                    </div>
                                                                `}
                                                                <div key="allow-review-chk" className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600 md:col-span-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="checkbox" checked=${editingItem.allowReviewAfterSubmit !== false} onChange=${e => setEditingItem({ ...editingItem, allowReviewAfterSubmit: e.target.checked })} className="w-5 h-5 accent-brand-DEFAULT rounded" />
                                                                        <span className="text-sm font-bold">السماح بمراجعة الأسئلة بعد التسليم</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    `}
                                                </div>
                                            </div>

                                            <!-- كارت 5 — الوقت والدخول -->
                                            <div key="card-5-time" className="col-span-2 bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                                                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                    <span className="text-brand-DEFAULT text-2xl">⏳</span> الوقت والدخول
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-3 text-gray-700 dark:text-gray-300">وقت البدء</label>
                                                        <input type="datetime-local" value=${editingItem.startTime || ''} onChange=${e => setEditingItem({ ...editingItem, startTime: e.target.value })} className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-bold outline-none focus:border-brand-DEFAULT transition-all" />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-sm font-black mb-3 text-gray-700 dark:text-gray-300">وقت الانتهاء</label>
                                                        <input type="datetime-local" value=${editingItem.endTime || ''} onChange=${e => setEditingItem({ ...editingItem, endTime: e.target.value })} className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-bold outline-none focus:border-brand-DEFAULT transition-all" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-black mb-3 text-gray-700 dark:text-gray-300">سياسة التأخير</label>
                                                        <select value=${editingItem.latePolicy || 'hard_stop'} onChange=${e => setEditingItem({ ...editingItem, latePolicy: e.target.value })} className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-bold outline-none focus:border-brand-DEFAULT transition-all">
                                                            <option value="hard_stop">منع التسليم</option>
                                                            <option value="grace_period">تحديد كمتأخر</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="col-span-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-brand-DEFAULT/30">
                                                        <label className="block text-sm font-black mb-4 text-brand-DEFAULT">حقول بوابة الدخول الإلزامية</label>
                                                        <div className="flex flex-col sm:flex-row gap-6">
                                                            <label className="flex items-center gap-3"><input type="checkbox" checked disabled className="w-6 h-6 accent-brand-DEFAULT rounded opacity-50" /> <span className="font-bold text-gray-700 dark:text-gray-300">الاسم</span></label>
                                                            <label className="flex items-center gap-3"><input type="checkbox" checked disabled className="w-6 h-6 accent-brand-DEFAULT rounded opacity-50" /> <span className="font-bold text-gray-700 dark:text-gray-300">الشعبة</span></label>
                                                            <label className="flex items-center gap-3"><input type="checkbox" checked disabled className="w-6 h-6 accent-brand-DEFAULT rounded opacity-50" /> <span className="font-bold text-gray-700 dark:text-gray-300">البريد الإلكتروني</span></label>
                                                        </div>
                                                        <p className="text-xs text-brand-DEFAULT/60 mt-4 font-bold">هذه الحقول إجبارية ويتم تطبيقها تلقائياً عند التسجيل.</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <p className="text-sm text-brand-gold font-bold bg-brand-gold/10 p-4 rounded-xl border border-brand-gold/20 flex items-center gap-3">
                                                            <span className="text-xl">⚠️</span> يتم حساب الوقت بدقة بناءً على توقيت القاهرة الفعلي (عبر الإنترنت) متجاهلاً إعدادات جهاز الطالب.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        `}
                                    ` : html`
                                        <div key="default-name-ar-container" className="w-full"><${Luminova.Components.Input} label="الاسم العربي" val=${editingItem.nameAr} onChange=${v => setEditingItem({ ...editingItem, nameAr: v })} /></div>
                                        ${renderFieldTranslator('nameAr', 'nameEn', 'standard_translation', 'name')}
                                         <div key="default-name-en-container" className="w-full"><${Luminova.Components.Input} label="الاسم بلغة أخرى" val=${editingItem.nameEn} onChange=${v => setEditingItem({ ...editingItem, nameEn: v })} /></div>
                                    `}
                                </div>

                                <div className="mt-10 border-t-4 border-gray-200 dark:border-gray-800 pt-6 flex flex-col md:flex-row gap-6 items-center">
                                    <${Luminova.Components.Button} onClick=${handleSave} className="flex-1 w-full text-xl py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(6,182,212,0.8)]">${Luminova.i18n[lang].save} Entity To Database</${Luminova.Components.Button}>
                                    <${Luminova.Components.Button}
                                        onClick=${handleAutoTranslate}
                                        disabled=${isTranslating}
                                        loading=${isTranslating}
                                        variant="secondary"
                                        className="w-full md:w-auto text-lg py-4 px-6 rounded-2xl"
                                    >
                                        ${lang === 'ar' ? 'ترجمة تلقائية للغة الأخرى' : 'ترجمة تلقائية للغة الأخرى'}
                                    </${Luminova.Components.Button}>
                                    <${Luminova.Components.Button} variant="glass" onClick=${() => setEditingItem(null)} className="w-full md:w-[20%] text-xl py-4 rounded-2xl">${Luminova.i18n[lang].cancel}</${Luminova.Components.Button}>
                                </div>
                            </div>
                        ` : activeTab === 'merger' ? html`
                            <div key="merger-tab-container" className="p-4 sm:p-8 animate-fade-in">
                                <div className="mb-10 text-center">
                                    <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-DEFAULT to-brand-gold mb-2">
                                        ${lang === 'ar' ? 'دمج الملفات الذكي' : 'دمج الملفات الذكي'}
                                    </h4>
                                    <p className="opacity-60 font-bold">${lang === 'ar' ? 'قم بدمج وتحديث البيانات من ملفات الفريق الخارجية مع النسخة الحية على جت هب' : 'قم بدمج وتحديث البيانات من ملفات الفريق الخارجية مع النسخة الحية على جت هب'}</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <!-- STEP 1: SELECT & FETCH -->
                                    <div className="space-y-6">
                                        <${Luminova.Components.GlassCard} className="p-6 border-brand-DEFAULT/20 shadow-lg">
                                            <h5 className="font-black text-lg mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-brand-DEFAULT/20 flex items-center justify-center text-brand-DEFAULT text-sm">1</span>
                                                ${lang === 'ar' ? 'تحديد نوع الملف الهدف' : 'تحديد نوع الملف الهدف'}
                                            </h5>
                                            <div className="grid grid-cols-3 gap-3 mb-6">
                                                ${['data', 'exams', 'certs'].map(t => html`
                                                    <${Luminova.Components.Button}
                                                        key=${t}
                                                        onClick=${() => { setMergerTarget(t); setMergerBase(null); setMergerLocal(null); setMergerStatus({ state: 'idle', msg: '' }); }}
                                                        variant=${mergerTarget === t ? 'primary' : 'outline'}
                                                        className=${`p-4 rounded-xl border-2 font-black transition-all h-auto flex-col ${mergerTarget === t ? 'border-brand-DEFAULT bg-brand-DEFAULT/5 text-brand-DEFAULT shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}
                                                    >
                                                        <div className="text-xl mb-1">
                                                            ${t === 'data' ? html`
                                                                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                                                </svg>
                                                            ` : t === 'exams' ? html`
                                                                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                                </svg>
                                                            ` : html`
                                                                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                            `}
                                                        </div>
                                                        <div className="text-xs uppercase">${t === 'data' ? 'البيانات' : t === 'exams' ? 'الاختبارات' : 'الشهادات'}</div>
                                                    </${Luminova.Components.Button}>
                                                `)}
                                            </div>
                                            <${Luminova.Components.Button}
                                                onClick=${handleFetchBase}
                                                loading=${mergerStatus.state === 'loading'}
                                                variant="primary"
                                                className="w-full py-4 rounded-2xl shadow-xl shadow-brand-DEFAULT/20"
                                                leadingIcon=${html`
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                                                    </svg>
                                                `}
                                            >
                                                <span>${lang === 'ar' ? 'سحب النسخة الحية من جت هب' : 'سحب النسخة الحية من جت هب'}</span>
                                            </${Luminova.Components.Button}>
                                        </${Luminova.Components.GlassCard}>

                                        ${mergerBase && html`
                                            <${Luminova.Components.GlassCard} key="merger-base-ready" className="p-6 border-green-500/20 bg-green-500/5 animate-slide-up">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                                                    <div>
                                                        <div className="font-black text-green-600 dark:text-green-400">${lang === 'ar' ? 'تم جلب البيانات بنجاح' : 'تم جلب البيانات بنجاح'}</div>
                                                        <div className="text-xs opacity-60 font-bold uppercase tracking-widest">تم تحميل مصدر ${mergerTarget}.js</div>
                                                    </div>
                                                </div>
                                            </${Luminova.Components.GlassCard}>
                                        `}
                                    </div>

                                    <!-- STEP 2: UPLOAD & MERGE -->
                                    <div className="space-y-6">
                                        <${Luminova.Components.GlassCard} className="p-6 border-brand-gold/20 shadow-lg">
                                            <h5 className="font-black text-lg mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold text-sm">2</span>
                                                ${lang === 'ar' ? 'رفع الملف الجديد للمزامنة' : 'رفع الملف الجديد للمزامنة'}
                                            </h5>
                                            
                                            <div onDragOver=${e => e.preventDefault()} onDrop=${handleFileDrop} className="relative group">
                                                <input type="file" onChange=${handleFileDrop} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".js,.json" />
                                                <div className="border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center transition-all group-hover:border-brand-gold/50 group-hover:bg-brand-gold/5">
                                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                                                    <div className="font-black opacity-60">${lang === 'ar' ? 'اسحب الملف هنا أو اضغط للاختيار' : 'اسحب الملف هنا أو اضغط للاختيار'}</div>
                                                    <div className="text-xs mt-2 text-brand-gold font-bold">تُقبل ملفات .js و .json</div>
                                                </div>
                                            </div>

                                            ${mergerLocal && html`
                                                <div key="merger-local-recognized" className="mt-6 p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/20 animate-bounce-subtle">
                                                    <div className="font-black text-brand-gold flex items-center gap-2">
                                                        <span>✨</span> ${lang === 'ar' ? 'تم التعرف على الملف المحلي' : 'تم التعرف على الملف المحلي'}
                                                    </div>
                                                </div>
                                            `}

                                            <div className="mt-8 flex gap-4">
                                                <${Luminova.Components.Button}
                                                    onClick=${handleExecuteMerge}
                                                    disabled=${!mergerBase || !mergerLocal}
                                                    variant="primary"
                                                    className="flex-1 py-4 rounded-2xl shadow-xl shadow-brand-DEFAULT/30 disabled:opacity-30 disabled:grayscale"
                                                    leadingIcon=${html`
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    `}
                                                >
                                                    <span>${lang === 'ar' ? 'بدء الدمج الذكي' : 'Start Smart Merge'}</span>
                                                </${Luminova.Components.Button}>
                                            </div>
                                        </${Luminova.Components.GlassCard}>

                                        ${mergerStatus.state === 'merged' && html`
                                            <${Luminova.Components.GlassCard} key="merger-success-card" className="p-6 border-brand-gold/30 bg-brand-gold/5 animate-slide-up">
                                                <h5 className="font-black text-brand-gold mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 inline-block mr-1 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                                    </svg>
                                                    ${lang === 'ar' ? 'نتائج الدمج' : 'Merge Results'}
                                                </h5>
                                                <p className="text-sm font-bold opacity-80 mb-6 leading-relaxed">${mergerStatus.msg}</p>
                                                <${Luminova.Components.Button}
                                                    onClick=${handleDownloadMerged}
                                                    variant="warning"
                                                    className="w-full py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_35px_rgba(251,191,36,0.5)] transition-all"
                                                    leadingIcon=${html`
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    `}
                                                >
                                                    <span>${lang === 'ar' ? 'تحميل الملف النهائي المدمج' : 'Download Merged File'}</span>
                                                </${Luminova.Components.Button}>
                                            </${Luminova.Components.GlassCard}>
                                        `}
                                    </div>
                                </div>

                                ${mergerStatus.state === 'error' && html`
                                    <div key="merger-error-alert" className="mt-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-center animate-shake">
                                        ❌ ${mergerStatus.msg}
                                    </div>
                                `}
                            </div>
                        ` : html`
                            <div key="table-list-container" className="p-2 sm:p-4 space-y-3">
                                    ${displayedTableItems.map(item => {
                                    const subject = data.subjects?.find(s => s.id === item.subjectId);
                                    const year = activeTab === 'semesters' ? data.years?.find(y => y.id === item.yearId) : null;
                                    const subjectSemester = activeTab === 'subjects' ? data.semesters?.find(s => s.id === item.semesterId) : null;
                                    const subjectYear = subjectSemester ? data.years?.find(y => y.id === subjectSemester.yearId) : null;
                                    const authorId = item.studentId || item.publisherId || item.senderId;
                                    const author = Luminova.getStudent(authorId, data.students);
                                    const categoryLabel = Luminova.i18n[lang][activeTab] || activeTab;

                                    return html`
                                    <div key=${item.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 backdrop-blur-lg bg-white/40 dark:bg-slate-800/50 rounded-2xl border border-white/20 dark:border-slate-700/50 hover:border-brand-DEFAULT/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300">
                                        <!-- Category Badge -->
                                        <div className="absolute -top-3 start-4 px-3 py-1 rounded-full bg-gradient-to-r from-brand-DEFAULT to-brand-hover text-white text-[10px] font-black uppercase tracking-wider shadow-lg z-10">
                                            ${categoryLabel}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-900/50 px-2 py-0.5 rounded-md">${item.id}</span>
                                                <span className="text-[10px] text-gray-400 font-semibold">${Luminova.formatDate(item.timestamp, lang)}</span>
                                            </div>
                                            
                                            <div className="font-black text-lg sm:text-xl text-gray-900 dark:text-white leading-tight mb-2">
                                                ${item.titleAr || item.nameAr || item.name || item.titleEn || item.nameEn || item.title || 'غير متاح'}
                                                ${item.isVIP && html`<span key="vip" className="ms-2 text-brand-DEFAULT animate-pulse">✨</span>`}
                                                ${item.isFeatured && html`<span key="featured" className="ms-2 text-brand-gold">📌</span>`}
                                                ${item.isVerified && html`<span key="verified" className="ms-2 text-blue-500">🔵✔️</span>`}
                                                ${item.role === 'doctor' && html`<span key="doctor" className="ms-2 text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-black">🎓</span>`}
                                            </div>
                                            ${activeTab === 'quizzes' && item.examMode === 'evaluation' && (() => {
                                                const controlExam = normalizeExamForControl(item, { settings: data.settings || {} });
                                                const badge = getSubmissionStatusBadge(controlExam.submissionStatus);
                                                return html`<div key="exam-delivery-status-badge" className=${`inline-flex px-3 py-1 rounded-full border text-xs font-black ${badge.cls}`}>${badge.label}</div>`;
                                            })()}

                                            ${activeTab === 'certificates' && html`
                                                <div key="cert-meta-details" className="flex flex-wrap items-center gap-3 mt-2 mb-1">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-bold text-gray-700 dark:text-gray-200">
                                                        <span className="opacity-60 text-lg">🎓</span>
                                                        <span>${lang === 'ar' ? 'الطالب:' : 'الطالب:'}</span>
                                                        <span className="text-brand-DEFAULT">${item.studentName || item.studentNameEn}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-bold">
                                                        <span className="opacity-60 text-lg">🏆</span>
                                                        <span className="text-gray-700 dark:text-gray-200">${lang === 'ar' ? 'الدرجة:' : 'Level:'}</span>
                                                        ${item.level === 'gold' ? html`<span key="level-gold" className="text-brand-gold drop-shadow-sm">ذهبية 🏅</span>` : item.level === 'silver' ? html`<span key="level-silver" className="text-gray-400 drop-shadow-sm">فضية 🥈</span>` : html`<span key="level-standard" className="text-gray-500 drop-shadow-sm">عادية 📜</span>`}
                                                    </div>
                                                </div>
                                            `}

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                ${subjectYear && subjectSemester && html`
                                                    <div key="sub-year-sem-badge" className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 text-brand-DEFAULT text-xs font-bold">
                                                        <span className="opacity-60">${lang === 'ar' ? 'الفرقة:' : 'Year:'}</span>
                                                        <span>${subjectYear.nameAr || subjectYear.name}</span>
                                                        <span className="opacity-30 mx-1">|</span>
                                                        <span className="opacity-60">${lang === 'ar' ? 'الترم:' : 'Semester:'}</span>
                                                        <span>${subjectSemester.nameAr || subjectSemester.name}</span>
                                                    </div>
                                                `}
                                                ${year && html`
                                                    <div key="year-badge" className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 text-brand-DEFAULT text-xs font-bold">
                                                        <span className="opacity-60">${lang === 'ar' ? 'الفرقة:' : 'Year:'}</span>
                                                        <span>${year.nameAr || year.name}</span>
                                                    </div>
                                                `}
                                                ${subject && html`
                                                    <div key="sub-badge" className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 text-brand-DEFAULT text-xs font-bold">
                                                        <span className="opacity-60">${lang === 'ar' ? 'المادة:' : 'Subject:'}</span>
                                                        <span>${subject.nameAr || subject.name}</span>
                                                    </div>
                                                `}
                                                ${author && author.id !== 'unknown' && html`
                                                    <div key="author-badge" className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold">
                                                        <span className="opacity-60">${lang === 'ar' ? 'الكاتب:' : 'الكاتب:'}</span>
                                                        <span>${author.nameAr || author.name}</span>
                                                    </div>
                                                `}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 justify-end mt-4 sm:mt-0">
                                            ${activeTab === 'quizzes' && html`
                                                <${Luminova.Components.Button}
                                                    key="manage-questions"
                                                    onClick=${() => { setEditingItem({ ...item }); setSubView('questionsList'); }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2 rounded-xl"
                                                >
                                                    <span>${lang === 'ar' ? 'إدارة الأسئلة' : 'Manage Questions'}</span>
                                                    <span className="bg-indigo-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">${(item.questions || []).length}</span>
                                                </${Luminova.Components.Button}>
                                            `}
                                            <${Luminova.Components.Button} key="edit-btn" variant="outline" size="sm" onClick=${() => setEditingItem({ ...item })} className="p-3" title="Edit"><${Luminova.Icons.Edit} /></${Luminova.Components.Button}>
                                            <${Luminova.Components.Button} key="delete-btn" variant="danger" size="sm" onClick=${() => handleDelete(activeTab, item.id)} className="p-3" title="Delete"><${Luminova.Icons.Trash} /></${Luminova.Components.Button}>
                                        </div>
                                    </div>
                                    `})}
                                ${activeTableItems.length === 0 && html`
                                    <div key="empty-state-container" className="p-12 sm:p-20 text-center font-bold text-xl sm:text-2xl opacity-30 border-2 border-dashed rounded-3xl">${Luminova.i18n[lang].emptyState}</div>
                                `}
                            </div>
                            
                            ${(!editingItem && cmsVisibleCount < activeTableItems.length) && html`
                                <div key="show-more-btn-container" className="flex justify-center pt-6 pb-2">
                                    <${Luminova.Components.Button}
                                        variant="secondary"
                                        size="md"
                                        onClick=${() => setCmsVisibleCount(prev => prev + 5)}
                                        className="py-2.5 px-8"
                                    >
                                        <span>${lang === 'ar' ? 'عرض المزيد' : 'Show More'}</span>
                                    </${Luminova.Components.Button}>
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
    // تطبيق لوحة الإدارة
    // ==========================================

    const CMSApp = () => {
        const lang = 'ar';
        const [loginState, setLoginState] = useState({ loggedIn: false, role: null });
        const [authError, setAuthError] = useState('');

        // We fetch data immediately
        const [dataReady, setDataReady] = useState(false);
        const [loadingMsg, setLoadingMsg] = useState('جاري تهيئة التطبيق... برجاء الانتظار');
        const [data, setData] = useState(null);

        // الحالات المضافة للمزامنة والتعديلات المحلية
        const [sourceStatuses, setSourceStatuses] = useState({
            data: null,
            exams: null,
            certs: null
        });

        const [isDirty, setIsDirty] = useState({
            data: false,
            exams: false,
            certs: false
        });

        const loadAndValidateRemoteExams = async () => {
            const schema = FILE_SCHEMAS.exams;
            const result = await fetchGithubSource({ key: 'exams', label: 'ملف الاختبارات', url: schema.url });
            result.ok = result.status === 'SUCCESS';
            return result;
        };

        const reloadRemoteSource = async (key) => {
            const schema = FILE_SCHEMAS[key];
            if (!schema) return;

            setSourceStatuses(prev => ({
                ...prev,
                [key]: { ...prev[key], status: 'LOADING' }
            }));

            const label = key === 'data' ? 'البيانات' : key === 'exams' ? 'الاختبارات' : 'الشهادات';
            let result;
            if (key === 'exams') {
                result = await loadAndValidateRemoteExams();
            } else {
                result = await fetchGithubSource({ key, label, url: schema.url });
                result.ok = result.status === 'SUCCESS';
            }

            if (result.ok) {
                const prevHash = sourceStatuses[key]?.hash;
                if (sourceStatuses[key] !== null) {
                    if (prevHash && prevHash !== result.hash) {
                        alert('تم العثور على تحديث جديد وتحميله.');
                    } else if (prevHash && prevHash === result.hash) {
                        alert('أنت تستخدم أحدث نسخة بالفعل.');
                    } else {
                        alert(`تم تحميل أحدث نسخة من ملف ${label} بنجاح.`);
                    }
                }

                // Update global data variables and React state
                assignLuminovaPayload(key, result.data);
                setData(prev => {
                    const nextData = { ...prev };
                    if (key === 'data') {
                        Object.keys(result.data).forEach(field => {
                            if (field !== 'quizzes' && field !== 'certificates') {
                                nextData[field] = result.data[field];
                            }
                        });
                    } else if (key === 'exams') {
                        nextData.quizzes = result.data || [];
                        window.LUMINOVA_EXAMS = result.data || [];
                    } else if (key === 'certs') {
                        nextData.certificates = result.data || [];
                        window.LUMINOVA_CERTIFICATES = result.data || [];
                    }
                    return nextData;
                });

                // Clear dirty flag upon successful reload
                setIsDirty(prev => ({ ...prev, [key]: false }));
            } else {
                alert(`فشل التحميل من GitHub:\n${result.msg}`);
            }

            setSourceStatuses(prev => ({
                ...prev,
                [key]: result
            }));

            return result;
        };

        useEffect(() => {
            const fetchInitialData = async () => {
                setLoadingMsg('جاري تحميل البيانات من GitHub... برجاء الانتظار');
                try {
                    // Fetch all three sources in parallel via the unified loader
                    const [dataRes, examsRes, certsRes] = await Promise.all([
                        fetchGithubSource({ key: 'data', label: 'البيانات', url: DATA_URL }),
                        loadAndValidateRemoteExams(),
                        fetchGithubSource({ key: 'certs', label: 'الشهادات', url: CERTS_URL })
                    ]);

                    dataRes.ok = dataRes.status === 'SUCCESS';
                    examsRes.ok = examsRes.status === 'SUCCESS';
                    certsRes.ok = certsRes.status === 'SUCCESS';

                    setSourceStatuses({
                        data: dataRes,
                        exams: examsRes,
                        certs: certsRes
                    });

                    // Check if data.js loaded successfully
                    if (!dataRes.ok) {
                        setLoadingMsg(`خطأ حرج: فشل تحميل ملف البيانات الأساسية (data.js) من GitHub.\nالسبب: ${dataRes.msg}`);
                        return;
                    }

                    // For exams and certs, if they failed we load empty arrays instead of silent fallbacks
                    const finalExams = examsRes.ok ? examsRes.data : [];
                    const finalCerts = certsRes.ok ? certsRes.data : [];

                    // Assign variables to window for legacy code compatibility
                    window.LUMINOVA_DATA = dataRes.data;
                    window.LUMINOVA_EXAMS = finalExams;
                    window.LUMINOVA_CERTIFICATES = finalCerts;

                    setData({
                        ...dataRes.data,
                        quizzes: finalExams,
                        certificates: finalCerts
                    });
                    setDataReady(true);
                    setLoadingMsg('');

                } catch (e) {
                    setLoadingMsg('خطأ حرج أثناء تحميل البيانات: ' + e.message);
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
                setAuthError('بيانات الدخول غير صحيحة');
            }
        };

        if (loadingMsg) {
            return html`
            <div key="loading-screen" className="min-h-screen flex items-center justify-center flex-col gap-6 bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.1),transparent_50%)]"></div>
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-DEFAULT/30 border-t-brand-DEFAULT rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-brand-gold/50 rounded-full animate-spin" style=${{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="font-bold text-lg text-gray-700 dark:text-gray-300 tracking-wide">${loadingMsg}</p>
            </div>
        `;
        }

        if (!loginState.loggedIn) {
            return html`
            <div key="login-screen" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white relative overflow-hidden px-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.2),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.12),transparent_50%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-DEFAULT/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-gold/5 rounded-full blur-3xl animate-pulse" style=${{ animationDelay: '1s' }}></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/40 p-8 sm:p-10">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-DEFAULT to-brand-gold flex items-center justify-center shadow-lg shadow-brand-DEFAULT/30">
                                <span className="text-3xl font-black text-gray-900 dark:text-white drop-shadow-md">L</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">لوحة إدارة لومينوفا</h1>
                            <div className="w-16 h-1 mx-auto mt-3 bg-gradient-to-r from-brand-DEFAULT to-brand-gold rounded-full"></div>
                        </div>
                        <form onSubmit=${handleLogin} className="space-y-5">
                            <div className="relative">
                                <span className="absolute inset-y-0 start-4 flex items-center text-gray-500 pointer-events-none">👤</span>
                                <input name="username" type="text" placeholder="اسم المستخدم" className="w-full ps-12 pe-4 py-4 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] outline-none focus:border-brand-DEFAULT/60 focus:bg-white focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold transition-all text-gray-900 dark:text-white placeholder:text-gray-500" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 start-4 flex items-center text-gray-500 pointer-events-none">🔑</span>
                                <input name="password" type="password" placeholder="كلمة المرور" className="w-full ps-12 pe-4 py-4 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.08] outline-none focus:border-brand-DEFAULT/60 focus:bg-white focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold transition-all text-gray-900 dark:text-white placeholder:text-gray-500" required />
                            </div>
                            ${authError && html`<div className="text-red-400 font-bold text-center text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">${authError}</div>`}
                            <${Luminova.Components.Button}
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full py-4 rounded-xl shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2 text-lg">
                                    <span>${lang === 'ar' ? 'دخول آمن' : 'Secure Login'}</span>
                                </span>
                            </${Luminova.Components.Button}>
                        </form>
                    </div>
                    <p className="text-center text-gray-600 text-xs mt-6 font-bold tracking-widest">منصة لومينوفا التعليمية</p>
                </div>
            </div>
        `;
        }

        // Render the AdminCMS component
        return html`
        <div key="admin-cms-main" className="min-h-screen relative bg-slate-50 dark:bg-slate-950">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.04),transparent_50%)] pointer-events-none z-0"></div>
            ${loginState.role === 'editor' && html`
                <div key="editor-mode-badge" className="fixed bottom-4 start-4 z-50 flex items-center gap-2 bg-amber-500/90 backdrop-blur-xl text-black px-4 py-2 rounded-full shadow-lg shadow-amber-500/20 font-black text-xs sm:text-sm cursor-default group" title="وضع الإضافة فقط: يمكنك إضافة عناصر جديدة فقط، والبيانات الحالية مخفية.">
                    <span className="text-lg">👁️‍🗨️</span>
                    <span className="hidden sm:inline">وضع المحرر</span>
                    <span className="w-2 h-2 bg-black/30 rounded-full animate-pulse"></span>
                </div>
            `}
            <div className="relative z-10">
                <${Luminova.Pages.AdminCMS} data=${data} setData=${setData} lang="ar" goBack=${() => setLoginState({ loggedIn: false, role: null })} sourceStatuses=${sourceStatuses} setSourceStatuses=${setSourceStatuses} isDirty=${isDirty} setIsDirty=${setIsDirty} reloadRemoteSource=${reloadRemoteSource} />
            </div>
        </div>
    `;
    };

    const root = window.ReactDOM.createRoot(document.getElementById('cms-root'));
    root.render(html`<${CMSApp} />`);
})();

