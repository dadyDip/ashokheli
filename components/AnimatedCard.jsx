"use client";

import { motion } from "framer-motion";

export function AnimatedCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}
