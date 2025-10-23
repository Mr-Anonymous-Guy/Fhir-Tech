import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/* ─────────────────────────────
   FADE VARIANTS
────────────────────────────── */
const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/* ─────────────────────────────
   UNWRAP VARIANTS (for fancy page entry)
────────────────────────────── */
const unwrapVariants: Variants = {
  initial: {
    opacity: 0,
    clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      clipPath: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
      opacity: {
        duration: 0.3,
        delay: 0.1,
      },
      scale: {
        duration: 0.4,
        delay: 0.2,
      },
    },
  },
  exit: {
    opacity: 0,
    clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
    scale: 1.02,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

/* ─────────────────────────────
   STAGGERED CONTAINER
────────────────────────────── */
const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/* ─────────────────────────────
   CHILD ELEMENT VARIANTS
────────────────────────────── */
const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
};

/* ─────────────────────────────
   PAGE TRANSITION WRAPPER
────────────────────────────── */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeVariants}
        className="min-h-full overflow-hidden"
      >
        <motion.div variants={containerVariants}>{children}</motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────
   ANIMATED SECTION
────────────────────────────── */
export const AnimatedSection: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div variants={childVariants} className={className}>
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────
   ANIMATED CARD (for dashboard)
────────────────────────────── */
export const AnimatedCard: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const cardVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.9,
      rotateY: -10,
      z: -50,
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: delay,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      rotateY: 10,
      z: -25,
      transition: {
        duration: 0.3,
      },
    },
    hover: {
      scale: 1.02,
      y: -2,
      rotateY: 2,
      z: 10,
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────
   FLOATING BADGE
────────────────────────────── */
export const FloatingBadge: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const floatingVariants: Variants = {
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay,
      },
    },
  };

  return (
    <motion.div
      variants={floatingVariants}
      animate="animate"
      className={className}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
