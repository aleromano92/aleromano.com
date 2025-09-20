Feature: Revamp About Page with Detailed Work Experience and NOW Section
1. Feature Overview
Problem Statement: The current About page is too similar to the Home page, with redundant content that doesn't provide enough value to visitors seeking deeper information about Alessandro's professional background and current activities.

User Goal: Visitors should be able to learn detailed information about Alessandro's work experience, download his CV, and understand what he's currently focused on through a dynamic "NOW" section.

Business Value: A more comprehensive About page will improve professional credibility, provide better context for potential collaborators/employers, and create a more engaging user experience that encourages return visits.

2. User Story
As a potential collaborator, employer, or fellow professional
I want to access detailed information about Alessandro's work experience and current activities
So that I can better understand his background, skills, and current focus areas for potential collaboration or hiring opportunities

3. Technical Context
Affected Systems:

- About page components (about.astro, about.astro, BaseAbout.astro)
- i18n translation system for bilingual content
- SEO component for structured data (@Person schema)
- CSS styling for new sections and responsive design

Constraints:

- Must maintain bilingual support (English/Italian)
- No external CV hosting services - implement download functionality from static assets
- Build from scratch following existing component patterns
- Maintain responsive design and accessibility standards

Architecture Dependencies:

- Leverage existing translation pattern from BaseAbout.astro
- Use Astro's build to emit a CV PDF file based on the Work Experience section of the new About page and leverage static asset handling for CV download
- Follow existing component structure and CSS custom properties

4. Acceptance Criteria
Core Functionality:

 - A beginning section like Index of COntent for people to quickly jump to my bigropahy, work experience or now sections
 - Little biography section with personal things like how I was addicted to tech as a Kid with RPG maker and how Pokemon Yellow was my first english teacher as italian copies were out of stock
 - Detailed work experience section with previous positions, responsibilities, and achievements
 - CV download button linking to a PDF stored in public assets. THe PDF is created at each new build based on the Work Experience section of the revamped About page
 - "NOW" section displaying current activities, studies, projects, and interests
 - Collapsible sections in NOW area for storing historical "what I was doing" entries
 - Retained Twitter feed section from current implementation

Technical Requirements:

 - TypeScript strict typing for all new interfaces and props
 - Responsive design that works on mobile and desktop
 - Light/dark theme support for all new components
 - i18n support with separate English/Italian content
 - Accessibility compliance (ARIA labels, semantic HTML, keyboard navigation)
 - @Person structured data implementation for SEO

5. Implementation Approach
Preferred Method: Incremental development with clear phases for validation

Phase Breakdown:

Phase 1: Update translation interfaces and add biography, work experience content by reading LinkedIn profile https://www.linkedin.com/in/alessandroromano92/ and now section
Phase 2: Implement CV download functionality allowing to build the PDF based on the work experience section with static asset handling
Phase 3: Create NOW section with collapsible functionality
Phase 4: Add @Person structured data markup
Phase 5: Styling refinements and responsive design testing

Validation Points:

After Phase 1: Review  content structure and translations
After Phase 2: Test CV download functionality across browsers
After Phase 3: Validate NOW section UX and collapsible behavior
After Phase 5: Final design and accessibility review

Technical Design:

- Extend existing AboutTranslations interface with new content fields
- Create reusable collapsible component for NOW section
- Use Astro's static asset imports for CV file handling
- Implement JSON-LD structured data in page head

6. Testing Strategy
Business Logic:

- Translation key resolution and fallbacks
- CV file existence and download URL generation
- Collapsible state management

7. Examples & References
Similar Features:

- Existing translation pattern in BaseAbout.astro and BaseIndex.astro
- Collapsible patterns can reference common accordion/details patterns

External Inspiration:

- "NOW" page concept inspired by Derek Sivers' nownownow.com movement
- Professional portfolio sites with downloadable CV functionality
- Timeline/experience sections from personal websites

Design Mockups:

Maintain current intro section layout but with differentiated content
Work experience as timeline or card-based layout
NOW section as prominent, regularly-updated area above Twitter feed

8. Change Impact Assessment
Files to Modify:

- BaseAbout.astro (major rewrite)
- Translation interfaces and content
- Add CV file to public directory after building it
- Potential new components for biography, work experience and NOW sections

Breaking Changes:

- About page content will be significantly different
- May need to update internal links or references to About page content
- SEO descriptions will change

Documentation Updates:

- Update README if CV management process is added
- Document the NOW section update schedule (quarterly)

9. Questions for Clarification
Technical Decisions:

Should work experience be hardcoded in translations or managed as a separate content collection? It should be hardcoded.
Preferred format for CV file (PDF only, or multiple formats)? PDF only
Should NOW section updates be tracked in git history or just replaced? Tracked in git history

Scope Boundaries:

Included: Static biography, Static work experience, CV download, NOW section, structured data
Excluded:  NOW section admin interface, work experience as CMS
