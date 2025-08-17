'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface TestCardProps {
  title: string
  description: string
  icon: string
  href: string
  color: string
  index: number
}

export default function TestCard({ title, description, icon, href, color, index }: TestCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Link href={href}>
        <div className="glass-card p-6 h-full scan-card group">
          {/* Test number badge */}
          <div className="absolute top-4 right-4">
            <span className={`badge-verified bg-gradient-to-r ${color} text-xs`}>
              Test {index + 1}
            </span>
          </div>

          {/* Icon with glow effect */}
          <div className="mb-4 relative">
            <div className="w-16 h-16 relative">
              <Image
                src={icon}
                alt={`${title} icon`}
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
              {/* Pulse effect on hover */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full rounded-full animate-ping bg-cyan-400/20" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4">
            {description}
          </p>

          {/* Scan button */}
          <div className="flex items-center text-cyan-400 font-semibold text-sm group-hover:text-cyan-300 transition-colors">
            <span>Run Test</span>
            <svg 
              className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Holographic shimmer effect */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}