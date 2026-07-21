/**
 * Contact form logic, kept free of DOM access so it can be unit tested.
 * BaseContact.astro binds these functions to the actual elements.
 */

export const MESSAGE_REASONS = ['consultancy', 'mentoring', 'job', 'blogpost', 'general'] as const;
export const VALID_REASONS = [...MESSAGE_REASONS, 'problems'] as const;

export type ContactReason = (typeof VALID_REASONS)[number];

export interface ReasonView {
    /** 'problems' routes to GitHub instead: the message form would be pure noise */
    showForm: boolean;
    /** Fields stay dimmed/disabled until a reason that needs a message is picked */
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

/**
 * Turns plain text into HTML where bare URLs become safe external links.
 * The text is escaped first, so markup in it can never be injected.
 */
export function linkifyUrls(text: string): string {
    return escapeHtml(text).replace(
        /https?:\/\/[^\s)]+/g,
        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
}

/**
 * A preserved-but-hidden blog post title must not leak into unrelated
 * submissions: the API would put it in the email subject.
 */
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

/**
 * Reads ?reason=...&title=... used by deep links (e.g. from blog posts).
 * URLSearchParams already decodes values: decoding again would throw on
 * titles containing a literal '%'.
 */
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
    /** Machine-readable error code from the API, when it sent one */
    code?: string;
}

/**
 * The API answers Human Mistakes with a machine-readable code; the client owns
 * the localized wording. Unknown codes fall back to the server message.
 */
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

/** The API refuses tokens younger than 3s; wait a hair longer before retrying. */
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

/**
 * Submits with the given Form Token. A deploy rotates the server's signing
 * secret, invalidating tokens already handed out — on that rejection, fetch a
 * fresh token, wait out the minimum token age, and retry once, invisibly.
 */
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
