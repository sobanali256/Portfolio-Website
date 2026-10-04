// All copy that drives the page. Sections render from these arrays, so adding a
// project or role is a data edit, not a markup edit.

export const profile = {
  name: 'Soban Ali',
  role: 'AI Full-Stack Engineer',
  location: 'Lahore, Pakistan',
  timeZone: 'Asia/Karachi',
  email: 'sobanali256@gmail.com',
  github: 'https://github.com/sobanali256',
  linkedin: 'https://linkedin.com/in/sobanali256',
  x: 'https://x.com/sobanali256',
  /** Served from `public/`; the source is `resume/Soban_Ali_Resume.tex`. */
  resume: '/Soban-Ali-Resume.pdf',
  availability: 'Open to AI roles from June 2027',
};

export interface Project {
  id: string;
  title: string;
  kind: string;
  summary: string;
  detail: string;
  metric: { value: string; label: string };
  stack: string[];
  /** Source repo; omit for closed-source work. */
  href?: string;
  live?: string;
}

export const projects: Project[] = [
  {
    id: 'malware',
    title: 'Malware Detection, Replicated',
    kind: 'Research replication',
    summary: 'Rebuilt a 2025 paper, then beat its benchmark.',
    detail:
      'Replicated Younas et al. (2025) end to end, then pushed past it: binaries rendered as images, compressed by SVD low-rank reconstruction (k = 60) and JET-coloured to three channels, feed a fine-tuned VGG-16 that reaches 99.10% accuracy across 25 malware families on Malimg, beating the paper’s 97.98%.',
    metric: { value: '99.10%', label: 'accuracy · Malimg' },
    stack: ['TensorFlow', 'Keras', 'OpenCV', 'Python'],
    href: 'https://github.com/sobanali256/malware-detection-research-replication',
  },
  {
    id: 'anitrack',
    title: 'AniTrack',
    kind: 'Web app · PWA',
    summary: 'A personal anime journal, installable and live.',
    detail:
      'Track what you’re watching across five lists and see what airs today, with AniList and Jikan data. A content-based engine recommends from your watch history, and an AI chat companion talks in several personalities. Firebase handles auth, Firestore sync and push notifications through Cloud Functions, with a guest mode that works before sign-up.',
    metric: { value: 'Live', label: 'installable PWA' },
    stack: ['React', 'Vite', 'Firebase', 'AniList API', 'Jikan API'],
    live: 'https://anitrack-a3031.web.app',
  },
  {
    id: 'warroom',
    title: 'WarRoom',
    kind: 'Multi-agent system',
    summary: 'Three AI agents debate a contract to surface its blind spots.',
    detail:
      'A Shark, a Shield and a Mediator — three CrewAI agents — debate a contract in sequence to surface its blind spots, with zero-touch role detection. The prompts are tuned so the debate holds up on GPT-4o-mini, at a fraction of GPT-4o’s cost.',
    metric: { value: '3', label: 'adversarial agents' },
    stack: ['CrewAI', 'GPT-4o-mini', 'Python', 'React'],
    href: 'https://github.com/sobanali256/War-Room',
  },
  {
    id: 'ml-scratch',
    title: 'ML From Scratch',
    kind: 'Fundamentals',
    summary: 'Naive Bayes, logistic regression and neural nets in raw NumPy.',
    detail:
      'Core algorithms rebuilt from first principles with no high-level ML libraries. The goal was understanding the math, not calling it.',
    metric: { value: '3', label: 'models, raw NumPy' },
    stack: ['NumPy', 'Python', 'Linear algebra'],
    href: 'https://github.com/sobanali256/Machine-Learning',
  },
  {
    id: 'resume',
    title: 'Resume Analyzer',
    kind: 'LLM application',
    summary: 'A semantic audit for resumes, with a report in seconds.',
    detail:
      'An OpenAI-powered audit: PDF extraction, vagueness detection and cover-letter generation, with the full report in under ten seconds via Streamlit.',
    metric: { value: '<10s', label: 'full report' },
    stack: ['OpenAI', 'PyPDF2', 'Streamlit', 'Python'],
    href: 'https://github.com/sobanali256/AI_Resume_Analyzer',
  },
];

