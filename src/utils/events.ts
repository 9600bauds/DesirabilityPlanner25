import { InteractionEvent } from '../types/InteractionEvent';

export const getClientCoordinates = (
  event: InteractionEvent
): [clientX: number, clientY: number] => {
  // Mouse event
  if ('clientX' in event) {
    return [event.clientX, event.clientY];
  }

  // Touch event with active touches
  if (event.touches && event.touches.length > 0) {
    return [event.touches[0].clientX, event.touches[0].clientY];
  }

  // Touch end event (touches list will be empty)
  if (event.changedTouches && event.changedTouches.length > 0) {
    return [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
  }

  throw new Error('Could not extract client coordinates from event!');
};
