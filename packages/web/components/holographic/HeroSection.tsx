'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 holo-gradient opacity-20" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Holographic Guardian Shield */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="mb-8 flex justify-center"
        >
          <div className="relative w-64 h-64">
            <Image
              src="/hero/guardian-shield.svg"
              alt="Scam Dunk Holographic Guardian Shield"
              width={256}
              height={256}
              priority
              className="drop-shadow-2xl"
            />
            {/* Glow ring animation */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-30 animate-ping" />
          </div>
        </motion.div>

        {/* Main heading with holographic text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          <span className="holo-text">Before investing,</span>
          <br />
          <span className="text-white">Use Scam Dunk</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          AI-powered protection with our 4-test verification system.
          <br />
          <span className="text-cyan-400">Shield yourself from investment scams.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/scan">
            <button className="holo-button text-lg px-8 py-4 min-w-[200px]">
              Start Protection
              <span className="ml-2">→</span>
            </button>
          </Link>
          <Link href="/register">
            <button className="glass-card px-8 py-4 text-lg font-semibold text-cyan-400 border-cyan-400 hover:bg-cyan-400/10 transition-all min-w-[200px]">
              Create Account
            </button>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-400">Bank-grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-gray-400">95% Detection Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-gray-400">24/7 Protection</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-24 fill-current text-gray-900/50">
          <path d="M0,64 C360,96 720,32 1440,64 L1440,120 L0,120 Z">
            <animate
              attributeName="d"
              values="M0,64 C360,96 720,32 1440,64 L1440,120 L0,120 Z;
                      M0,64 C360,32 720,96 1440,64 L1440,120 L0,120 Z;
                      M0,64 C360,96 720,32 1440,64 L1440,120 L0,120 Z"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
    </section>
  )
}