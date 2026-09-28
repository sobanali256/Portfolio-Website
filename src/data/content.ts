// All copy that drives the page. Sections render from these arrays, so adding a
// project or role is a data edit, not a markup edit.

export const profile = {
  name: 'Soban Ali',
  role: 'AI Engineer',
  location: 'Lahore, Pakistan',
  timeZone: 'Asia/Karachi',
  email: 'sobanali256@gmail.com',
  github: 'https://github.com/sobanali256',
  linkedin: 'https://linkedin.com/in/sobanali256',
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
      'Replicated a published malware-classification pipeline end to end, then pushed past it: VGG-16 fine-tuned on binaries rendered through a grayscale-to-JET image transform reached 99.10% accuracy on the Malimg dataset.',
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
      'Track what you’re watching across five lists, see what airs today, browse and get genre-based recommendations from AniList and Jikan data, and chat with anime-character companions. Firebase handles auth and Firestore sync, with a guest mode that works before sign-up.',
    metric: { value: 'Live', label: 'installable PWA' },
    stack: ['React', 'Firebase', 'AniList GraphQL', 'Jikan API'],
    live: 'https://anitrack-a3031.web.app',
  },
  {
    id: 'warroom',
    title: 'WarRoom',
    kind: 'Multi-agent system',
    summary: 'Three AI agents negotiate contracts so humans don’t have to.',
    detail:
      'Three CrewAI agents argue a contract’s terms to agreement, with zero-touch role detection — at 75% lower cost than a GPT-4o equivalent.',
    metric: { value: '−75%', label: 'cost vs. GPT-4o' },
    stack: ['CrewAI', 'OpenAI API', 'Python', 'React'],
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
          'Built the retrieval core: hybrid search fusing BM25 with all-MiniLM embeddings in ChromaDB, parent-chunk context, claim-level evidence and client-confidentiality guardrails, with Claude writing. Shelved mid-build when the team moved to the skills approach.',
        ],
      },
    ],
    stack: ['LangGraph', 'Amazon Bedrock', 'Playwright', 'pgvector', 'FastAPI', 'Claude skills', 'ChromaDB'],
  },
  {
    period: 'Apr 2026',
    role: '117th of 1,980 teams',
    org: 'Reply Code Challenge',
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
      'CGPA 3.70. Coursework in applied ML, deep learning, AI, cloud computing, databases, algorithms and software architecture.',
    ],
    stack: [],
  },
];

export const stack: { group: string; items: string[] }[] = [
  { group: 'Generative AI', items: ['LangGraph', 'LangChain', 'CrewAI', 'Amazon Bedrock', 'Claude API', 'OpenAI API', 'Hugging Face', 'LangFuse'] },
  { group: 'Retrieval', items: ['pgvector', 'ChromaDB', 'all-MiniLM', 'BM25', 'Hybrid search'] },
  { group: 'Machine learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'OpenCV'] },
  { group: 'Data', items: ['NumPy', 'Pandas', 'Matplotlib', 'NLTK'] },
  { group: 'Engineering', items: ['Python', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'] },
];
