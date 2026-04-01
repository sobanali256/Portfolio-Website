import React from 'react';
import { motion } from 'motion/react';
import { Github, ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  microAnim?: React.ReactNode;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  tagline,
  description,
  techStack,
  githubUrl,
  liveUrl,
  microAnim,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-bg-card border border-rule p-10 flex flex-col gap-8 transition-all duration-500 hover:bg-accent-cyan/[0.02]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-4xl text-text-hi uppercase tracking-tighter group-hover:text-accent-cyan transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-4">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-text-lo hover:text-accent-cyan transition-colors">
                <Github size={18} />
              </a>
            )}
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-text-lo hover:text-accent-cyan transition-colors">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
        <p className="font-mono text-[10px] text-accent-vio uppercase tracking-[0.3em] opacity-80">
          {tagline}
        </p>
      </div>

      <div className="flex-1">
        <p className="font-body text-base text-text-lo leading-relaxed">
          {description}
        </p>
      </div>

      {/* Micro-interaction area */}
      <div className="h-32 bg-bg-void/50 overflow-hidden flex items-center justify-center border border-rule/30 relative">
        <div className="absolute top-2 left-2 font-mono text-[8px] uppercase tracking-widest opacity-20">Simulation_Active</div>
        {microAnim}
      </div>

      <div className="flex flex-wrap gap-3">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="px-4 py-1.5 border border-rule font-mono text-[9px] uppercase tracking-widest text-text-lo group-hover:border-accent-cyan/30 transition-colors"
          >
            {tech}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
