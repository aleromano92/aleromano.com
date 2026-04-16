---
description: "Update the NOW section of the about page. Use when it's time to refresh what Alessandro is up to."
allowed-tools:
  - Read
  - Edit
  - AskUserQuestion
---

# Update NOW Section

Guide Alessandro through updating the NOW section in `src/components/pages/BaseAbout.astro`.

The NOW section tracks what Alessandro is currently learning, reading, working on, and doing personally. It lives in the `aboutTranslations` object for both `en` and `it`.

## Step 1: Read the current state

Read `src/components/pages/BaseAbout.astro`. Extract and display:
- The current `nowSubtitle` (EN)
- The current `nowLearning`, `nowReading`, `nowSideProjects`, `nowPersonal` arrays (EN)

## Step 2: Determine the quarter being archived

Ask Alessandro: "Which quarter are we archiving? (e.g., Q1 2026)"

## Step 3: Categorize old entries for history

For each category (Learning, Reading, Side Projects, Personal), show each current EN entry and ask Alessandro to classify it as:
- `completed` — finished it
- `ongoing` — still doing it (will carry forward)
- `dropped` — stopped, didn't finish

Also ask for an optional comment (e.g., "Got a 4.8/5 rating!"). Keep HTML links as-is.

## Step 4: Collect new entries (English)

Ask Alessandro for the new entries for each category in English. Items can include HTML links like `<a href="..." target="_blank" rel="noopener noreferrer">text</a>`.

Ask for each category separately:
- 📚 Learning
- 📖 Reading
- 💻 Side Projects
- 🏠 Personal

## Step 5: Collect Italian translations

For entries that are not book/game titles (which stay the same) or proper nouns, ask for Italian translations of:
- New entries that need translation (skip titles, names, and items already in Italian)
- Comments on the archived history entries

Entries marked `ongoing` will appear in both the new section and history — just carry the EN text forward and note you'll use the same IT text already in the file.

## Step 6: Update `nowSubtitle`

Ask: "What month and year should the subtitle say? (e.g., April 2026 / Aprile 2026)"

## Step 7: Write the changes

Edit `src/components/pages/BaseAbout.astro`:

1. **Archive old quarter to `nowHistory`**: Prepend a new `NowHistoryQuarter` object to the `nowHistory` array (for both `en` and `it`). Format:
   ```ts
   {
     quarter: 'Q1 2026',
     learning: [
       { text: '...', status: 'completed', comment: '...' },
       { text: '...', status: 'ongoing' },
     ],
     reading: [...],
     sideProjects: [...],
     personal: [...],
   }
   ```
   Omit `comment` when there is none.

2. **Replace current NOW entries**: Update `nowLearning`, `nowReading`, `nowSideProjects`, `nowPersonal` for both `en` and `it`.

3. **Update subtitles**: Set `nowSubtitle` (EN) and `nowSubtitle` (IT) with the new month/year.

## Rules

- Never use em dashes (—) in text content; use parentheses or colons instead
- Keep HTML anchor tags exactly as provided
- `nowHistory` is an array — prepend the new quarter at index 0 so most recent appears first
- For the `it` history: if an item has `status: 'ongoing'` and the Italian text is already in the current `it.nowLearning` (etc.), carry it forward. If it's a new IT entry for a `completed` or `dropped` item that wasn't in IT, ask for the translation
- Book/manga/game titles don't need translation (same in both languages)
