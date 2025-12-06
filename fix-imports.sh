#!/bin/bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
api_src="$repo_root/packages/api/src"

cd "$api_src"

if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

find . -name "*.ts" -type f -exec "${SED_INPLACE[@]}" "s|from '@scam-dunk/shared'|from '../shared/types'|g" {} \;
find . -name "*.ts" -type f -exec "${SED_INPLACE[@]}" "s|from '@scam-dunk/shared';|from '../shared/types';|g" {} \;

"${SED_INPLACE[@]}" "s|from '../shared/types'|from '../../shared/types'|g" auth/strategies/jwt.strategy.ts

echo "Fixed all @scam-dunk/shared imports"
