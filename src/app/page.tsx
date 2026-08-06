'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { Command, Users, Zap, ArrowRight, Brain, Target, Layers, Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const router = useRouter();
  const { loginDemo, profile } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const t = useTranslations('LandingPage');

  const DEMO_ACCOUNTS = [
    { role: 'founder' as UserRole, label: t('demoFounder'), icon: <Command size={24} />, color: 'from-emerald-500/20 to-emerald-900/5', borderColor: 'border-emerald-500/30', accent: 'text-emerald-400', desc: t('accessFounder') },
    { role: 'investor' as UserRole, label: t('demoInvestor'), icon: <Users size={24} />, color: 'from-blue-500/20 to-blue-900/5', borderColor: 'border-blue-500/30', accent: 'text-blue-400', desc: t('accessInvestor') },
    { role: 'admin' as UserRole, label: t('demoAdmin'), icon: <Zap size={24} />, color: 'from-purple-500/20 to-purple-900/5', borderColor: 'border-purple-500/30', accent: 'text-purple-400', desc: t('accessAdmin') },
  ];

  const redirectByProfile = (p: { role: UserRole; linkedStartupId?: string | null }) => {
    if (p.role === 'admin') router.push('/admin');
    else if (p.role === 'investor') router.push('/investor');
    else {
      if (p.role === 'founder' && !p.linkedStartupId) {
        router.push('/founder/onboarding');
      } else {
        router.push('/founder');
      }
    }
  };

  useEffect(() => {
    if (profile) {
      redirectByProfile(profile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDemoLogin = (role: UserRole) => {
    setLoadingRole(role);
    loginDemo(role);
    toast.success(t('loadingDemo'));
    setTimeout(() => {
      redirectByProfile({ role, linkedStartupId: 'demo_startup' });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden font-sans">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[20%] rounded-full bg-purple-900/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        
        {/* Header / Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-16 md:mb-24 justify-center"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
            <Command size={22} className="text-white" />
          </div>
          <div>
            <div className="font-space font-bold text-xl tracking-tight">Founder OS</div>
            <div className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">by UNTITLED</div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="text-center max-w-4xl mx-auto mb-24 md:mb-32"
        >
          <motion.h1 variants={itemVariants} className="font-space text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-8">
            {t('titlePart1')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">{t('titlePart2')}</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-16">
            {t('subtitle')}
          </motion.p>

          {/* Access Portals */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {DEMO_ACCOUNTS.map((account) => (
              <motion.button
                key={account.role}
                variants={itemVariants}
                onClick={() => handleDemoLogin(account.role)}
                disabled={loadingRole !== null}
                className={`group relative p-6 rounded-2xl bg-gradient-to-b ${account.color} border ${account.borderColor} backdrop-blur-xl overflow-hidden transition-all hover:-translate-y-1`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 ${account.accent}`}>
                    {loadingRole === account.role ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      account.icon
                    )}
                  </div>
                  <div className="font-space text-xl font-semibold mb-2">{account.label}</div>
                  <div className="text-sm text-zinc-400 mb-8 flex-grow">
                    {account.desc}
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-semibold ${account.accent}`}>
                    <span>{t('enterSystem')}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* What is Founder OS / The Problem we solve */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="font-space text-3xl md:text-5xl font-bold mb-6">{t('endOfChaosTitle')}</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              {t('endOfChaosDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Layers size={24} />, title: t('feature1Title'), desc: t('feature1Desc') },
              { icon: <Target size={24} />, title: t('feature2Title'), desc: t('feature2Desc') },
              { icon: <Activity size={24} />, title: t('feature3Title'), desc: t('feature3Desc') }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-300 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* For Founders */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-32 flex flex-col md:flex-row items-center gap-12 lg:gap-24"
        >
          <div className="flex-1 space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold tracking-wide">
              {t('forFounders')}
            </div>
            <h2 className="font-space text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t('founderTitle')}
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {t('founderDesc')}
            </p>
            <ul className="space-y-4">
              {[
                t('founderList1'),
                t('founderList2'),
                t('founderList3'),
                t('founderList4')
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-zinc-300 font-medium">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-900/20 to-zinc-900 border border-white/5 overflow-hidden relative flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <Brain size={120} className="text-emerald-500/10 absolute" />
            <div className="absolute inset-10 border border-white/5 bg-black/40 backdrop-blur-md rounded-2xl flex flex-col p-6 gap-4">
              <div className="w-1/3 h-4 bg-white/10 rounded-full" />
              <div className="w-full flex-1 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
                 <Activity className="text-emerald-500/40" size={32} />
              </div>
              <div className="w-2/3 h-20 bg-white/5 rounded-xl border border-white/5" />
            </div>
          </div>
        </motion.div>

        {/* For Investors */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-32 flex flex-col-reverse md:flex-row items-center gap-12 lg:gap-24"
        >
          <div className="flex-1 w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-bl from-blue-900/20 to-zinc-900 border border-white/5 overflow-hidden relative flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <ShieldCheck size={120} className="text-blue-500/10 absolute" />
            <div className="absolute inset-10 border border-white/5 bg-black/40 backdrop-blur-md rounded-2xl flex flex-col p-6 gap-4">
              <div className="flex justify-between">
                <div className="w-1/4 h-8 bg-blue-500/20 rounded-lg" />
                <div className="w-1/4 h-8 bg-blue-500/20 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white/5 rounded-xl border border-white/5 flex flex-col p-4 justify-between">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="w-full h-2 bg-white/10 rounded-full" />
                </div>
                <div className="bg-white/5 rounded-xl border border-white/5 flex flex-col p-4 justify-between">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="w-full h-2 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide">
              {t('forInvestors')}
            </div>
            <h2 className="font-space text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t('investorTitle')}
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {t('investorDesc')}
            </p>
            <ul className="space-y-4">
              {[
                t('investorList1'),
                t('investorList2'),
                t('investorList3'),
                t('investorList4')
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-zinc-300 font-medium">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-12 mt-24 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm gap-4">
          <div className="flex items-center gap-2">
            <Command size={18} className="text-zinc-400" />
            <span className="font-space font-semibold text-zinc-300">Founder OS</span>
          </div>
          <p>{t('footerRights')}</p>
        </footer>

      </div>
    </div>
  );
}
