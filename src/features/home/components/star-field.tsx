import "./star-field.css";
import * as motion from "motion/react-client";

export default function StarField() {
  const stars = Array.from({ length: 200 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((_, i) => (
        <motion.span
          key={i}
          className="star"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{
            delay: i * 0.05,
            duration: 0.6,
            ease: "easeOut",
          }}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}