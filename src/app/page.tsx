'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, TrendingUp, Users, Command, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-hidden font-sans">
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
              <Command size={16} className="text-white" />
            </div>
            <span className="font-space font-bold tracking-tight text-lg">Founder OS</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/login" className="btn-primary h-9 px-5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center justify-center">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 relative">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 blur-[120px] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-emerald-500/20 pointer-events-none rounded-full" />
        
        <div className="max-w-[1200px] mx-auto">
          {/* Hero Section */}
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="flex flex-col items-center text-center max-w-[800px] mx-auto pt-10 lg:pt-20"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <Sparkles size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#a1a1aa]">OS 2.0 Now Available</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-space font-bold text-5xl md:text-7xl leading-[1.1] tracking-tight mb-6">
              Turn Chaos<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#71717a]"> Into System.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-[#a1a1aa] text-lg md:text-xl leading-relaxed mb-10 max-w-[600px]">
              The definitive operating system for startups. From inception to investment, meticulously engineered to accelerate founders and de-risk investors.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/auth/login" className="w-full sm:w-auto h-12 px-8 rounded-full flex items-center justify-center gap-2 font-medium bg-white text-black hover:scale-105 transition-transform">
                Start Building <ArrowRight size={18} />
              </Link>
              <a href="#features" className="w-full sm:w-auto h-12 px-8 rounded-full flex items-center justify-center gap-2 font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white">
                Learn More
              </a>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            id="features"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32"
          >
            {[
              {
                icon: <Brain size={24} />,
                title: "Intelligence Engine",
                desc: "AI-driven automated pitch deck analysis and dynamic startup scoring.",
                color: "from-blue-500/10 to-transparent",
                iconColor: "text-blue-400"
              },
              {
                icon: <TrendingUp size={24} />,
                title: "Structured Progression",
                desc: "A deterministic, stage-by-stage roadmap from raw idea to funding readiness.",
                color: "from-emerald-500/10 to-transparent",
                iconColor: "text-emerald-400"
              },
              {
                icon: <Users size={24} />,
                title: "Curated Deal Flow",
                desc: "Direct, high-signal connection pipeline between verified founders and top-tier investors.",
                color: "from-purple-500/10 to-transparent",
                iconColor: "text-purple-400"
              }
            ].map((f, i) => (
              <div key={i} className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 overflow-hidden hover:bg-white/[0.08] transition-colors">
                <div className={`absolute inset-0 bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/5 ${f.iconColor}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-space">{f.title}</h3>
                  <p className="text-[#a1a1aa] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Deep Dive Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mt-32 rounded-[40px] bg-white/5 border border-white/10 p-8 md:p-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-space">For Founders</h2>
                <p className="text-[#a1a1aa] text-lg leading-relaxed mb-8">
                  Stop guessing what investors want. Founder OS provides you with the exact framework, tasks, and metrics needed to build a fundable company.
                </p>
                <ul className="space-y-4">
                  {[
                    "Financial modeling templates",
                    "AI Pitch Deck Reviews",
                    "Cap Table Management",
                    "Data Room structuring"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Shield size={12} className="text-emerald-400" />
                      </div>
                      <span className="font-medium text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Abstract UI representation */}
              <div className="relative h-[300px] md:h-[400px] rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="relative z-10 w-4/5 h-3/4 border border-white/10 rounded-2xl bg-white/5 flex flex-col p-5 shadow-2xl backdrop-blur-md">
                  <div className="w-full h-8 border-b border-white/10 mb-5 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                  </div>
                  <div className="flex gap-5 h-full">
                    <div className="w-1/3 h-full rounded-xl bg-white/5 border border-white/5" />
                    <div className="flex-1 flex flex-col gap-5">
                      <div className="h-1/3 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 font-bold font-space text-xl">98% Readiness</span>
                      </div>
                      <div className="flex-1 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2 p-4 justify-end">
                        <div className="w-3/4 h-3 rounded-full bg-white/10" />
                        <div className="w-1/2 h-3 rounded-full bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-black py-12 px-6 mt-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center border border-white/10">
              <Command size={12} className="text-[#a1a1aa]" />
            </div>
            <span className="font-space font-semibold text-[#a1a1aa]">Founder OS</span>
          </div>
          <div className="text-sm text-[#71717a]">
            © {new Date().getFullYear()} UNTITLED Ecosystem. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-[#71717a]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
