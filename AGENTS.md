# Project workflow

- The user authorizes Codex to commit and push completed project changes to `origin/main` after each requested editing task, without asking for confirmation again.
- Run appropriate validation before committing. For website changes, run `npm run build` and fix errors before pushing.
- Stage only files related to the completed task. Do not include unrelated user changes, credentials, local configuration, `node_modules`, or `dist`.
- Use descriptive commit messages. Do not create empty commits or force-push. If pushing fails, preserve the local commit and report the reason.
- This workflow applies when Codex completes a task; it does not watch file saves or upload edits made outside Codex.
- Do not start the development server unless the user requests it.
