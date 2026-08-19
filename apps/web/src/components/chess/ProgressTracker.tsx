'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/GameStore';
import { completeExerciseAction } from '@/app/actions/progress.actions';

export default function ProgressTracker() {
    const status = useGameStore(state => state.status);
    const exerciseId = useGameStore(state => state.exerciseId);
    const errorCount = useGameStore(state => state.errorCount);
    const hasTracked = useRef(false);

    useEffect(() => {
        // Reset tracker when a new exercise starts
        if (status !== 'completed') {
            hasTracked.current = false;
            return;
        }

        if (!exerciseId || hasTracked.current) return;

        hasTracked.current = true;

        // Map errors to the SM-2 0-5 quality scale. Anything below 3 is a
        // failure: SM-2 resets repetitions and schedules the card for the next
        // day instead of pushing it 6+ days out, so slips resurface soon.
        //   5 perfect · 4 one slip · 3 minor errors (still a pass)
        //   2 struggled · 1 barely · 0 blackout (fails → review tomorrow)
        const quality = errorCount === 0 ? 5
            : errorCount === 1 ? 4
            : errorCount === 2 ? 3
            : errorCount === 3 ? 2
            : errorCount === 4 ? 1
            : 0;
        completeExerciseAction(exerciseId, quality);
    }, [status, exerciseId, errorCount]);

    return null;
}
