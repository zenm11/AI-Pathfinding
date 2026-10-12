# AI Pathfinding — Romania Search Lab

Interactive Romania-map assignment for Introduction to Artificial Intelligence, 2026.

The application and its documentation are in [`romania-lab/`](romania-lab/README.md).

```sh
cd romania-lab
npm start
npm test
```

Open http://127.0.0.1:4173. No package installation or API keys are required.

Both Uniform-Cost Search and A* support every city as either endpoint. The custom heuristic combines three landmark distance bounds with a minimum-hop bound. Includes search animation, runtime benchmarking, an explicit storage model, and all-pairs verification.

- [Algorithm explanation](romania-lab/docs/ALGORITHMS.md)
- [Tests](romania-lab/tests/search.test.mjs)

Course PDFs and lecture slides are not included. Add group members and their contributions before submission.

## GitHub Pages hosting

The `Publish Romania Search Lab` workflow tests the app and publishes only `romania-lab/dist` when `main` changes. Set **Settings → Pages → Source → GitHub Actions** once to enable hosting. GitHub reports the final website URL after a successful deployment.

Open `Romania Search Lab.code-workspace` in VS Code to use the included start, test, and debug tasks.
