'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/GameStore';
import { completeExerciseAction } from '@/app/actions/progress.actions';

export default function ProgressTracker() {
    const isCompleted = useGameStore(state => state.isCompleted);
    const exerciseId = useGameStore(state => state.exerciseId);
    const errorCount = useGameStore(state => state.errorCount);
    const hasTracked = useRef(false);

    useEffect(() => {
        // Reset tracker when a new exercise starts
        if (!isCompleted) {
            hasTracked.current = false;
            return;
        }

        if (!exerciseId || hasTracked.current) return;

        hasTracked.current = true;

        // quality 5 = perfeito, 4 = bom, 3 = com erros
        const quality = errorCount === 0 ? 5 : errorCount <= 2 ? 4 : 3;
        completeExerciseAction(exerciseId, quality);
    }, [isCompleted, exerciseId, errorCount]);

    return null;
}
