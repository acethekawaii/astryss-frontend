---
trigger: always_on
---

---
description: Rules for front-end development
---
# Frontend Development Rules

## Languages and Frameworks

Expert in React, Next.js, JavaScript, TypeScript, HTML, CSS, TailwindCSS, Shadcn, Base UI.

Use TypeScript by default.

Prioritize TailwindCSS utility classes for styling. Avoid separate CSS files for component-specific styles. Use CSS modules or global styles only for truly global definitions.

Name functions based on what they do, not the event they respond to. Be specific and semantic.

Good: `submitForm`, `deleteUser`, `closeModal`, `toggleSidebar`
Avoid: `handleClick`, `handleSubmit`, `handleChange`

Exception: Generic event handlers in reusable components can use `onEvent` pattern for props (onSelect, onClick, onChange) to match React conventions.

Use descriptive names that reveal intent. Prefer clarity over brevity.

## State Management

Minimize useState by deriving values when possible. Don't store what you can calculate.

Group related state together. Use objects for related values or useReducer for complex state logic.

Keep state as local as possible. Lift state only when multiple components need to share it.

Use state updater functions when new state depends on previous state:
```javascript
setCount(prev => prev + 1)
```

## Server Components and Client Components

Default to Server Components in Next.js. Use Client Components only when needed:
- User interactivity (onClick, onChange, etc.)
- Browser-only APIs (localStorage, window, document)
- React hooks (useState, useEffect, useContext)
- Event listeners

Mark Client Components with "use client" directive at the top of the file.

Check for `typeof window !== 'undefined'` before accessing browser APIs in components that might render on server.

All dynamic code runs at request time by default. Opt into caching where it makes sense.

Use updateTag() for immediate cache updates after mutations (read-your-writes semantics).

Use revalidateTag() to invalidate cached data for future requests.

Use refresh() to refresh client router from Server Actions.

## Data Fetching

Fetch data at the server level using Server Components, Server Actions, or Route Handlers.

Use Server Actions for mutations instead of API routes when possible.

Implement proper loading states and error boundaries for async operations.

## Effects and Side Effects

Use useEffect sparingly. Most data fetching should happen server-side in Next.js.

Always include all dependencies in useEffect arrays. Fix warnings, don't suppress them.

Clean up side effects properly (event listeners, subscriptions, timers).

Avoid useEffect for derived state. Calculate during render or use useMemo for expensive computations.

Consider using useEffectEvent (React 19.2) for extracting non-reactive logic from effects.

## Error Handling and User Feedback

Use async/await with try-catch blocks for asynchronous operations.

Always handle errors gracefully. Show user-friendly messages, never expose technical details.

Use toast notifications (Sonner) for transient feedback. Use modals for errors requiring user action.

Implement loading states for async operations. Never leave users wondering if something is happening.

Validate input on both client and server. Provide immediate feedback on validation errors.

## Component Design

Keep components focused and single-purpose. If a component does more than one thing, split it.

Use early returns to handle edge cases and reduce nesting:
```typescript
if (!user) return <LoginPrompt />
if (isLoading) return <Spinner />
return <UserDashboard user={user} />
```

Extract complex TSX into separate components or variables for readability.

Avoid prop drilling. Use composition, context, or state management libraries for deeply nested props.

## Conditional Rendering and Styling

Use logical AND (&&) for simple conditionals:
```typescript
{isVisible && <Component />}
```

Use ternary operators for if-else rendering:
```javascript
{isLoading ? <Spinner /> : <Content />}
```

For conditional Tailwind classes, use clsx or cn utility:
```javascript
import { cn } from '@/lib/utils'
className={cn("base-classes", isActive && "active-classes")}
```

## Performance Optimization

Use React.lazy and dynamic imports for code splitting:
```javascript
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

## Accessibility

Use semantic HTML (button, nav, main, article) over generic divs.

Ensure all interactive elements are keyboard accessible.

Provide alt text for images and aria-labels for icon-only buttons.

Maintain sufficient color contrast and support reduced motion preferences.

Use Base UI and Shadcn components for accessible primitives.

## UI/UX Best Practices

Design mobile-first, enhance for larger screens.

Provide clear visual feedback for all user actions (hover states, loading, success).

Make error states helpful. Tell users what went wrong and how to fix it.

Use consistent spacing, typography, and colors throughout the app.

Anticipate and prevent user errors through good UX design.

Keep forms simple and progressively disclose complexity.

## Code Quality

Write self-documenting code. Use clear names over comments when possible.

Keep functions small and focused. If over 20-30 lines, consider refactoring.

Avoid magic numbers and strings. Use named constants.

Remove unused code, imports, and console.logs before committing.

## File Organization

Group related files by feature or module, not by file type.

Keep components, hooks, and utilities close to where they're used.

Use index files sparingly. Explicit imports are clearer than barrel exports.

Name files consistently: kebab-case for file names