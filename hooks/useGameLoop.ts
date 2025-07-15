import { useEffect, useRef } from 'react';
import { useGameStore } from '../utils/store';

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
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>();

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
  const isPaused = useGameStore((state) => state.isPaused);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const currentTime = useGameStore((state) => state.currentTime);

  useGameLoop(
    (deltaTime) => {
      if (!isPaused) {
        const newTime = new Date(
          currentTime.getTime() + deltaTime * gameSpeed
        );
        useGameStore.setState({ currentTime: newTime });
      }
    },
    { paused: isPaused }
  );

  return { currentTime, isPaused, gameSpeed };
}