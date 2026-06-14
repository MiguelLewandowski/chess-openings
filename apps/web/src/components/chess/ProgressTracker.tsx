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

        // quality 5 = perfect, 4 = good, 3 = with errors
        const quality = errorCount === 0 ? 5 : errorCount <= 2 ? 4 : 3;
        completeExerciseAction(exerciseId, quality);
    }, [status, exerciseId, errorCount]);

    return null;
}
