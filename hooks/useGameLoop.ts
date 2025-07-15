import { useEffect, useRef } from 'react';
import { useEmpireStore } from '../src/store/empireStore';

interface UseGameLoopOptions {
  fps?: number;
  paused?: boolean;
}

export function useGameLoop(
  callback: (deltaTime: number) => void,
  options: UseGameLoopOptions = {}
) {
  const { fps = 60, paused = false } = options;
  const callbackRef = useRef(callback);
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (paused) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      return;
    }

    const targetFrameTime = 1000 / fps;
    let accumulator = 0;

    const gameLoop = (currentTime: number) => {
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      accumulator += deltaTime;

      while (accumulator >= targetFrameTime) {
        callbackRef.current(targetFrameTime);
        accumulator -= targetFrameTime;
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [fps, paused]);
}

export function useGameTime() {
  const isPaused = useEmpireStore((state: any) => state.isPaused);
  const gameSpeed = useEmpireStore((state: any) => state.gameSpeed);
  const currentTime = useEmpireStore((state: any) => state.currentTime);

  useGameLoop(
    (deltaTime) => {
      if (!isPaused) {
        const newTime = new Date(
          currentTime.getTime() + deltaTime * gameSpeed
        );
        useEmpireStore.setState({ currentTime: newTime });
      }
    },
    { paused: isPaused }
  );

  return { currentTime, isPaused, gameSpeed };
}