# xcx Workspace

This folder is the independent WeChat mini program workspace.

- `server`: standalone backend service with database access.
- `miniprogram`: native WeChat mini program project.
- `model-service`: Python HTTP model service demo used by the mini program backend.

Recommended local flow:

1. Start the backend in `xcx/server`.
2. Open `xcx/miniprogram` in WeChat DevTools.
3. Point the mini program to the backend URL from `app.js`.

The existing website in the repository root stays untouched and can continue to run independently.
