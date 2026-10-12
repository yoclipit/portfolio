# Julian Medina IT Portfolio

A static HTML/CSS portfolio prepared for GitHub Pages. The portfolio uses the supplied résumé and documents school projects with explicit scope and roles.

## Preview

Open `index.html` in a browser. The Pulse Runner demo at `projects/pulse-runner/index.html` is self-contained and needs no build tools.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload **the contents of this folder** to the repository root, preserving the subfolders.
3. In repository Settings → Pages, select **Deploy from a branch**, `main`, and `/ (root)`.

The included `.nojekyll` file is intentional. All local links are relative so they work at a GitHub Pages project URL.

## Project evidence and scope

- `projects/pulse-runner/` is a copy of the browser game in `School/TECH 3500/pulse-runner-vercel`.
- `projects/ar-source/` contains selected C# scripts from the Unity project. These are reviewable code samples, not a complete Unity build. `CanvasSwitcher.cs` is copied from the original `SceneLoader.cs` so its filename matches its `CanvasSwitcher` class; the code is unchanged.
- `assets/ar-retail-demo.webm` is a web-sized version of the selected AR screen recording; `assets/ar-retail-poster.jpg` is a still from that recording.
- The e-sports lab, HCI, and ACME pages summarize school documents. The original coursework PDFs are not included here.
- The AI lab is described as a local prototype. Its server, dependencies, and `.env` are not part of this static site.
- The résumé is a new one-page PDF with education, relevant experience, skills, and eight documented projects. The website links directly to this file.

The private project assessment and suggested résumé bullets are in `../Portfolio_Project_Review.md` and should not be uploaded with the public site.
