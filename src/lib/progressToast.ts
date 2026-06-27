import { toast } from 'sonner';

type Options = {
  /** Rotating loading messages shown while the task runs. */
  steps: string[];
  /** Toast shown on success. */
  success: string;
  /** Fallback error message if the thrown error has no message. */
  errorFallback?: string;
  /** Milliseconds between rotating steps. */
  intervalMs?: number;
};

/**
 * Wraps an async task with a single rolling toast that updates with
 * contextual progress messages, then resolves to success or error.
 *
 * Usage:
 *   await runWithProgress(
 *     () => supabase.functions.invoke('generate-logo', { body }),
 *     {
 *       steps: ['Analyzing your brand…', 'Sketching concepts…', 'Refining details…'],
 *       success: 'Logo generated successfully!',
 *     }
 *   );
 */
export async function runWithProgress<T>(
  task: () => Promise<T>,
  { steps, success, errorFallback = 'Something went wrong', intervalMs = 2500 }: Options,
): Promise<T> {
  const id = toast.loading(steps[0] ?? 'Working…');
  let i = 0;
  const timer = window.setInterval(() => {
    i = (i + 1) % steps.length;
    toast.loading(steps[i], { id });
  }, intervalMs);

  try {
    const result = await task();
    window.clearInterval(timer);
    toast.success(success, { id });
    return result;
  } catch (err: any) {
    window.clearInterval(timer);
    toast.error(err?.message || errorFallback, { id });
    throw err;
  }
}
