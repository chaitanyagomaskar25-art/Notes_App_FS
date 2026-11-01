export const noteTemplates = [
  {
    id: "blank",
    name: "Blank Note",
    title: "",
    content: "",
    category: "General",
    tags: [],
  },
  {
    id: "meeting",
    name: "Meeting Notes",
    title: "Meeting Notes",
    content: `# Meeting Notes

**Date:** 
**Attendees:** 
**Location/Link:** 

## Agenda
- 

## Discussion
- 

## Action Items
- [ ] 

## Next Steps
- 
`,
    category: "Work",
    tags: ["meeting"],
  },
  {
    id: "journal",
    name: "Daily Journal",
    title: "Daily Journal",
    content: `# Daily Journal

**Date:** 

## Mood
🙂

## Highlights
- 

## Challenges
- 

## Gratitude
- 

## Tomorrow's Focus
- 
`,
    category: "Personal",
    tags: ["journal"],
  },
  {
    id: "study",
    name: "Study Notes",
    title: "Study Notes",
    content: `# Study Notes

**Subject:** 
**Topic:** 

## Key Concepts
- 

## Definitions
- **Term:** definition

## Examples
- 

## Questions
- 

## Summary
- 
`,
    category: "Study",
    tags: ["study"],
  },
  {
    id: "project",
    name: "Project Planning",
    title: "Project Planning",
    content: `# Project Planning

**Project:** 
**Owner:** 
**Timeline:** 

## Goals
- 

## Scope
- In scope:
- Out of scope:

## Milestones
- [ ] 

## Risks
- 

## Resources
- 
`,
    category: "Work",
    tags: ["project"],
  },
  {
    id: "programming",
    name: "Programming Notes",
    title: "Programming Notes",
    content: `# Programming Notes

**Language/Framework:** 

## Problem
- 

## Approach
- 

## Code
\`\`\`
// snippet
\`\`\`

## Edge Cases
- 

## References
- 
`,
    category: "Development",
    tags: ["programming"],
  },
  {
    id: "todo",
    name: "To-Do List",
    title: "To-Do List",
    content: `# To-Do List

## Today
- [ ] 

## This Week
- [ ] 

## Later
- [ ] 

## Done
- [x] 
`,
    category: "Tasks",
    tags: ["todo"],
  },
];