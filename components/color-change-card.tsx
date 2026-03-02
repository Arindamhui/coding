"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

// --- Reusable single card ---
export interface ColorChangeCardProps {
  heading: string;
  description: string;
  imgSrc: string;
  href?: string;
  colorOverlay?: string; // e.g. "rgba(0,180,255,0.45)"
  icon?: React.ReactNode;
}

export const ColorChangeCard = ({
  heading,
  description,
  imgSrc,
  href,
  colorOverlay,
  icon,
}: ColorChangeCardProps) => {
  const inner = (
    <motion.div
      transition={{ staggerChildren: 0.035 }}
      whileHover="hover"
      className="group relative h-52 w-full cursor-pointer overflow-hidden rounded-xl"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 saturate-100 transition-all duration-500 group-hover:scale-110 md:saturate-0 md:group-hover:saturate-100"
        style={{
          backgroundImage: `url(${imgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Color overlay tint */}
      {colorOverlay && (
        <div
          className="absolute inset-0 mix-blend-multiply opacity-0 transition-opacity duration-500 group-hover:opacity-80"
          style={{ backgroundColor: colorOverlay }}
        />
      )}
      {/* Dark base overlay for readability */}
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-500 group-hover:bg-black/20" />

      <div className="relative z-20 flex h-full flex-col justify-between p-5 text-slate-300 transition-colors duration-500 group-hover:text-white">
        <div className="flex items-center justify-between">
          {icon && <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">{icon}</div>}
          <FiArrowRight className="ml-auto text-2xl transition-transform duration-500 group-hover:-rotate-45" />
        </div>
        <div>
          <h4>
            {heading.split("").map((letter, index) => (
              <AnimatedLetter letter={letter} key={index} />
            ))}
          </h4>
          <p className="text-sm text-slate-300/80 group-hover:text-white/80 transition-colors mt-1">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
};

// --- Default demo grid (unchanged export) ---
const ColorChangeCards = () => {
  return (
    <div className="p-4 py-12 md:p-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        <ColorChangeCard
          heading="Plan"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          imgSrc="https://images.pexels.com/photos/176342/pexels-photo-176342.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        />
        <ColorChangeCard
          heading="Play"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          imgSrc="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        />
        <ColorChangeCard
          heading="Connect"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          imgSrc="https://images.pexels.com/photos/2422294/pexels-photo-2422294.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        />
        <ColorChangeCard
          heading="Support"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          imgSrc="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        />
      </div>
    </div>
  );
};

// --- AnimatedLetter Helper ---
interface AnimatedLetterProps {
  letter: string;
}

const letterVariants: Variants = {
  hover: {
    y: "-50%",
  },
};

const AnimatedLetter = ({ letter }: AnimatedLetterProps) => {
  return (
    <div className="inline-block h-9 overflow-hidden font-semibold text-3xl">
      <motion.span
        className="flex min-w-1 flex-col"
        style={{ y: "0%" }}
        variants={letterVariants}
        transition={{ duration: 0.5 }}
      >
        <span>{letter}</span>
        <span>{letter}</span>
      </motion.span>
    </div>
  );
};

export default ColorChangeCards;