export interface Experience {
  period: string;
  role: string;
  org: string;
  kind: string;
  points: string[];
  /** Distinct pieces of work within one role, newest first; rendered after `points`. */
  projects?: { name: string; period: string; points: string[] }[];
  stack: string[];
}

export const experiences: Experience[] = [
  {
    period: 'Apr 2026 — Now',
    role: 'AI Intern',
    org: 'Ledelsea',
    kind: 'Internship',
    points: [],
    projects: [
      {
        name: 'AI testing platform',
        period: 'Aug 2026 — Now',
        points: [
          'Building a platform that reads an application’s source and writes its end-to-end tests: tree-sitter chunks the Java and TypeScript repos into pgvector, and a LangGraph pipeline on Amazon Bedrock maps the business process into scenarios and test cases.',
          'A person approves each case; it then becomes a Playwright script that is statically checked and dry-run before it runs against the live app. Failures are diagnosed from the trace, console and screenshot, with evidence in S3 and results on a React dashboard.',
        ],
      },
      {
        name: 'Proposal-writing skills for Claude',
        period: 'Jun — Aug 2026',
        points: [
          'Built eight Claude skills that write complete RFP responses in a 15-phase workflow: classify the bid, extract every requirement, draft each section in its own subagent from 29 indexed past proposals, and build the Word document.',
          'Python quality gates check depth, voice, style and buyer-table fidelity, and the document isn’t built until they pass. Used on five real public-sector RFPs.',
        ],
      },
      {
        name: 'RAG proposal generator',
        period: 'Apr — May 2026',
        points: [
          'Built the retrieval core: hybrid search fusing BM25 with all-MiniLM embeddings in ChromaDB, parent-child chunking with top-5 reranking, claim-level evidence and client-confidentiality guardrails, with Claude writing, and fixed a silent schema bug that had failed query expansion on 100% of requests. Shelved mid-build when the team moved to the skills approach.',
        ],
      },
    ],
    stack: ['LangGraph', 'Amazon Bedrock', 'Playwright', 'pgvector', 'FastAPI', 'Claude skills', 'ChromaDB'],
  },
  {
    period: 'Apr 2026',
    role: '117th of 1,980 teams',
    org: 'Reply AI Agent Challenge',
    kind: 'Competition',
    points: [
      'Multi-agent fraud detection: a LangChain agent pipeline for spotting fraudulent patterns, with LangFuse tracking cost and usage across runs.',
    ],
    stack: ['LangChain', 'LangFuse', 'Python'],
  },
  {
    period: '2023 — Jun 2027',
    role: 'B.S. Computer Science',
    org: 'FAST NUCES',
    kind: 'Education',
    points: [
      'CGPA 3.70, on the Dean’s Honor List every semester from Fall 2023 to Fall 2025. Coursework in applied ML, deep learning, AI, cloud computing, databases, algorithms and software architecture.',
    ],
    stack: [],
  },
];

// Mirrors the Skills section of the résumé (resume/Soban_Ali_Resume.tex).
export const stack: { group: string; items: string[] }[] = [
  { group: 'Generative AI', items: ['LangGraph', 'LangChain', 'CrewAI', 'Claude API', 'OpenAI API', 'LangSmith', 'LangFuse', 'RAG', 'Multi-agent systems'] },
  { group: 'Machine learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'Hugging Face', 'OpenCV', 'Transfer learning', 'CNNs'] },
  { group: 'Languages & tools', items: ['Python', 'TypeScript', 'C++', 'SQL', 'Git', 'Docker'] },
  { group: 'Databases', items: ['PostgreSQL', 'pgvector', 'ChromaDB', 'MySQL'] },
  { group: 'Backend & cloud', items: ['FastAPI', 'Node.js', 'React', 'Firebase', 'Amazon Bedrock', 'AWS (EC2, RDS, ECS, S3, SQS)', 'Playwright'] },
];
