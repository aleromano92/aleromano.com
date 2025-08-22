# Feature: Blog Post Presentation Mode

## 1. Feature Overview
**Problem Statement**: Currently limited to traditional presentation tools (Google Slides, PowerPoint) when speaking at conferences, which disconnects the content from the blog and requires duplicate work.
**User Goal**: Transform existing blog posts into interactive, slides-like presentations directly embedded in the website.
**Business Value**: Enables more speaking opportunities, showcases technical expertise, and creates a unique differentiator for the personal brand.

## 2. User Story
**As a** conference speaker and blog author
**I want** to present my blog posts as interactive slides within my website
**So that** I can deliver talks without external tools while maintaining content consistency and showcasing my technical abilities.

## 3. Technical Context
**Affected Systems**: Blog post layout (`BlogPostLayout.astro`), content collections (new presentation metadata), routing (presentation mode URLs), SSR rendering
**Integration Points**: Existing blog post rendering, markdown processing, navigation components, theme system
**Constraints**: Self-hosted solution, no external SaaS, must support existing i18n structure
**Architecture Dependencies**: Content collections schema, `src/utils/posts.ts`, markdown processing pipeline, theme CSS variables

## 4. Acceptance Criteria
**Core Functionality**:
- [ ] Button appears on blog posts when presentation content exists
- [ ] Presentation mode renders slides with navigation (prev/next/jump to slide)
- [ ] Slides support markdown content with proper styling
- [ ] Presentation mode maintains theme consistency (light/dark)
- [ ] Keyboard navigation (arrow keys, ESC to exit)

**Technical Requirements**:
- [ ] TypeScript strict typing for presentation schema
- [ ] Responsive design (works on presentation displays)
- [ ] Light/dark theme support in presentation mode
- [ ] i18n support (English/Italian presentations)
- [ ] Accessibility compliance (screen readers, keyboard navigation)

**Quality Gates**:
- [ ] Presentation parser has automated tests
- [ ] Slide navigation logic has automated tests
- [ ] Error handling for malformed presentation files
- [ ] Performance: smooth transitions, lazy loading of slides

## 5. Implementation Approach
**Preferred Method**: Incremental development in 3 phases
**Phase Breakdown**:
1. **Phase 1**: Content schema + presentation button detection
2. **Phase 2**: Basic slide rendering + navigation
3. **Phase 3**: Advanced features (transitions, keyboard shortcuts, full-screen)

**Validation Points**: After each phase completion
**Technical Design**: 
- Create `src/content/presentations/` collection for separate presentation files
- File naming convention: `{blog-post-slug}.md` (e.g., `3-career-tips.md`)
- Use `---` delimiters to split markdown into individual slides
- Integrate reveal.js library with custom theme matching website design
- Build presentation detection utility in `src/utils/presentations.ts`
- Create presentation route: `/posts/[...slug]/present` for full-screen mode

## 6. Testing Strategy
**Business Logic**: 
- Presentation file parsing logic
- Slide navigation state management
- Content validation (ensure slides have required fields)
**Integration Points**: 
- Blog post -> presentation mode transition
- Theme switching within presentation mode
**Manual Testing**: 
- Keyboard navigation in different browsers
- Presentation on external displays
- Mobile/tablet presentation mode

## 7. Examples & References
**Similar Features**: 
- slides.com for UX inspiration
- reveal.js for technical implementation patterns
- Your existing `BlogPostLayout.astro` for integration pattern
**External Inspiration**: 
- [reveal.js](https://revealjs.com/) for slide mechanics
- [slides.com](https://slides.com/) for UX flow
**Design Mockups**: Reference existing blog post with tags section for button placement

## 8. Change Impact Assessment
**Files to Modify**:
- `src/content/config.ts` (add presentation schema)
- `src/layouts/BlogPostLayout.astro` (add presentation button)
- `src/components/PresentationMode.astro` (new component)
- `src/pages/posts/[...slug]/present.astro` (new route)
- New presentation markdown files in `src/content/presentations/`

**Breaking Changes**: None (purely additive feature)
**Documentation Updates**: 
- README section on creating presentations
- Content authoring guide for presentation format

## 9. Questions for Clarification
**Technical Decisions**: 
- ✅ **Presentations as separate files**: Create dedicated `.md` files in `src/content/presentations/` that correspond to blog posts
- ✅ **Slide delimiter**: Use `---` to separate slides (standard markdown convention)
- ✅ **Use reveal.js**: Integrate reveal.js library for robust slide functionality and animations

**Implementation Details**:
- File naming: `src/content/presentations/3-career-tips.md` → links to blog post with same slug
- Detection logic: Check if presentation file exists when rendering blog post
- reveal.js integration: Install as npm dependency, customize theme to match website styling

**Scope Boundaries**: 
- Included: Basic slides, navigation, theming, reveal.js integration
- Excluded: Advanced animations, video embedding, presenter notes (future iterations)

**Future Considerations**: 
- Presenter notes view
- Remote control via mobile device
- Export to PDF functionality
- Analytics on presentation views