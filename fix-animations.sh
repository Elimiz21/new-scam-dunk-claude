#!/bin/bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
web_dir="$repo_root/packages/web"

if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

find "$web_dir" -name "*.tsx" -type f -exec grep -l "fadeInUp\|fadeIn\|slideIn" {} \; | while read -r file; do
  echo "Fixing animations in: $file"

  # Fix fadeInUp pattern
  "${SED_INPLACE[@]}" 's/const fadeInUp = {[^}]*initial: { opacity: 0, y: 20 },[^}]*animate: { opacity: 1, y: 0 },[^}]*transition: { duration: [0-9.]* }[^}]*}/const fadeInUp = {\
    initial: { opacity: 0, y: 20 },\
    animate: { \
      opacity: 1, \
      y: 0,\
      transition: { duration: 0.6 }\
    }\
  }/g' "$file"

  # Fix fadeIn pattern
  "${SED_INPLACE[@]}" 's/const fadeIn = {[^}]*initial: { opacity: 0 },[^}]*animate: { opacity: 1 },[^}]*transition: { duration: [0-9.]* }[^}]*}/const fadeIn = {\
    initial: { opacity: 0 },\
    animate: { \
      opacity: 1,\
      transition: { duration: 0.6 }\
    }\
  }/g' "$file"

done

echo "Animation fixes complete"
