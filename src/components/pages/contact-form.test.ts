import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
    MESSAGE_REASONS,
    getReasonView,
    linkifyUrls,
    buildSubmissionPayload,
    parseReasonPreselection,
    submitContactForm,
} from './contact-form';

describe('getReasonView', () => {
    it('shows the form dimmed when no reason is selected yet', () => {
        expect(getReasonView('')).toEqual({
            showForm: true,
            enableForm: false,
            showGithubIssue: false,
            showBlogPostTitle: false,
        });
    });

    it.each(MESSAGE_REASONS)('enables the form for "%s"', (reason) => {
        const view = getReasonView(reason);
        expect(view.showForm).toBe(true);
        expect(view.enableForm).toBe(true);
        expect(view.showGithubIssue).toBe(false);
    });

    it('hides the form entirely and routes to GitHub for "problems"', () => {
        expect(getReasonView('problems')).toEqual({
            showForm: false,
            enableForm: false,
            showGithubIssue: true,
            showBlogPostTitle: false,
        });
    });

    it('reveals the blog post title field only for "blogpost"', () => {
        expect(getReasonView('blogpost').showBlogPostTitle).toBe(true);
        expect(getReasonView('general').showBlogPostTitle).toBe(false);
    });

    it('keeps the form disabled for unknown reasons', () => {
        const view = getReasonView('not-a-real-reason');
        expect(view.enableForm).toBe(false);
        expect(view.showForm).toBe(true);
    });
});

describe('linkifyUrls', () => {
    it('turns bare URLs into safe external links', () => {
        expect(linkifyUrls('See https://example.com/profile for details')).toBe(
            'See <a href="https://example.com/profile" target="_blank" rel="noopener noreferrer">https://example.com/profile</a> for details'
        );
    });

    it('leaves text without URLs untouched', () => {
        expect(linkifyUrls('Just tell me why.')).toBe('Just tell me why.');
    });

    it('does not swallow a closing parenthesis wrapping the URL', () => {
        const html = linkifyUrls('my profile (https://example.com/p).');
        expect(html).toContain('href="https://example.com/p"');
        expect(html).toContain('</a>).');
    });

    it('escapes HTML so translations can never inject markup', () => {
        expect(linkifyUrls('<script>alert("x")</script> & <b>bold</b>')).toBe(
            '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &lt;b&gt;bold&lt;/b&gt;'
        );
    });
});

describe('buildSubmissionPayload', () => {
    it('drops a stale blog post title from non-blogpost submissions', () => {
        const payload = buildSubmissionPayload({
            reason: 'general',
            name: 'Ada',
            email: 'ada@example.com',
            message: 'Hi',
            blogPostTitle: 'Left over from a previous selection',
        });
        expect(payload).not.toHaveProperty('blogPostTitle');
    });

    it('keeps the blog post title for blogpost submissions', () => {
        const payload = buildSubmissionPayload({
            reason: 'blogpost',
            blogPostTitle: 'My Great Post',
        });
        expect(payload.blogPostTitle).toBe('My Great Post');
    });

    it('does not mutate the original form data', () => {
        const formData = { reason: 'general', blogPostTitle: 'stale' };
        buildSubmissionPayload(formData);
        expect(formData.blogPostTitle).toBe('stale');
    });
});

describe('parseReasonPreselection', () => {
    it('accepts every valid reason', () => {
        expect(parseReasonPreselection('?reason=consultancy')).toEqual({
            reason: 'consultancy',
            blogPostTitle: null,
        });
        expect(parseReasonPreselection('?reason=problems')?.reason).toBe('problems');
    });

    it('rejects unknown reasons so a crafted URL cannot break the form', () => {
        expect(parseReasonPreselection('?reason=<script>')).toBeNull();
        expect(parseReasonPreselection('?reason=unknown')).toBeNull();
        expect(parseReasonPreselection('')).toBeNull();
    });

    it('carries the title only for blogpost deep links', () => {
        expect(parseReasonPreselection('?reason=blogpost&title=My%20Great%20Post')).toEqual({
            reason: 'blogpost',
            blogPostTitle: 'My Great Post',
        });
        expect(parseReasonPreselection('?reason=general&title=ignored')?.blogPostTitle).toBeNull();
    });

    it('survives titles containing a literal percent sign', () => {
        // double-decoding would throw URIError here
        expect(parseReasonPreselection('?reason=blogpost&title=100%25%20CSS')?.blogPostTitle).toBe('100% CSS');
    });
});

describe('submitContactForm', () => {
    const messages = {
        success: 'fallback success',
        error: 'fallback error',
        networkError: 'network down',
    };
    const endpoint = 'http://localhost/api/contact';
    const payload = { reason: 'general', name: 'Ada', email: 'ada@example.com', message: 'Hi' };

    it('reports success with the server message when available', async () => {
        server.use(
            http.post(endpoint, () => HttpResponse.json({ success: true, message: 'Thanks Ada!' }))
        );
        expect(await submitContactForm(payload, messages, endpoint)).toEqual({
            success: true,
            message: 'Thanks Ada!',
        });
    });

    it('falls back to the translated success message when the server sends none', async () => {
        server.use(http.post(endpoint, () => HttpResponse.json({ success: true })));
        expect(await submitContactForm(payload, messages, endpoint)).toEqual({
            success: true,
            message: 'fallback success',
        });
    });

    it('reports failure on an error response', async () => {
        server.use(
            http.post(endpoint, () =>
                HttpResponse.json({ success: false, message: 'Rate limited' }, { status: 429 })
            )
        );
        expect(await submitContactForm(payload, messages, endpoint)).toEqual({
            success: false,
            message: 'Rate limited',
        });
    });

    it('treats a 200 without success flag as failure', async () => {
        server.use(http.post(endpoint, () => HttpResponse.json({})));
        expect(await submitContactForm(payload, messages, endpoint)).toEqual({
            success: false,
            message: 'fallback error',
        });
    });

    it('reports the network error message when the request cannot complete', async () => {
        server.use(http.post(endpoint, () => HttpResponse.error()));
        expect(await submitContactForm(payload, messages, endpoint)).toEqual({
            success: false,
            message: 'network down',
        });
    });
});
