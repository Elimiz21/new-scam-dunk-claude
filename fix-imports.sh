#!/bin/bash

# Fix all @scam-dunk/shared imports in API service
cd /Users/elimizroch/ai_projects/new-scam-dunk-claude/packages/api/src

# Replace imports in all TypeScript files
find . -name "*.ts" -type f -exec sed -i '' "s|from '@scam-dunk/shared'|from '../shared/types'|g" {} \;
find . -name "*.ts" -type f -exec sed -i '' "s|from '@scam-dunk/shared';|from '../shared/types';|g" {} \;

# Fix relative paths for nested directories
sed -i '' "s|from '../shared/types'|from '../../shared/types'|g" auth/strategies/jwt.strategy.ts

echo "Fixed all @scam-dunk/shared imports"