export type State =
  | 'IDLE'
  | 'REASONING'
  | 'ACTING'
  | 'OBSERVING'
  | 'DONE'
  | 'ERROR';

export type StateEvent =
  | 'start'
  | 'llm_response'
  | 'action'
  | 'observation'
  | 'final'
  | 'error'
  | 'reset';

/**
 * Deterministic state transitions for the ReAct loop.
 */
export function transition(currentState: State, event: StateEvent): State {
  switch (currentState) {
    case 'IDLE':
      if (event === 'start') return 'REASONING';
      if (event === 'error') return 'ERROR';
      return currentState;

    case 'REASONING':
      if (event === 'action') return 'ACTING';
      if (event === 'final') return 'DONE';
      if (event === 'error') return 'ERROR';
      return currentState;

    case 'ACTING':
      if (event === 'observation') return 'OBSERVING';
      if (event === 'error') return 'ERROR';
      return currentState;

    case 'OBSERVING':
      if (event === 'llm_response') return 'REASONING';
      if (event === 'error') return 'ERROR';
      return currentState;

    case 'DONE':
    case 'ERROR':
      if (event === 'reset') return 'IDLE';
      return currentState;

    default:
      return currentState;
  }
}
