import React, { memo, useCallback, useMemo } from 'react';
import { CheckboxButton } from '@librechat/client';
import { ArtifactModes } from 'librechat-data-provider';
import { WandSparkles } from 'lucide-react';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';

interface ArtifactsToggleState {
  enabled: boolean;
  mode: string;
}

function Artifacts() {
  const localize = useLocalize();
  const { artifacts } = useBadgeRowContext();
  const { toggleState, debouncedChange, isPinned } = artifacts;

  const currentState = useMemo<ArtifactsToggleState>(() => {
    if (typeof toggleState === 'string' && toggleState) {
      return { enabled: true, mode: toggleState };
    }
    return { enabled: false, mode: '' };
  }, [toggleState]);

  const isEnabled = currentState.enabled;

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      debouncedChange({ value: '' });
    } else {
      // Always use SHADCNUI mode when enabling artifacts
      debouncedChange({ value: ArtifactModes.SHADCNUI });
    }
  }, [isEnabled, debouncedChange]);

  if (!isEnabled && !isPinned) {
    return null;
  }

  return (
    <CheckboxButton
      className="max-w-fit"
      checked={isEnabled}
      setValue={handleToggle}
      label={localize('com_ui_artifacts')}
      isCheckedClassName="border-amber-600/40 bg-amber-500/10 hover:bg-amber-700/10"
      icon={<WandSparkles className="icon-md" />}
    />
  );
}

export default memo(Artifacts);
