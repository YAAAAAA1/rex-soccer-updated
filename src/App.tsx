/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  AnimatePresence,
  useInView
} from 'motion/react';
import { 
  Trophy, 
  Target, 
  Zap, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Camera,
  LogOut,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot,
  doc,
  setDoc
} from 'firebase/firestore';

// --- Error Boundary ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// --- Firebase Context ---

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false,
  login: async () => {},
  logout: async () => {}
});

export const useFirebase = () => useContext(FirebaseContext);

const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user exists in Firestore, if not create profile
        const userRef = doc(db, 'users', user.uid);
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === "jadovdav@gmail.com" ? 'admin' : 'client',
            lastLogin: serverTimestamp()
          }, { merge: true });
          
          setIsAdmin(user.email === "jadovdav@gmail.com");
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, isAdmin, login, logout: handleLogout }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// --- Components ---

const SplitText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const letters = text.split("");
  return (
    <div className={cn("inline-block overflow-hidden", className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: delay + i * 0.02,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </div>
  );
};


const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, login, logout } = useFirebase();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Locations', href: '#locations' },
    { name: 'Photos', href: '#photos', isPage: true },
    { name: 'The Team', href: '#team', isPage: true },
    { name: 'Merch', href: '#merch', isPage: true },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 transition-all duration-700 px-6 py-8",
      isScrolled ? "bg-zinc-200/80 backdrop-blur-2xl py-5 border-b border-black/5" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img 
            src="https://image2url.com/r2/default/images/1774365037875-84e3c176-201b-4629-9855-649c1718e3b2.png" 
            alt="REX Logo" 
            className="h-8 md:h-10 brightness-0"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 hover:text-navy-900 transition-all"
              onClick={(e) => {
                if (link.isPage) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('changePage', { detail: link.name.toLowerCase().replace(' ', '') }));
                }
              }}
            >
              {link.name}
            </motion.a>
          ))}
          
          <div className="flex items-center gap-6">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black/20" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-black/40">Logged in as</span>
                  <span className="text-[10px] font-bold text-black">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-navy-900"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => login()}
                className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-navy-900 transition-all flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" /> Login
              </button>
            )}

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-black text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all duration-500 shadow-2xl shadow-black/5"
            >
              Book Now
            </motion.button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-black"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-black/5 mt-4 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (link.isPage) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('changePage', { detail: link.name.toLowerCase().replace(' ', '') }));
                    }
                  }}
                  className="text-lg font-bold uppercase tracking-tighter text-black/80"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-black/5">
                {user ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-black">{user.displayName || user.email}</span>
                    <button onClick={() => logout()} className="text-xs font-black uppercase tracking-widest text-navy-900">Logout</button>
                  </div>
                ) : (
                  <button onClick={() => login()} className="text-lg font-bold uppercase tracking-tighter text-black/80">Login</button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-black text-white w-full py-4 rounded-xl font-black uppercase tracking-widest"
              >
                Book Training
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const SectionReveal = ({ children, className }: { children: React.ReactNode, className?: string, key?: React.Key }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Split text transforms - starting with a clear offset so they are fully visible around the ball
  const rexX = useTransform(scrollYProgress, [0, 1], [-300, -700]);
  const soccerX = useTransform(scrollYProgress, [0, 1], [250, 650]);
  const ballRotate = useTransform(scrollYProgress, [0, 1], [0, 720]);
  const ballScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1]);

  return (
    <section ref={containerRef} className="relative h-[150vh] w-full flex items-start justify-center overflow-hidden">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center">
        {/* Background Parallax Image */}
        <motion.div 
          style={{ scale, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-white/90 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000" 
            alt="Soccer Field"
            className="w-full h-full object-cover grayscale opacity-10"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-30 text-center px-6 w-full">
          <motion.div style={{ y, opacity }}>
            {/* Background Collage */}
            <div className="absolute inset-0 z-[-1] opacity-[0.08] grayscale pointer-events-none overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-[110%] h-[110%] -translate-x-5 -translate-y-5">
                <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1518091043644-c1d445bcc97a?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <img src="https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.5em] text-black bg-black/10 px-6 py-3 rounded-full border border-black/20">
                Raza Elite Xperience
              </span>
            </motion.div>
            
            <div className="relative flex items-center justify-center mb-12 h-48 md:h-80">
              {/* R Logo - Background */}
              <motion.div 
                style={{ x: rexX }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute z-11 select-none w-[155px] md:w-[300px] opacity-20 top-11.75 ml-69"
              >
                <img 
                  src="https://image2url.com/r2/default/images/1774365332136-abfdbeec-2f4c-4764-b03d-28d5f258f9d0.png" 
                  alt="R Logo" 
                  className="w-full h-auto brightness-0"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Soccer Ball - Middle */}
              <motion.div 
                style={{ rotate: ballRotate, scale: ballScale }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
                className="hidden relative z-20 w-32 h-32 md:w-64 md:h-64 mx-16 top-5"
              >
                <div className="absolute inset-0 bg-navy-900/10 blur-3xl rounded-full" />
                <img 
                  src="https://pngimg.com/uploads/football/football_PNG52789.png" 
                  alt="Soccer Ball"
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_50px_rgba(0,8,20,0.1)]"
                  referrerPolicy="no-referrer"
                />
              </motion.div> 

              {/* X Logo - Foreground */}
              <motion.div 
                style={{ x: soccerX }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute z-10 select-none w-[100px] md:w-[300px] top-20 -ml-60"
              >
                <img 
                  src="https://image2url.com/r2/default/images/1774365460719-25193da0-b4be-4342-bcd6-7d809edf0367.png" 
                  alt="X Logo" 
                  className="w-full h-auto brightness-0"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

            {/* New Main Title */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="max-w-2xl mx-auto text-black/90 text-sm md:text-xl font-black mb-2 uppercase tracking-[0.2em]"
            >
              REX SOCCER
            </motion.p>

            {/* Your Original Subtext */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-2xl mx-auto text-black/40 text-[10px] md:text-xs font-black mb-12 leading-relaxed uppercase tracking-[0.4em]"
            >
              FIXING THE U.S YOUTH SOCCER SYSTEM.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-navy-900 text-white px-12 py-5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-black/10"
              >
                Book Training
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'vision' }))}
                className="border border-black/10 px-12 py-5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all text-black"
              >
                Our Mission <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-navy-900 to-transparent" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-black/20">Scroll</span>
        </motion.div>
      </div>
    </section>
  );
};

const QuoteSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="h-screen flex items-center justify-center bg-zinc-200 px-6 relative overflow-hidden">
      <motion.div 
        style={{ scale, opacity }}
        className="max-w-5xl text-center"
      >
        <h2 className="text-4xl md:text-7xl font-black leading-tight mb-8 italic text-black">
          "WHEN THE BODY <span className="text-black">STOPS</span>, THE SPIRIT <span className="text-black">TAKES OVER</span>."
        </h2>
        <div className="w-24 h-1 bg-black mx-auto rounded-full" />
        <p className="mt-8 text-black/40 uppercase tracking-[0.5em] text-xs font-black"></p>
      </motion.div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-1 h-32 bg-navy-900" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-32 bg-navy-900" />
      </div>
    </section>
  );
};

const StepSection = () => {
  const steps = [
    {
      id: "01",
      title: "Technical Mastery",
      desc: "Precision ball control and elite technique development.",
      img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "02",
      title: "Tactical Intelligence",
      desc: "Game awareness, positioning, and strategic decision making.",
      img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "03",
      title: "Elite Conditioning",
      desc: "High-performance speed, strength, and agility training.",
      img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <section className="py-20 px-6 bg-zinc-300 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="relative group"
            >
              <div className="relative z-10 bg-gray-200/50 border border-black/5 shadow-sm rounded-[2rem] overflow-hidden p-8 hover:bg-gray-200 hover:shadow-xl transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <span className="text-4xl font-black text-black/10 group-hover:text-navy-900 transition-colors">{step.id}</span>
                  <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight text-black">{step.title}</h3>
                <p className="text-black/40 text-sm leading-relaxed mb-8">{step.desc}</p>
                <div className="aspect-video rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={step.img} alt={step.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MissionSection = () => {
  return (
    <section className="py-32 px-6 bg-zinc-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
            <SectionReveal>
              <span className="text-black font-black uppercase tracking-widest text-xs mb-6 block">Our Mission</span>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] tracking-tighter text-black uppercase">
                Fixing the U.S.<br />Youth System.
              </h2>
              <div className="space-y-8 text-black/60 text-lg font-medium leading-relaxed">
                <p>
                  At REX Soccer, our mission is to bring professional-level training to youth soccer, focusing on the details that make the difference between a good player and an elite one.
                </p>
                <p>
                  We believe that technical mastery is only half the battle. Our philosophy centers on improving "Football IQ"—teaching players how to read the game, anticipate movements, and make split-second decisions under pressure.
                </p>
                <p>
                  Whether it's field player development or specialized goalkeeper training, we foster a culture of discipline and a relentless passion for self-improvement.
                </p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'vision' }))}
                  className="bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl"
                >
                  Learn More
                </motion.button>
              </div>
            </SectionReveal>
          <SectionReveal>
            <div className="aspect-square rounded-[3rem] overflow-hidden grayscale">
              <img 
                src="https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=1000" 
                alt="Mission" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="about" className="relative py-20 px-6 overflow-hidden bg-zinc-300">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <SectionReveal>
              <div ref={ref} className="relative">
                <span className="text-black font-black uppercase tracking-widest text-xs mb-6 block">Coach Raza</span>
                <h2 className="text-5xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter text-black">
                  TRAIN HARD.<br />PLAY SMART.
                </h2>
            <div className="space-y-8 text-black/50 text-lg font-light leading-relaxed max-w-lg">
              <p>
                I'm Raza, founder of REX Soccer. Soccer has been my life since age 4 and has taken me around the world, from NCAA Division 1 soccer to training with the U20 Panama National Team.
              </p>
              <p>
                REX is built to help players improve with intention. Every session is designed to strengthen technique, tactical awareness, speed, conditioning, and discipline.
              </p>
            </div>
            
            <div className="mt-16 flex gap-12">
              <div>
                <span className="block text-5xl font-black text-black mb-1">20+</span>
                <span className="text-[10px] uppercase tracking-widest text-black/30 font-bold">Years Experience</span>
              </div>
              <div>
                <span className="block text-5xl font-black text-black mb-1">Elite</span>
                <span className="text-[10px] uppercase tracking-widest text-black/30 font-bold">Standards</span>
              </div>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal className="relative">
          <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-100 border border-black/5 p-3 shadow-sm">
            <div className="absolute inset-0 bg-gray-200 z-0" />
            <img 
              src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=1000" 
              alt="Coach Raza"
              className="w-full h-full object-cover rounded-[2.5rem] grayscale hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-12 left-12 right-12 z-20">
              <div className="bg-white/80 px-8 py-6 rounded-[2rem] backdrop-blur-3xl border border-black/5 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-2">The Mission</p>
                <p className="text-lg font-medium leading-snug text-black">Unlock your true potential through elite, intentional experience.</p>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const { user, login } = useFirebase();
  const [bookingStatus, setBookingStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

  const handleBook = async (planName: string) => {
    if (!user) {
      await login();
      return;
    }

    setBookingStatus(prev => ({ ...prev, [planName]: 'loading' }));
    try {
      await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        plan: planName,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setBookingStatus(prev => ({ ...prev, [planName]: 'success' }));
      setTimeout(() => setBookingStatus(prev => ({ ...prev, [planName]: 'idle' })), 3000);
    } catch (error) {
      console.error("Booking error:", error);
      setBookingStatus(prev => ({ ...prev, [planName]: 'error' }));
      handleFirestoreError(error, OperationType.WRITE, 'sessions');
    }
  };

  return (
    <section id="pricing" className="relative py-32 px-6 bg-zinc-200">
      <div className="max-w-7xl mx-auto">
            <SectionReveal className="text-center mb-24">
              <span className="text-black font-black uppercase tracking-[0.4em] text-xs mb-6 block">Investment</span>
              <h2 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter text-black">PRICING.</h2>
          <p className="text-black/40 text-lg max-w-2xl mx-auto font-light">
            Elite training for players who are serious about their development. 
            Choose the path that fits your ambition.
          </p>
        </SectionReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              name: "Private",
              price: "55",
              features: ["1-on-1 Attention", "Customized Drills", "Performance Analysis", "Flexible Scheduling"],
              popular: false
            },
            {
              name: "Duo",
              price: "40",
              features: ["2 Players", "Competitive Drills", "Tactical Focus", "Group Synergy"],
              popular: true
            },
            {
              name: "Small Group",
              price: "30",
              note: "each",
              features: ["3-5 Players", "Game Scenarios", "Team Dynamics", "High Intensity"],
              popular: false
            },
            {
              name: "Team Training",
              price: "20",
              note: "each",
              features: ["6-10 Players", "Tactical Intelligence", "Game Scenarios", "Team Chemistry"],
              popular: false
            }
          ].map((plan, i) => (
            <SectionReveal key={i}>
              <div className={cn(
                "relative p-10 rounded-[3rem] transition-all duration-500 group border border-black/5 h-full flex flex-col",
                plan.popular ? "bg-navy-900 text-white shadow-2xl" : "bg-gray-50 hover:bg-gray-100"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest border border-white/10">
                    Most Popular
                  </div>
                )}
                <h3 className={cn("text-2xl font-black mb-2 uppercase tracking-tight", plan.popular ? "text-white" : "text-black")}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black tracking-tighter">${plan.price}</span>
                  <span className={cn("text-sm font-medium opacity-50")}>{plan.note ? `/${plan.note}` : "/session"}</span>
                </div>
                <ul className="space-y-5 mb-10 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium">
                      <div className={cn("w-1.5 h-1.5 rounded-full", plan.popular ? "bg-white" : "bg-black")} />
                      <span className={plan.popular ? "text-white/70" : "text-black/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleBook(plan.name)}
                  disabled={bookingStatus[plan.name] === 'loading' || bookingStatus[plan.name] === 'success'}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2",
                    plan.popular 
                      ? "bg-white text-black hover:bg-gray-100" 
                      : "bg-black text-white hover:bg-zinc-900",
                    (bookingStatus[plan.name] === 'loading' || bookingStatus[plan.name] === 'success') && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {bookingStatus[plan.name] === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : bookingStatus[plan.name] === 'success' ? (
                    "Booked!"
                  ) : (
                    "Book Session"
                  )}
                </button>
              </div>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal>
          <div className="max-w-3xl mx-auto bg-gray-50 border border-black/5 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div>
                  <span className="text-black font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Exclusive Add-on</span>
                  <h3 className="text-3xl font-black tracking-tighter text-black mb-2">PHOTOSHOOT & VIDEO</h3>
                  <p className="text-black/40 font-light">Capture your progress with professional media coverage of your session.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-4xl font-black text-black tracking-tighter">+$30</span>
                    <span className="text-[10px] uppercase tracking-widest text-black/30 font-black">Per Session</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
};

const LocationsSection = () => {
  const locations = [
    {
      id: 1,
      name: "Location 1",
      address: "1585 SW Cashmere Blvd",
      city: "Port St. Lucie, FL 34986",
      img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=1585+SW+Cashmere+Blvd+Port+St.+Lucie+FL+34986"
    },
    {
      id: 2,
      name: "Location 2",
      address: "12151 SW Community Blvd",
      city: "Port St. Lucie, FL 34987",
      img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=12151+SW+Community+Blvd+Port+St.+Lucie+FL+34987"
    }
  ];

  return (
    <section id="locations" className="py-32 px-6 bg-zinc-300 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionReveal className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
          <div>
              <span className="text-black font-black uppercase tracking-[0.4em] text-xs mb-6 block">Where We Train</span>
              <h2 className="text-6xl md:text-9xl font-black leading-[0.85] tracking-tighter text-black">PORT ST.<br />LUCIE.</h2>
          </div>
          <p className="max-w-md text-black/40 text-xl font-light leading-relaxed">
            Availability is open to the needs of the individual. Train at our elite facilities designed for high performance.
          </p>
        </SectionReveal>

        <div className="grid md:grid-cols-2 gap-12">
          {locations.map((loc, i) => (
            <SectionReveal key={loc.id}>
              <div className="group relative h-[600px] rounded-[3rem] overflow-hidden bg-white border border-black/5 p-3 shadow-sm">
                <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden">
                  <img 
                    src={loc.img} 
                    alt={loc.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 opacity-40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12">
                    <span className="text-black font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{loc.name}</span>
                    <h3 className="text-4xl font-black mb-4 tracking-tight text-black">{loc.address}</h3>
                    <p className="text-black/50 mb-10 text-lg font-medium">{loc.city}</p>
                    <a 
                      href={loc.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-4 text-black font-black uppercase tracking-[0.3em] text-[10px] group-hover:text-navy-900 transition-all"
                    >
                      Open in Maps <div className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center group-hover:border-navy-900"><ArrowRight className="w-4 h-4" /></div>
                    </a>
                  </div>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal className="mt-24 bg-gray-100 p-12 rounded-[3rem] border border-black/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <span className="text-black font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Mobile Training</span>
              <h3 className="text-4xl font-black tracking-tighter text-black mb-6 uppercase">We Drive To You.</h3>
              <p className="text-black/60 font-medium leading-relaxed">
                Can't make it to our locations? No problem. We bring the elite training experience to your local field or backyard.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-black/5 min-w-[300px]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-6">Travel Fees</h4>
              <ul className="space-y-4">
                <li className="flex justify-between items-center pb-4 border-b border-black/5">
                  <span className="text-sm font-bold text-black">Under 10 miles</span>
                  <span className="text-lg font-black text-black">FREE</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-black/5">
                  <span className="text-sm font-bold text-black">10 - 20 miles</span>
                  <span className="text-lg font-black text-black">+$15</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-bold text-black">20+ miles</span>
                  <span className="text-lg font-black text-black">+$25</span>
                </li>
              </ul>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'contact_messages');
    }
  };

  return (
    <section id="contact" className="relative py-32 px-6 bg-zinc-200 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24">
          <SectionReveal>
            <span className="text-black font-black uppercase tracking-[0.4em] text-xs mb-6 block">Get Started</span>
            <h2 className="text-6xl md:text-9xl font-black mb-10 leading-[0.85] tracking-tighter text-black">READY TO<br />LEVEL UP?</h2>
            <p className="text-black/40 text-xl font-light mb-12 max-w-md leading-relaxed">
              Take the first step towards elite performance. Contact us to schedule your first session or ask any questions.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-navy-900 transition-colors duration-500">
                  <Mail className="w-6 h-6 text-black group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Email Us</p>
                  <p className="text-xl font-bold text-black">info.rexsoccer@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-navy-900 transition-colors duration-500">
                  <Instagram className="w-6 h-6 text-black group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Follow Us</p>
                  <p className="text-xl font-bold text-black">@rex.soccer</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-navy-900 transition-colors duration-500">
                  <Facebook className="w-6 h-6 text-black group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Facebook</p>
                  <p className="text-xl font-bold text-black">REX Soccer</p>
                </div>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal>
            <form onSubmit={handleSubmit} className="bg-gray-50 p-12 rounded-[3rem] border border-black/5 relative z-10 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-navy-900 transition-all placeholder:text-black/10 text-black"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-navy-900 transition-all placeholder:text-black/10 text-black"
                  />
                </div>
              </div>
              <div className="space-y-3 mb-10">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Your Message</label>
                <textarea 
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us about your goals..."
                  className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-navy-900 transition-all resize-none placeholder:text-black/10 text-black"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={cn(
                  "w-full py-6 bg-navy-900 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-navy-800 transition-all duration-500 shadow-2xl shadow-black/5 flex items-center justify-center gap-3",
                  (status === 'loading' || status === 'success') && "opacity-70 cursor-not-allowed"
                )}
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'success' ? (
                  "Message Sent!"
                ) : (
                  "Send Message"
                )}
              </button>
              {status === 'error' && (
                <p className="mt-4 text-center text-xs font-bold text-red-500 uppercase tracking-widest">
                  Error sending message. Please try again.
                </p>
              )}
            </form>
          </SectionReveal>
        </div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute bottom-0 right-0 text-[20rem] font-black text-black/[0.02] select-none pointer-events-none uppercase leading-none translate-y-1/2">
        ELITE
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-32 px-6 border-t border-black/5 bg-zinc-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src="https://image2url.com/r2/default/images/1774365037875-84e3c176-201b-4629-9855-649c1718e3b2.png" 
                alt="REX Logo" 
                className="h-10 md:h-12 brightness-0"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-black/30 text-lg font-light max-w-sm leading-relaxed">
              Elite soccer training for the next generation of athletes. 
              Built on discipline, technique, and tactical intelligence.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8">Navigation</h4>
            <ul className="space-y-4">
              {["About", "Training", "Pricing", "Locations", "Contact"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-sm text-black/40 hover:text-navy-900 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8">Social</h4>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/rex.soccer" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center hover:bg-navy-900 transition-all group">
                <Instagram className="w-5 h-5 text-black/40 group-hover:text-white" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61578792965551" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center hover:bg-navy-900 transition-all group">
                <Facebook className="w-5 h-5 text-black/40 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-black/20 text-[10px] uppercase tracking-[0.3em]">© 2025 REX Soccer Training. All rights reserved.</p>
          <div className="flex gap-12">
            <a href="#" className="text-black/20 text-[10px] uppercase tracking-[0.3em] hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-black/20 text-[10px] uppercase tracking-[0.3em] hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- New Pages ---

const PhotosPage = ({ onBack }: { onBack: () => void, key?: React.Key }) => {
  const photos = [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560272564-c83d66b1ad12?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518091043644-c1d445bcc97a?auto=format&fit=crop&q=80&w=800",
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-200 pt-40 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-navy-900 transition-all">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>
        <h2 className="text-6xl md:text-9xl font-black mb-16 tracking-tighter text-black uppercase">Photos.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((src, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="aspect-square rounded-[2rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-black/5"
            >
              <img src={src} alt={`Soccer ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const TeamPage = ({ onBack }: { onBack: () => void, key?: React.Key }) => {
  const team = [
    { name: "Raza", role: "Founder & Head Coach", bio: "Former NCAA D1 player with international experience.", img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800" },
    { name: "Sarah Chen", role: "CEO", bio: "Strategic lead focusing on REX's expansion and vision.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" },
    { name: "Marcus Johnson", role: "Technical Director", bio: "Specialist in youth development and tactical analysis.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800" },
    { name: "Elena Rodriguez", role: "Goalkeeper Coach", bio: "Expert in shot-stopping and distribution techniques.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-300 pt-40 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-navy-900 transition-all">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>
        <h2 className="text-6xl md:text-9xl font-black mb-16 tracking-tighter text-black uppercase">The Team.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-100 rounded-[3rem] p-8 border border-black/5 group hover:bg-zinc-50 hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-8 grayscale group-hover:grayscale-0 transition-all duration-700">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2">{member.name}</h3>
              <p className="text-navy-900 text-[10px] font-black uppercase tracking-widest mb-4">{member.role}</p>
              <p className="text-black/40 text-sm font-medium leading-relaxed">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const VisionPage = ({ onBack }: { onBack: () => void, key?: React.Key }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-200 pt-40 pb-20 px-6 relative overflow-hidden"
    >
      {/* 3D Model Background - Absolute and Interactive */}
      <div className="absolute top-[-25%] left-[75%] -translate-x-1/2 w-[160vw] h-[160vh] opacity-45 z-0">
        <div className="w-full h-full">
          <iframe 
            title="Training center" 
            frameBorder="0" 
            allowFullScreen 
            allow="autoplay; fullscreen; xr-spatial-tracking" 
            src="https://sketchfab.com/models/8688a932284747d0a3ddf4737c23bc86/embed?autostart=1&transparent=1&ui_controls=0&ui_infos=0&scrollwheel=0"
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-navy-900 transition-all">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>
        <h2 className="text-6xl md:text-9xl font-black mb-16 tracking-tighter text-black uppercase">Vision.</h2>
        
        <div className="max-w-3xl space-y-12">
          <SectionReveal>
            <h3 className="text-3xl font-black text-black mb-6 uppercase">The Future of REX.</h3>
            <p className="text-black/60 text-xl font-medium leading-relaxed">
              Our vision is to become the premier destination for youth soccer development in the United States. We aren't just training players; we are building a community of elite athletes.
            </p>
          </SectionReveal>
          <SectionReveal>
            <h3 className="text-3xl font-black text-black mb-6 uppercase">Expansion & Facilities.</h3>
            <p className="text-black/60 text-xl font-medium leading-relaxed">
              In the coming years, REX Soccer aims to open a state-of-the-art training facility, equipped with the latest technology in performance analysis and recovery. We plan to expand our reach across Florida and eventually nationwide.
            </p>
          </SectionReveal>
          <SectionReveal>
            <h3 className="text-3xl font-black text-black mb-6 uppercase">Pro Pathway.</h3>
            <p className="text-black/60 text-xl font-medium leading-relaxed">
              We are committed to creating direct pathways for our players to reach professional levels, attracting scouts and professional partners who recognize the REX standard of excellence.
            </p>
          </SectionReveal>
        </div>
      </div>
    </motion.div>
  );
};

const MerchPage = ({ onBack }: { onBack: () => void, key?: React.Key }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-300 flex items-center justify-center px-6"
    >
      <div className="text-center">
        <button onClick={onBack} className="mb-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-navy-900 transition-all">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>
        <h2 className="text-6xl md:text-9xl font-black tracking-tighter text-black uppercase mb-4">Coming Soon.</h2>
        <p className="text-navy-900 font-black uppercase tracking-[0.4em] text-xs">REX Soccer Merch Store</p>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'photos' | 'theteam' | 'vision' | 'merch'>('home');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    
    const handlePageChange = (e: any) => {
      setCurrentPage(e.detail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    window.addEventListener('changePage', handlePageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('changePage', handlePageChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <div className="relative">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-zinc-200 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <img 
                    src="https://image2url.com/r2/default/images/1774365037875-84e3c176-201b-4629-9855-649c1718e3b2.png" 
                    alt="REX Logo" 
                    className="h-16 md:h-20 mx-auto mb-8 brightness-0"
                    referrerPolicy="no-referrer"
                  />
          <div className="w-48 h-1 bg-black/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="w-full h-full bg-black"
            />
          </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <motion.div 
            className="fixed top-0 left-0 right-0 h-1 bg-accent-bright z-[60] origin-left"
            style={{ scaleX }}
          />

          <Navbar />
          
          <main className="relative">
            <AnimatePresence mode="wait">
              {currentPage === 'home' ? (
                <motion.div key="home">
                  <Hero />
                  
                  {/* Continuous Journey Wrapper */}
                  <div className="relative z-10">
                    <QuoteSection />
                    <StepSection />
                    <MissionSection />
                    <AboutSection />
                    
                    {/* Transition Element */}
                    <div className="h-64 bg-zinc-200 relative">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-[1px] h-full bg-gradient-to-b from-navy-900 to-transparent" />
                      </motion.div>
                    </div>

                    <PricingSection />
                    
                    <div className="h-64 bg-white" />
                    
                    <LocationsSection />
                    
                    <div className="h-64 bg-gray-50" />
                    
                    <ContactSection />
                  </div>
                </motion.div>
              ) : currentPage === 'photos' ? (
                <PhotosPage key="photos" onBack={() => setCurrentPage('home')} />
              ) : currentPage === 'theteam' ? (
                <TeamPage key="team" onBack={() => setCurrentPage('home')} />
              ) : currentPage === 'vision' ? (
                <VisionPage key="vision" onBack={() => setCurrentPage('home')} />
              ) : currentPage === 'merch' ? (
                <MerchPage key="merch" onBack={() => setCurrentPage('home')} />
              ) : null}
            </AnimatePresence>
          </main>

          <Footer />

          {/* Global Background Elements */}
          <div className="fixed inset-0 z-[-1] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[#e5e5e5]" />
            
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-[0.08]" 
              style={{ 
                backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
            />

            <div className="absolute top-0 left-0 w-full h-screen bg-gradient-to-b from-gray-200/50 to-transparent" />
            <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-black/[0.04] blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-[40rem] h-[40rem] bg-gray-400/10 blur-[120px] rounded-full" />
          </div>
        </div>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
