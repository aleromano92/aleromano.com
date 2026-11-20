export const MESSAGE_REASONS = ['consultancy', 'mentoring', 'job', 'blogpost', 'general'] as const;
export const VALID_REASONS = [...MESSAGE_REASONS, 'problems'] as const;

export type ContactReason = (typeof VALID_REASONS)[number];

export interface ReasonView {
    showForm: boolean;
    enableForm: boolean;
    showGithubIssue: boolean;
    showBlogPostTitle: boolean;
}

export function getReasonView(reason: string): ReasonView {
    return {
        showForm: reason !== 'problems',
        enableForm: (MESSAGE_REASONS as readonly string[]).includes(reason),
        showGithubIssue: reason === 'problems',
        showBlogPostTitle: reason === 'blogpost',
    };
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function linkifyUrls(text: string): string {
    return escapeHtml(text).replace(
        /https?:\/\/[^\s)]+/g,
        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
}

export function buildSubmissionPayload(
    formData: Record<string, FormDataEntryValue>
): Record<string, FormDataEntryValue> {
    const payload = { ...formData };
    if (payload.reason !== 'blogpost') {
        delete payload.blogPostTitle;
    }
    return payload;
}

export interface ReasonPreselection {
    reason: ContactReason;
    blogPostTitle: string | null;
}

export function parseReasonPreselection(search: string): ReasonPreselection | null {
    const params = new URLSearchParams(search);
    const reason = params.get('reason');

    if (!reason || !(VALID_REASONS as readonly string[]).includes(reason)) {
        return null;
    }

    return {
        reason: reason as ContactReason,
        blogPostTitle: reason === 'blogpost' ? params.get('title') : null,
    };
}

export interface SubmitMessages {
    success: string;
    error: string;
    networkError: string;
    emailSyntax: string;
    emailDomain: string;
}

export interface SubmitOutcome {
    success: boolean;
    message: string;
    code?: string;
}

function failureMessage(code: unknown, serverMessage: unknown, messages: SubmitMessages): string {
    if (code === 'email-syntax') return messages.emailSyntax;
    if (code === 'email-domain') return messages.emailDomain;
    return typeof serverMessage === 'string' && serverMessage ? serverMessage : messages.error;
}

export async function submitContactForm(
    payload: Record<string, FormDataEntryValue>,
    messages: SubmitMessages,
    endpoint = '/api/contact'
): Promise<SubmitOutcome> {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return { success: true, message: result.message || messages.success };
        }
        return {
            success: false,
            message: failureMessage(result.code, result.message, messages),
            ...(typeof result.code === 'string' ? { code: result.code } : {}),
        };
    } catch {
        return { success: false, message: messages.networkError };
    }
}

export const TOKEN_ENDPOINT = '/api/contact-token';

export const TOKEN_RETRY_WAIT_MS = 3_500;

export async function fetchContactToken(endpoint = TOKEN_ENDPOINT): Promise<string | null> {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) return null;
        const result = await response.json();
        return typeof result.token === 'string' ? result.token : null;
    } catch {
        return null;
    }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface TokenRecoveryDeps {
    fetchToken?: () => Promise<string | null>;
    wait?: (ms: number) => Promise<void>;
    endpoint?: string;
}

export async function submitWithTokenRecovery(
    payload: Record<string, FormDataEntryValue>,
    token: string | null,
    messages: SubmitMessages,
    deps: TokenRecoveryDeps = {}
): Promise<SubmitOutcome> {
    const { fetchToken = fetchContactToken, wait = sleep, endpoint } = deps;

    const outcome = await submitContactForm({ ...payload, token: token ?? '' }, messages, endpoint);
    if (outcome.success || outcome.code !== 'invalid-token') return outcome;

    const freshToken = await fetchToken();
    if (!freshToken) return outcome;

    await wait(TOKEN_RETRY_WAIT_MS);
    return submitContactForm({ ...payload, token: freshToken }, messages, endpoint);
}
