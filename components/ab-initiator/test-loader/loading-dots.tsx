import { motion } from "framer-motion";

export function LoadingDots() {
  return (
    <span className="inline-flex items-center">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: index * 0.2,
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
} 