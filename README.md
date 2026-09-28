<div align="center">

# 🚀 Soban Ali — Portfolio Website

**Personal portfolio showcasing AI/ML research, projects, and software engineering work**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sobanali.vercel.app-blue?style=for-the-badge&logo=vercel)](https://sobanali.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📖 Overview

A modern, responsive personal portfolio website built with React, TypeScript, and Vite. The site highlights AI/ML research, academic projects, and software engineering work — designed to serve as a professional landing page for recruiters and collaborators.

**Live at:** [sobanali.vercel.app](https://sobanali.vercel.app)

---

## ✨ Features

- **Editorial "research paper" design** — numbered sections, captioned figures, serif display type on warm paper
- **Live pipeline figure** — the hero is an animated schematic of a hybrid RAG pipeline
- **Light & dark themes** — follows the OS preference, with a manual toggle
- **Smooth animations** — Motion scroll reveals and Lenis smooth scrolling, both respecting reduced-motion
- **Working contact form** — client-side validation, sent via Formspree
- **Responsive design** — fully optimized for desktop, tablet, and mobile
- **Deployed on Vercel** — with Vercel Analytics and custom routing via `vercel.json`

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animations | Motion |
| Smooth Scroll | Lenis |
| Icons | Lucide React |
| Contact Form | Formspree |
| Deployment | Vercel + Vercel Analytics |

---

## 📂 Project Structure

```
Portfolio-Website/
├── src/
│   ├── App.tsx        # Page sections
│   ├── components/    # Navbar, PipelineFigure, ProjectIndex, ContactForm, …
│   ├── data/          # content.ts (all site copy) and chapters.ts (section ids)
│   ├── hooks/         # useTheme, useActiveSection
│   └── index.css      # Tailwind v4 theme tokens (light & dark)
├── public/            # Favicon and static files
├── index.html         # Entry HTML, fonts, pre-paint theme script
├── package.json       # Dependencies & scripts
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment config
├── metadata.json      # Portfolio metadata
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sobanali256/Portfolio-Website.git
   cd Portfolio-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be running at `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove the `dist` directory |

---

## 🌐 Deployment

This project is deployed via [Vercel](https://vercel.com). To deploy your own fork:

1. Push the repository to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel will automatically build and deploy on every push to `main` — no environment variables are needed

To change the site's content (projects, experience, stack), edit `src/data/content.ts`.

---

## 👤 About

**Soban Ali** — Computer Science student at FAST-NUCES (graduating 2027), specializing in AI/ML. This portfolio highlights research and projects in machine learning, LLM applications, and web development, including:

- 🔬 **Malware Detection** — VGG-16 on the Malimg dataset, achieving 99.10% test accuracy
- 📺 **AniTrack** — Installable anime-journal PWA on Firebase with AniList & Jikan data ([live](https://anitrack-a3031.web.app))
- 🤝 **WarRoom** — Multi-agent AI contract negotiation system
- 🧮 **ML From Scratch** — Naive Bayes, logistic regression & neural nets in raw NumPy
- 📄 **Resume Analyzer** — AI-powered resume feedback tool

---

## 📬 Contact

- **Portfolio:** [sobanali.vercel.app](https://sobanali.vercel.app)
- **GitHub:** [@sobanali256](https://github.com/sobanali256)

---

<div align="center">

Made with ❤️ using React + TypeScript + Vite

</div>
