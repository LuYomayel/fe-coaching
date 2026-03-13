# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Front-end refactor rules

The UI carries a fair bit of tech debt, so every change we touch should move it toward the target architecture below. Treat these rules as the default unless a future ADR says otherwise.

- **Page-level custom hooks**: each page route must expose its stateful/data-fetching logic through a bespoke hook (for example `useCoachProfilePage`). Keep side effects, API calls, and derived state inside the hook; keep the component mostly declarative/presentational. If you notice overlap with another page, extract the shared logic into a reusable hook (e.g., `usePaginatedExercises`). Document new hooks briefly in the file header so other contributors know when to reuse them.

- **Form validation with Zod**: install and import Zod for every dialog or form we refactor or build. Define a schema close to the hook that owns the form logic, export its TypeScript inference when needed, and rely on the schema for both sync validation and transformation. No new ad-hoc validation logic without opening an issue to justify it.

- **State management choices**: default to local state + React context until you hit cross-cutting concerns that span distant parts of the tree (auth, feature flags, notifications, etc.). When that happens, prefer Zustand for lightweight stores (minimal boilerplate, good ergonomics) and Redux Toolkit for complex, highly structured state or when devtools/history time-travel matter. If you introduce either library, explain in the PR why the use case cannot live inside the page hook or loading context, and describe the benefits (sharing state, memoized selectors, etc.) so the team can learn from the decision.

- **Loading context**: create (and reuse) a dedicated loading context/provider pair to coordinate global loading indicators. Page hooks should drive loading updates (e.g., `startLoading('coach-profile')`, `stopLoading('coach-profile')`) so components can read a normalized loading state and decide whether to show skeletons/spinners. Prefer scoped loading keys rather than a single boolean to avoid race conditions.

- **Skeleton components**: implement a small set of skeleton primitives (text block, card, table row) and reuse them in pages while data is loading. Trigger them via the loading context or local hook state so that every fetch displays a polished placeholder. Avoid bespoke inline skeleton markup—create one component per visual pattern and share it.

- **Translations first**: whenever you introduce UI copy (labels, placeholders, dropdown values, help text, etc.), look for an existing key in `src/i18n/en.js` and `src/i18n/es.js` (or their actual paths). Reuse existing keys when possible; if a new string is unavoidable, add matching entries in both files and group them with similar concepts so the dictionaries stay organized.

- **Dialog ownership & SOLID**: every dialog component must live under `src/components/dialogs`, be paired with a dedicated hook that controls its state (open/close, validation, side effects), and keep the public API small so the parent page stays declarative. Favor SOLID principles when extracting logic—single-responsibility hooks/components first, then lean on dependency injection (passing callbacks/contexts) when dialogs need to communicate.

- **Schema location**: all form schemas must live under `src/schemas` (grouped by domain). Components/hooks import from there rather than defining schemas inline. This keeps validation consistent and discoverable.

- **Lean page hooks**: page-level hooks should focus on layout/route orchestration (scroll, data prefetch, navigation guards) and delegate feature logic to specialized hooks (dialogs, forms, contexts). If a hook starts mixing unrelated concerns, split it before adding new functionality.

- **PrimeReact as baseline UI kit**: Prefer PrimeReact components (inputs, dialogs, buttons, etc.) and theming primitives for new UI work or refactors. When extra styling is needed, layer custom CSS/utility classes on top of PrimeFlex rather than reinventing base components.

- **No bespoke CSS**: Avoid adding/keeping local `.css` files. Compose layouts with PrimeFlex utility classes and PrimeReact component props instead of shipping new stylesheets that will become tech debt.

# fe-coaching
