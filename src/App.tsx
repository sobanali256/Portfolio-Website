import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Github, Linkedin, Mail, ArrowRight, Terminal, Shield, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from './components/Navbar';
import NeuralBackground from './components/NeuralBackground';
import Typewriter from './components/Typewriter';
import SectionHeader from './components/SectionHeader';
import ProjectCard from './components/ProjectCard';
import ChapterTransition from './components/ChapterTransition';
import ChapterProgress from './components/ChapterProgress';
import profilePic from './assets/pic.png';

// --- Data ---

const projects = [
  {
    title: "WARROOM",
    tagline: "Multi-agent Negotiation",
    description: "Three AI agents argue over contracts so humans don't have to. Multi-agent negotiation with zero-touch role detection — at 75% lower cost than a GPT-4o equivalent.",
    techStack: ["CrewAI", "OpenAI API", "Python", "React"],
    githubUrl: "https://github.com/sobanali256/War-Room",
    microAnim: (
      <div className="flex gap-4 items-center">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan flex items-center justify-center">
          <Terminal size={14} className="text-accent-cyan" />
        </motion.div>
        <div className="flex flex-col gap-1">
          <div className="w-16 h-1 bg-accent-cyan/30 rounded" />
          <div className="w-12 h-1 bg-accent-vio/30 rounded" />
          <div className="w-14 h-1 bg-accent-cor/30 rounded" />
        </div>
      </div>
    )
  },
  {
    title: "ML FROM SCRATCH",
    tagline: "Fundamental Algorithms",
    description: "Core machine learning rebuilt from first principles: Naive Bayes, Logistic Regression, and Neural Networks in raw NumPy. No high-level libraries — the goal was understanding the math, not calling it.",
    techStack: ["NumPy", "Python", "Mathematics"],
    githubUrl: "https://github.com/sobanali256/Machine-Learning",
    microAnim: (
      <div className="flex items-center justify-center w-full h-full">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-accent-cyan/50 flex items-center justify-center"
        >
          <div className="w-2 h-2 bg-accent-vio rounded-full" />
        </motion.div>
      </div>
    )
  },
  {
    title: "MALWARE DETECTION",
    tagline: "Research Replication",
    description: "Replicated a 2025 research paper, then pushed past it: 99.10% accuracy on the Malimg dataset with VGG-16 fine-tuned on a grayscale-to-JET image pipeline.",
    techStack: ["TensorFlow", "Keras", "OpenCV", "Python"],
    githubUrl: "https://github.com/sobanali256/malware-detection-research-replication",
    microAnim: (
      <div className="relative w-24 h-12 bg-bg-void rounded border border-rule/50 overflow-hidden">
        <motion.div 
          animate={{ x: [-100, 100] }} 
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-accent-cor/20 to-transparent"
        />
        <Shield size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-cor opacity-40" />
      </div>
    )
  },
  {
    title: "TWEET SENTIMENT",
    tagline: "Large-scale NLP",
    description: "Sentiment at scale: 1.6M tweets through a custom preprocessor that cut vocabulary by 40%, with Naive Bayes and Logistic Regression built from first principles reaching 0.83 AUC.",
    techStack: ["Scikit-learn", "NLTK", "Pandas", "Python"],
    githubUrl: "https://github.com/sobanali256/Tweet-Sentiment-Analysis",
    microAnim: (
      <div className="flex items-end gap-1 h-12">
        {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            transition={{ duration: 1, delay: i * 0.1 }}
            className="w-2 bg-accent-vio rounded-t"
          />
        ))}
      </div>
    )
  },
  {
    title: "RESUME ANALYZER",
    tagline: "Semantic Audit",
    description: "An OpenAI-powered semantic audit for resumes — PDF extraction, vagueness detection, and cover letter generation, with a full report in under 10 seconds via Streamlit.",
    techStack: ["OpenAI", "PyPDF2", "Streamlit", "Python"],
    githubUrl: "https://github.com/sobanali256/AI_Resume_Analyzer",
    microAnim: (
      <div className="relative w-16 h-20 border border-rule rounded p-2 overflow-hidden">
        <FileText size={24} className="text-text-lo opacity-20" />
        <motion.div
          animate={{ y: [-10, 80] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-0.5 bg-accent-cyan shadow-[0_0_10px_#6EE7F7]"
        />
      </div>
    )
  },
  {
    title: "RASTH",
    tagline: "Full-stack Medical",
    description: "A full-stack medical records platform: role-based portals, real-time chat over a RESTful API, deployed on AWS EC2 + RDS.",
    techStack: ["Node.js", "Express", "PostgreSQL", "AWS"],
    githubUrl: "https://github.com/sobanali256/RASTH-Db-project",
    microAnim: (
      <div className="flex items-center justify-center w-full h-full">
        <motion.div
          animate={{ 
            pathLength: [0, 1],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-10"
        >
          <svg viewBox="0 0 100 40" className="w-full h-full stroke-accent-cyan fill-none stroke-2">
            <path d="M0 20 L20 20 L25 10 L35 30 L40 20 L60 20 L65 5 L75 35 L80 20 L100 20" />
          </svg>
        </motion.div>
      </div>
    )
  }
];

const skills = [
  { category: "GENERATIVE AI", items: ["CrewAI", "LangChain", "OpenAI API", "Hugging Face"], color: "accent-cyan" },
  { category: "ML", items: ["Scikit-learn", "Pandas", "NumPy", "Matplotlib"], color: "accent-vio" },
  { category: "DEEP LEARNING", items: ["TensorFlow", "Keras", "PyTorch", "Computer Vision"], color: "accent-cor" },
  { category: "BACKEND", items: ["Node.js", "Express", "PostgreSQL", "AWS", "Python"], color: "accent-emerald" },
];

const skillColors: Record<string, string> = {
  "accent-cyan": "text-accent-cyan bg-accent-cyan",
  "accent-vio": "text-accent-vio bg-accent-vio",
  "accent-cor": "text-accent-cor bg-accent-cor",
  "accent-emerald": "text-accent-emerald bg-accent-emerald",
};

const experiences = [
  {
    period: "Apr 2026 — Present",
    role: "AI Intern",
    company: "Ledelsea",
    type: "Internship",
    points: [
      "Sole developer on a RAG-based solution that automates RFP proposal generation, reducing the manual effort required to produce a first draft.",
      "Designed and built the full pipeline end-to-end, working from an initial Docker skeleton.",
      "Implemented fixed-size chunking with all-MiniLM embeddings stored in ChromaDB.",
      "Built hybrid search combining semantic retrieval with BM25 lexical search, with a reranker surfacing the top 10 most relevant chunks.",
      "Integrated Claude for final proposal generation.",
    ],
    tech: ["Python", "ChromaDB", "all-MiniLM", "BM25", "Claude API", "Docker"],
  },
];

const milestones = [
  { value: "3.69", label: "Cumulative GPA" },
  { value: "117 / 1980", label: "Reply Code Challenge · Apr 2026" },
  { value: "June 2026", label: "Graduation" },
];

// --- Components ---

export default function App() {
  const [heroComplete, setHeroComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear a prior submission failure once the user resumes editing
    if (submitError) setSubmitError(false);
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) errors.name = 'Please tell me your name.';
    if (!formState.email.trim()) {
      errors.email = 'I need a way to reply to you.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = "That email doesn't look quite right.";
    }
    if (!formState.subject.trim()) errors.subject = "What's this about?";
    if (!formState.message.trim()) errors.message = 'The message is empty.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const response = await fetch('https://formspree.io/f/xeepkerq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formState)
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setIsSuccess(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3D Tilt Logic for Profile Image
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-bg-void selection:bg-accent-cyan selection:text-bg-void overflow-x-hidden">
      <Navbar />
      <ChapterProgress />
      <NeuralBackground />

      <main className="relative z-10">
        {/* --- CHAPTER 01: THE SPARK (Hero) --- */}
        <section id="hero" className="relative h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="font-mono text-accent-cyan text-xs md:text-sm tracking-[0.4em] mb-6 uppercase"
            >
              <Typewriter text="// Chapter 01 · The Spark" delay={100} onComplete={() => setHeroComplete(true)} />
            </motion.div>

            <AnimatePresence>
              {heroComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="text-[clamp(2.75rem,8vw,6rem)] font-display font-extrabold text-text-hi uppercase tracking-tight leading-[0.95] mb-8">
                    SOBAN ALI
                  </h1>
                  <p className="font-body text-lg md:text-2xl text-text-lo max-w-2xl mx-auto mb-12 leading-relaxed">
                    AI Engineer in Progress · Final-Year CS @ FAST NUCES
                    <br />
                    <span className="text-sm opacity-60 mt-4 block font-mono">
                      From multi-agent systems to research replications — chasing why things work, not just that they work.
                    </span>
                  </p>

                  <motion.a
                    href="#about"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-accent-cyan text-accent-cyan font-mono text-xs uppercase tracking-widest rounded-full hover:bg-accent-cyan hover:text-bg-void transition-all duration-300"
                  >
                    [ Begin the Story ]
                    <ArrowRight size={16} />
                  </motion.a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">Scroll to Continue</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-12 bg-linear-to-b from-accent-cyan to-transparent"
            />
          </motion.div>
        </section>

        <ChapterTransition nextNumber="02" line="Every system starts with a why." />

        {/* --- CHAPTER 02: THE ORIGIN (About) --- */}
        <section id="about" className="relative min-h-screen py-20 sm:py-32 px-6 flex items-center">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              {/* Confusion Matrix Watermark */}
              <div className="absolute -top-20 -left-20 w-64 h-64 opacity-5 pointer-events-none grid grid-cols-8 grid-rows-8 gap-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`bg-accent-cyan ${i % 9 === 0 ? 'opacity-100' : 'opacity-40'}`} />
                ))}
              </div>
              
              <SectionHeader number="02" label="The Origin" title="Why I Build" />

              <div className="space-y-6 font-body text-lg text-text-lo leading-relaxed">
                <p>
                  Final year CS student at <span className="text-text-hi font-medium">FAST NUCES</span>, graduating <span className="text-text-hi font-medium">June 2026</span>. I'm an AI engineer in progress exploring and building to develop both theoretical depth and hands-on intuition. From architecting multi-agent systems to implementing machine learning algorithms from scratch, I chase understanding at the level of <span className="text-accent-cyan">why things work, not just that they work</span>.
                </p>
                <p className="border-l-2 border-accent-cyan pl-6">
                  My proudest project so far: replicating a malware detection research paper and pushing it past the original benchmarks. That kind of work — reading deeply, rebuilding carefully, then going further is exactly how I learn best.
                </p>
                <p>
                  I'm drawn to AI because the field moves fast and the stakes are real. I'd rather be one of the people steering it than someone it leaves behind.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12">
                {milestones.map((milestone) => (
                  <div key={milestone.label}>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-text-hi">{milestone.value}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-accent-vio">{milestone.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative perspective-1000">
              <motion.div
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative aspect-square lg:aspect-auto lg:h-[600px] group cursor-pointer"
              >
                <motion.div
                  style={{
                    transform: "translateZ(50px)",
                    transformStyle: "preserve-3d",
                  }}
                  className="absolute inset-0"
                >
                  <img
                    src={profilePic}
                    alt="Soban Ali"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                
                <motion.div 
                  style={{
                    transform: "translateZ(80px)",
                  }}
                  className="absolute bottom-8 left-8"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan mb-2">// est. Lahore, Pakistan</div>
                  <div className="text-2xl font-display font-bold text-text-hi uppercase">Soban Ali</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <ChapterTransition nextNumber="03" line="Understanding demands the right tools." />

        {/* --- CHAPTER 03: THE TOOLKIT (Skills) --- */}
        <section id="skills" className="relative min-h-screen py-20 sm:py-32 px-6 bg-bg-deep/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader number="03" label="The Toolkit" title="What I Build With" className="text-center" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
              {skills.map((skillGroup, idx) => (
                <motion.div
                  key={skillGroup.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-bg-card border border-rule p-6 sm:p-8 rounded-xl hover:border-accent-cyan/30 transition-colors group"
                >
                  <h3 className={`font-mono text-xs uppercase tracking-[0.2em] mb-8 ${skillColors[skillGroup.color].split(' ')[0]}`}>
                    [ {skillGroup.category} ]
                  </h3>
                  <div className="flex flex-col gap-4">
                    {skillGroup.items.map((skill) => (
                      <div key={skill} className="flex items-center justify-between">
                        <span className="font-body text-sm text-text-lo group-hover:text-text-hi transition-colors">{skill}</span>
                        <div className="w-12 h-1 bg-rule rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className={`h-full ${skillColors[skillGroup.color].split(' ')[1]}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Attention Map Aesthetic Background */}
            <div className="absolute inset-0 -z-10 opacity-5 pointer-events-none flex items-center justify-center">
              <div className="w-[800px] h-[800px] rounded-full bg-radial from-accent-cyan to-transparent blur-3xl" />
            </div>
          </div>
        </section>

        <ChapterTransition nextNumber="04" line="Tools mean nothing until something gets built." />

        {/* --- CHAPTER 04: THE BUILDS (Projects) --- */}
        <section id="projects" className="relative min-h-screen py-20 sm:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader number="04" label="The Builds" title="Proof of Work" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.title} 
                  title={project.title}
                  tagline={project.tagline}
                  description={project.description}
                  techStack={project.techStack}
                  githubUrl={project.githubUrl}
                  microAnim={project.microAnim}
                />
              ))}
            </div>

            <div className="mt-20 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-8">Each build taught something the last one couldn't.</p>
              <a href="https://github.com/sobanali256" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent-cyan hover:underline font-mono text-xs uppercase tracking-widest">
                More on GitHub <Github size={14} />
              </a>
            </div>
          </div>
        </section>

        <ChapterTransition nextNumber="05" line="Then the work left the sandbox." />

        {/* --- CHAPTER 05: THE FIELD (Experience) --- */}
        <section id="experience" className="relative min-h-screen py-20 sm:py-32 px-6 bg-bg-deep/50 flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <SectionHeader number="05" label="The Field" title="Theory, Meet Production" className="text-center" />

            <div className="relative mt-20 max-w-3xl mx-auto">
              {/* Timeline rail */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-rule" />
              <motion.div
                style={{ scaleY: scrollYProgress }}
                className="absolute left-2 top-2 bottom-2 w-px bg-accent-cyan origin-top"
              />

              <div className="space-y-12">
                {experiences.map((exp, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative pl-10 md:pl-14"
                  >
                    {/* Node */}
                    <div className="absolute left-2 top-2 w-3.5 h-3.5 rounded-full bg-accent-cyan border-4 border-bg-deep -translate-x-1/2 z-10" />

                    <div className="bg-bg-card border border-rule rounded-xl p-6 sm:p-8 hover:border-accent-cyan/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-6">
                        <div>
                          <h3 className="text-2xl font-display font-bold text-text-hi uppercase tracking-tight">{exp.role}</h3>
                          <div className="font-mono text-sm text-accent-cyan mt-1">
                            {exp.company} <span className="text-text-lo opacity-60">· {exp.type}</span>
                          </div>
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-accent-vio whitespace-nowrap sm:pt-1">
                          {exp.period}
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {exp.points.map((point, i) => (
                          <li key={i} className="flex gap-3 font-body text-sm text-text-lo leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        {exp.tech.map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 border border-rule font-mono text-[9px] uppercase tracking-widest text-text-lo"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ChapterTransition nextNumber="06" line="The story is still being written." />

        {/* --- CHAPTER 06: THE NEXT CHAPTER (Contact) --- */}
        <section id="contact" className="relative min-h-screen py-20 sm:py-32 px-6 flex items-center">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <SectionHeader number="06" label="The Next Chapter" title="What Comes Next" />
              <p className="font-body text-lg text-text-lo leading-relaxed mb-12 max-w-md">
                Graduating June 2026 and looking for the right place to keep building. If you're working on something in AI worth doing well — a role, a research collaboration, a hard problem — I'd like to hear about it. I read every message.
              </p>

              <div className="space-y-8">
                <a href="mailto:sobanali256@gmail.com" className="flex items-center gap-4 sm:gap-6 group min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-full border border-rule flex items-center justify-center group-hover:border-accent-cyan transition-colors">
                    <Mail size={20} className="text-text-lo group-hover:text-accent-cyan transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">Email</div>
                    <div className="text-text-hi font-mono break-all">sobanali256@gmail.com</div>
                  </div>
                </a>
                <a href="https://linkedin.com/in/sobanali256" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 sm:gap-6 group min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-full border border-rule flex items-center justify-center group-hover:border-accent-cyan transition-colors">
                    <Linkedin size={20} className="text-text-lo group-hover:text-accent-cyan transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">LinkedIn</div>
                    <div className="text-text-hi font-mono break-all">linkedin.com/in/sobanali256</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-bg-card border border-rule p-6 sm:p-10 rounded-2xl relative overflow-hidden">
              {/* Radar Sweep Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-accent-cyan rounded-full"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-linear-to-b from-accent-cyan to-transparent" />
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-accent-cyan/50 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-accent-cyan/30 rounded-full" />
              </div>

              <form 
                onSubmit={handleSubmit}
                noValidate
                className="relative z-10 space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Name</label>
                    <input 
                      name="name" 
                      type="text" 
                      value={formState.name}
                      onChange={handleInputChange}
                      className={`w-full bg-transparent border-b py-2 outline-none transition-colors font-body text-text-hi ${formErrors.name ? 'border-accent-cor' : 'border-rule focus:border-accent-cyan'}`} 
                    />
                    <AnimatePresence>
                      {formErrors.name && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-accent-cor font-mono text-[9px] uppercase tracking-wider"
                        >
                          <AlertCircle size={10} />
                          {formErrors.name}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Email</label>
                    <input 
                      name="email" 
                      type="email" 
                      value={formState.email}
                      onChange={handleInputChange}
                      className={`w-full bg-transparent border-b py-2 outline-none transition-colors font-body text-text-hi ${formErrors.email ? 'border-accent-cor' : 'border-rule focus:border-accent-cyan'}`} 
                    />
                    <AnimatePresence>
                      {formErrors.email && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-accent-cor font-mono text-[9px] uppercase tracking-wider"
                        >
                          <AlertCircle size={10} />
                          {formErrors.email}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Subject</label>
                  <input 
                    name="subject" 
                    type="text" 
                    value={formState.subject}
                    onChange={handleInputChange}
                    className={`w-full bg-transparent border-b py-2 outline-none transition-colors font-body text-text-hi ${formErrors.subject ? 'border-accent-cor' : 'border-rule focus:border-accent-cyan'}`} 
                  />
                  <AnimatePresence>
                    {formErrors.subject && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-accent-cor font-mono text-[9px] uppercase tracking-wider"
                      >
                        <AlertCircle size={10} />
                        {formErrors.subject}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Message</label>
                  <textarea 
                    name="message" 
                    rows={4} 
                    value={formState.message}
                    onChange={handleInputChange}
                    className={`w-full bg-transparent border-b py-2 outline-none transition-colors font-body text-text-hi resize-none ${formErrors.message ? 'border-accent-cor' : 'border-rule focus:border-accent-cyan'}`} 
                  />
                  <AnimatePresence>
                    {formErrors.message && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-accent-cor font-mono text-[9px] uppercase tracking-wider"
                      >
                        <AlertCircle size={10} />
                        {formErrors.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="relative">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 font-display font-bold uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      isSuccess 
                        ? 'bg-accent-emerald text-bg-void' 
                        : 'bg-linear-to-r from-accent-cyan to-accent-vio text-bg-void'
                    } ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-bg-void/30 border-t-bg-void rounded-full"
                        />
                        Sending...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 size={18} />
                        Message Sent
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 left-0 w-full text-center font-mono text-[10px] text-accent-emerald uppercase tracking-widest"
                      >
                        Thanks — I'll get back to you soon.
                      </motion.p>
                    )}
                    {submitError && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 left-0 w-full flex items-center justify-center gap-2 font-mono text-[10px] text-accent-cor uppercase tracking-widest"
                      >
                        <AlertCircle size={10} />
                        Something went wrong. Try again or email me directly.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="py-12 px-6 border-t border-rule bg-bg-void relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
              © 2026 Soban Ali — written chapter by chapter
            </div>
            <div className="flex items-center gap-8">
              <a href="https://github.com/sobanali256" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-widest hover:text-accent-cyan transition-colors">Github</a>
              <a href="https://linkedin.com/in/sobanali256" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-widest hover:text-accent-cyan transition-colors">Linkedin</a>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
              Lahore, Pakistan
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
