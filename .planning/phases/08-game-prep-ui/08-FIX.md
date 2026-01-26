---
phase: 08-game-prep-ui
plan: 08-FIX
type: fix
wave: 1
depends_on: []
files_modified: [musicbingo_host/src/pages/HostView.jsx, musicbingo_host/src/pages/HostView.css]
autonomous: true
---

<objective>
Fix 1 UAT issue from Phase 8 testing.

Source: 08-ISSUES.md
Priority: 0 critical, 0 major, 1 minor
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/08-game-prep-ui/08-ISSUES.md

**Original files for reference:**
@musicbingo_host/src/pages/HostView.jsx
@musicbingo_host/src/pages/HostView.css
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add Prep navigation link to Host View header</name>
  <files>musicbingo_host/src/pages/HostView.jsx, musicbingo_host/src/pages/HostView.css</files>
  <action>
Add a "Prep" navigation link to the Host View header that navigates to /prep.

Implementation:
1. In HostView.jsx:
   - Import Link from react-router-dom
   - Add a "Prep" link in the header-left section after the h1 title
   - Style it as a subtle navigation link (not a prominent button)

2. In HostView.css:
   - Add styling for the prep link to match the header aesthetic
   - Use muted colors that don't compete with the main controls
   - Add hover state for interactivity

The link should be visible but not prominent - this is a preparation tool, not a primary game control.
  </action>
  <verify>
1. npm start (if not running)
2. Navigate to localhost:3000
3. Verify "Prep" link visible in header
4. Click link - should navigate to /prep page
5. Build succeeds: npm run build
  </verify>
  <done>
- Prep link visible in Host View header
- Clicking link navigates to /prep route
- Styling consistent with header design
- Build passes
  </done>
</task>
</tasks>

<verification>
Before declaring plan complete:
- [ ] Prep link visible in Host View header
- [ ] Link navigates to /prep route
- [ ] Styling is subtle and consistent
- [ ] Build passes without errors
- [ ] UAT-001 acceptance criteria met
</verification>

<success_criteria>
- UAT-001 from 08-ISSUES.md addressed
- Navigation to Prep page available from Host View
- Ready for re-verification
</success_criteria>

<output>
After completion, create `.planning/phases/08-game-prep-ui/08-FIX-SUMMARY.md`
</output>
