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
  href: string;
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
    id: 'sentiment',
    title: 'Tweet Sentiment at Scale',
    kind: 'NLP',
    summary: '1.6M tweets, a custom preprocessor, models built from first principles.',
    detail:
      'A custom preprocessor that cut vocabulary by 40%, feeding hand-built Naive Bayes and logistic regression classifiers that reached 0.83 AUC.',
    metric: { value: '0.83', label: 'AUC · 1.6M tweets' },
    stack: ['scikit-learn', 'NLTK', 'Pandas', 'Python'],
    href: 'https://github.com/sobanali256/Tweet-Sentiment-Analysis',
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
  {
    id: 'rasth',
    title: 'RASTH',
    kind: 'Full-stack platform',
    summary: 'Medical records with role-based portals and real-time chat.',
    detail:
      'Role-based portals and real-time chat over a RESTful Express API, backed by PostgreSQL and deployed on AWS EC2 with RDS.',
    metric: { value: 'EC2', label: '+ RDS deployment' },
    stack: ['Node.js', 'Express', 'PostgreSQL', 'AWS'],
    href: 'https://github.com/sobanali256/RASTH-Db-project',
  },
];

export interface Experience {
  period: string;
  role: string;
  org: string;
  kind: string;
  points: string[];
  stack: string[];
}

export const experiences: Experience[] = [
  {
    period: 'Apr 2026 — Now',
    role: 'AI Intern',
    org: 'Ledelsea',
    kind: 'Internship',
    points: [
      'Sole developer of a RAG system that drafts RFP proposals, cutting the manual effort to a first draft.',
      'Designed the pipeline end to end from an initial Docker skeleton: fixed-size chunking, all-MiniLM embeddings, ChromaDB.',
      'Built hybrid retrieval — semantic search plus BM25 — with a reranker surfacing the ten most relevant chunks, and Claude for final generation.',
    ],
    stack: ['Python', 'ChromaDB', 'BM25', 'Claude API', 'Docker'],
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
  { group: 'Generative AI', items: ['LangChain', 'CrewAI', 'OpenAI API', 'Claude API', 'Hugging Face', 'LangFuse'] },
  { group: 'Retrieval', items: ['ChromaDB', 'all-MiniLM', 'BM25', 'Reranking'] },
  { group: 'Machine learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'OpenCV'] },
  { group: 'Data', items: ['NumPy', 'Pandas', 'Matplotlib', 'NLTK'] },
  { group: 'Engineering', items: ['Python', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'] },
];
