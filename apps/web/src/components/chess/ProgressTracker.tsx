'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/GameStore';
import { completeExerciseAction } from '@/app/actions/progress.actions';

// Records a finished practice run. It only reports what happened (mistakes and hints): the
// SM-2 quality and the XP are the domain's call, and the answer comes back for the result
// screen. Watching the demonstration records nothing.
export default function ProgressTracker() {
    const status = useGameStore(state => state.status);
    const mode = useGameStore(state => state.mode);
    const exerciseId = useGameStore(state => state.exerciseId);
    const hasTracked = useRef(false);

    useEffect(() => {
        // Reset tracker when a new exercise starts
        if (status !== 'completed') {
            hasTracked.current = false;
            return;
        }

        if (mode !== 'practice' || !exerciseId || hasTracked.current) return;
        hasTracked.current = true;

        const { mistakes, pieceHints, revealedMoves, setCompletion } = useGameStore.getState();
        completeExerciseAction(exerciseId, { mistakes, pieceHints, revealedMoves }).then((result) => {
            // Ignore a late answer if the student already moved on to another run.
            if (result && useGameStore.getState().exerciseId === exerciseId) setCompletion(result);
        });
    }, [status, mode, exerciseId]);

    return null;
}
