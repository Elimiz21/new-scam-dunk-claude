#!/bin/bash

# Fix all animation variants in TypeScript files
find /Users/elimizroch/ai_projects/new-scam-dunk-claude/packages/web -name "*.tsx" -type f -exec grep -l "fadeInUp\|fadeIn\|slideIn" {} \; | while read file; do
  echo "Fixing animations in: $file"
  
  # Fix fadeInUp pattern
  sed -i '' 's/const fadeInUp = {[^}]*initial: { opacity: 0, y: 20 },[^}]*animate: { opacity: 1, y: 0 },[^}]*transition: { duration: [0-9.]* }[^}]*}/const fadeInUp = {\
  initial: { opacity: 0, y: 20 },\
  animate: { \
    opacity: 1, \
    y: 0,\
    transition: { duration: 0.6 }\
  }\
}/g' "$file"

  # Fix fadeIn pattern
  sed -i '' 's/const fadeIn = {[^}]*initial: { opacity: 0 },[^}]*animate: { opacity: 1 },[^}]*transition: { duration: [0-9.]* }[^}]*}/const fadeIn = {\
  initial: { opacity: 0 },\
  animate: { \
    opacity: 1,\
    transition: { duration: 0.6 }\
  }\
}/g' "$file"

done

echo "Animation fixes complete"