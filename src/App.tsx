import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Github, Linkedin, Mail, ArrowRight, Terminal, Shield, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import NeuralBackground from './components/NeuralBackground';
import Typewriter from './components/Typewriter';
import SectionHeader from './components/SectionHeader';
import ProjectCard from './components/ProjectCard';
import profilePic from './assets/pic.png';

// --- Data ---

const projects = [
  {
    title: "WARROOM",
    tagline: "Multi-agent Negotiation",
    description: "Three adversarial AI agents debate contracts so you don't have to. 75% cheaper than GPT-4o. Zero-touch role detection.",
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
    description: "Implementing core machine learning concepts from first principles. Includes Naive Bayes, Logistic Regression, and Neural Networks without high-level libraries.",
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
    description: "Replicated and surpassed a 2025 research paper. 99.10% accuracy on the Malimg dataset. VGG-16 fine-tuned on grayscale-to-JET pipeline.",
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
    description: "1.6M tweets. Custom preprocessor. 40% vocabulary reduction. 0.83 AUC. Naive Bayes and Logistic Regression from first principles.",
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
    description: "OpenAI-powered semantic audit. PDF extraction. Vagueness detection. Cover letter generation. Sub-10s report. Streamlit interface.",
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
    description: "Full-stack. Role-based portals. AWS EC2 + RDS. Real-time chat via RESTful API. Production-grade medical record storage.",
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

const milestones = [
  { year: "2025", title: "Rank 231 Globally", subtitle: "Code Challenge", description: "Ranked 231 globally among 10,000+ participants." },
  { year: "2025", title: "NCEAC-HEC Certified", subtitle: "Professional Certification", description: "Certified Generative AI Application Developer." },
  { year: "2025", title: "Advanced ML", subtitle: "Coursera", description: "Completed Advanced Learning Algorithms specialization." },
  { year: "2023-2025", title: "5x Dean's List", subtitle: "Academic Excellence", description: "Maintained 3.69 GPA at FAST NUCES." },
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
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
    if (!formState.name.trim()) errors.name = 'Identity required for transmission.';
    if (!formState.email.trim()) {
      errors.email = 'Return address required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = 'Invalid frequency. Check return address format.';
    }
    if (!formState.subject.trim()) errors.subject = 'Signal header missing.';
    if (!formState.message.trim()) errors.message = 'Payload empty. Transmission aborted.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('https://formspree.io/f/xeepkerq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      if (response.ok) {
        setIsSuccess(true);
        setFormState({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Transmission failed:', error);
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
      <CustomCursor />
      <Navbar />
      <NeuralBackground />

      <main className="relative z-10">
        {/* --- SECTION 01: SIGNAL (Hero) --- */}
        <section id="hero" className="relative h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="font-mono text-accent-cyan text-xs md:text-sm tracking-[0.4em] mb-6 uppercase"
            >
              <Typewriter text="// SOBAN ALI" delay={100} onComplete={() => setHeroComplete(true)} />
            </motion.div>

            <AnimatePresence>
              {heroComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="text-[clamp(4rem,10vw,9rem)] font-display font-black text-text-hi uppercase tracking-tighter leading-[0.85] mb-8">
                    SOBAN ALI
                  </h1>
                  <p className="font-body text-lg md:text-2xl text-text-lo max-w-2xl mx-auto mb-12 leading-relaxed">
                    AI Engineer · ML Researcher · Full-Stack Builder
                    <br />
                    <span className="text-sm opacity-60 mt-4 block font-mono">
                      Building systems that think — from multi-agent negotiators to malware classifiers.
                    </span>
                  </p>

                  <motion.a
                    href="#about"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-accent-cyan text-accent-cyan font-mono text-xs uppercase tracking-widest rounded-full hover:bg-accent-cyan hover:text-bg-void transition-all duration-300"
                  >
                    [ Explore Signal ]
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
            <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">Scroll to Decrypt</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-12 bg-linear-to-b from-accent-cyan to-transparent"
            />
          </motion.div>
        </section>

        {/* --- SECTION 02: ORIGIN (About) --- */}
        <section id="about" className="relative min-h-screen py-32 px-6 flex items-center">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              {/* Confusion Matrix Watermark */}
              <div className="absolute -top-20 -left-20 w-64 h-64 opacity-5 pointer-events-none grid grid-cols-8 grid-rows-8 gap-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`bg-accent-cyan ${i % 9 === 0 ? 'opacity-100' : 'opacity-40'}`} />
                ))}
              </div>
              
              <SectionHeader number="02" label="Origin" title="Built to Build" />
              
              <div className="space-y-6 font-body text-lg text-text-lo leading-relaxed">
                <p>
                  CS student at <span className="text-text-hi font-medium">FAST NUCES</span> (Class of 2027), maintaining a <span className="text-accent-cyan">3.69 GPA</span> while shipping real systems. I don't wait for coursework — I build multi-agent LLM pipelines, replicate research papers, and deploy full-stack platforms on AWS.
                </p>
                <p>
                  Schooled at Lahore Grammar School (3A* 1A at A-Levels, 5A* at O-Levels). The discipline stuck. Currently hunting an AI internship where I can apply LLM orchestration and inference optimization at scale.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12">
                <div>
                  <div className="text-3xl font-display font-bold text-text-hi">3.69</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent-vio">Cumulative GPA</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-text-hi">5×</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent-vio">Dean's List</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-text-hi">2027</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent-vio">Graduation</div>
                </div>
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
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan mb-2">Identity Verified</div>
                  <div className="text-2xl font-display font-bold text-text-hi uppercase">Soban Ali</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SECTION 03: ARSENAL (Skills) --- */}
        <section id="skills" className="relative min-h-screen py-32 px-6 bg-bg-deep/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader number="03" label="Arsenal" title="Tools That Ship" className="text-center" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
              {skills.map((skillGroup, idx) => (
                <motion.div
                  key={skillGroup.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-bg-card border border-rule p-8 rounded-xl hover:border-accent-cyan/30 transition-colors group"
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

        {/* --- SECTION 04: DEPLOYMENTS (Projects) --- */}
        <section id="projects" className="relative min-h-screen py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader number="04" label="Deployments" title="Field Operations" />
            
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
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-8">End of Deployment Log</p>
              <a href="https://github.com/sobanali256" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent-cyan hover:underline font-mono text-xs uppercase tracking-widest">
                View Full Repository <Github size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 05: MILESTONES (Achievements) --- */}
        <section id="achievements" className="relative min-h-screen py-32 px-6 bg-bg-deep/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader number="05" label="Milestones" title="Track Record" className="text-center" />
            
            <div className="relative mt-20 max-w-3xl mx-auto">
              {/* Training Curve Timeline Line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-rule -translate-x-1/2 hidden md:block" />
              <motion.div 
                style={{ scaleY: scrollYProgress }}
                className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-accent-cyan -translate-x-1/2 origin-top hidden md:block z-0"
              />
              
              <div className="space-y-16">
                {milestones.map((milestone, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                  >
                    {/* Node */}
                    <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-accent-cyan border-4 border-bg-void -translate-x-1/2 z-10 hidden md:block" />
                    
                    <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="font-mono text-xs text-accent-vio mb-2">{milestone.year}</div>
                      <h3 className="text-2xl font-display font-bold text-text-hi mb-1 uppercase tracking-tight">{milestone.title}</h3>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan mb-4 opacity-70">{milestone.subtitle}</div>
                      <p className="font-body text-sm text-text-lo leading-relaxed">{milestone.description}</p>
                    </div>
                    <div className="hidden md:block w-1/2" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 06: TRANSMISSION (Contact) --- */}
        <section id="contact" className="relative min-h-screen py-32 px-6 flex items-center">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <SectionHeader number="06" label="Transmission" title="Open Channel" />
              <p className="font-body text-lg text-text-lo leading-relaxed mb-12 max-w-md">
                AI internship? Research collaboration? Interesting problem? Signal me. I read every message. I respond to the ones worth responding to.
              </p>

              <div className="space-y-8">
                <a href="mailto:sobanali256@gmail.com" className="flex items-center gap-6 group">
                  <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center group-hover:border-accent-cyan transition-colors">
                    <Mail size={20} className="text-text-lo group-hover:text-accent-cyan transition-colors" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">Email</div>
                    <div className="text-text-hi font-mono">sobanali256@gmail.com</div>
                  </div>
                </a>
                <a href="https://linkedin.com/in/sobanali256" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                  <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center group-hover:border-accent-cyan transition-colors">
                    <Linkedin size={20} className="text-text-lo group-hover:text-accent-cyan transition-colors" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">LinkedIn</div>
                    <div className="text-text-hi font-mono">linkedin.com/in/sobanali256</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-bg-card border border-rule p-10 rounded-2xl relative overflow-hidden">
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
                        Encrypting...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 size={18} />
                        Signal Delivered
                      </>
                    ) : (
                      'Transmit Signal'
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-8 left-0 w-full text-center font-mono text-[10px] text-accent-emerald uppercase tracking-widest"
                      >
                        Transmission successful. Channel remains open.
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
              © 2026 Soban Ali // Classified Intelligence Dossier
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
