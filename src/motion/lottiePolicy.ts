import { tokens } from '../../design-tokens/tokens';

/**
 * How many loops an auto-playing empty state may run: as many whole loops as fit in the
 * 5 s auto-play budget (WCAG 2.2.2), then it rests on its last frame. Tap replays it.
 */
export const maxLoops = (durationMs: number) => Math.max(1, Math.floor(tokens.accessibility.maxAutoplayLoopMs / durationMs));
