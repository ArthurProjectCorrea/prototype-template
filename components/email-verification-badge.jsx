'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function EmailVerificationBadge({ confirmedAt }) {
  const isVerified = !!confirmedAt;

  if (isVerified) {
    return (
      <Badge variant="default" className="gap-1">
        <Check className="size-3" />
        Verificado
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <X className="size-3" />
      Não verificado
    </Badge>
  );
}
