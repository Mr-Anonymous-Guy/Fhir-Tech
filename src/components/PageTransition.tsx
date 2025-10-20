import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    rotateX: -10,
    transformOrigin: 'center top'
  },
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transformOrigin: 'center top'
  },
  out: {
    opacity: 0,
    scale: 1.05,
    y: -20,
    rotateX: 10,
    transformOrigin: 'center bottom'
  }
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
  duration: 0.6
};

// Unwrapping animation variants
const unwrapVariants = {
  initial: {
    opacity: 0,
    clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    scale: 0.98
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
        ease: [0.25, 0.1, 0.25, 1]
      },
      opacity: {
        duration: 0.3,
        delay: 0.1
      },
      scale: {
        duration: 0.4,
        delay: 0.2
      }
    }
  },
  exit: {
    opacity: 0,
    clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
    scale: 1.02,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Staggered children animation
const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const childVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={unwrapVariants}
        className="min-h-full"
      >
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Higher-order component for individual page elements
export const AnimatedSection: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      variants={childVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Special animation for cards and dashboard elements
export const AnimatedCard: React.FC<{ 
  children: ReactNode; 
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const cardVariants = {
    initial: {
      opacity: 0,
      scale: 0.9,
      rotateY: -10,
      z: -50
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
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      rotateY: 10,
      z: -25,
      transition: {
        duration: 0.3
      }
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
        damping: 25
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Floating animation for dashboard tags/badges
export const FloatingBadge: React.FC<{ 
  children: ReactNode; 
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const floatingVariants = {
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay
      }
    }
  };

  return (
    <motion.div
      variants={floatingVariants}
      animate="animate"
      className={className}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;