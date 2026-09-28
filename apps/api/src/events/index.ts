import { EventEmitter } from "node:events";

/**
 * In-process pub/sub backbone.
 *
 * Domain code publishes typed events and never talks to transports or
 * integrations directly. Subscribers attach to the event names they care about,
 * which keeps a mutation's handler thin and makes new side effects additive
 * rather than invasive.
 *
 * This bus is process-local and not a durable delivery queue. Persist effects
 * that must survive process loss alongside the domain mutation. Subscribers
 * provide best-effort follow-up processing.
 *
 * `DomainEventMap` is the single source of truth for the event vocabulary: a
 * publisher whose payload drifts from its entry fails to compile, and a
 * subscriber can only name an event that appears here.
 */
const EVENTS = new EventEmitter();
EVENTS.setMaxListeners(100);

/** Every domain event and the payload its publisher supplies. */
export type DomainEventMap = {
  "workspace.created": { workspaceId: string; workspaceName: string };
  "invitation.accepted": {
    invitationId: string;
    inviterId: string;
    acceptedUserId: string;
    workspaceId: string;
  };
};

export type DomainEventName = keyof DomainEventMap;

/** The data a subscriber receives. */
export type DomainEventData<K extends DomainEventName> = DomainEventMap[K];

export type EventPayload<K extends DomainEventName = DomainEventName> = {
  type: K;
  data: DomainEventData<K>;
  timestamp: string;
};

export async function shutdownEventBus(): Promise<void> {
  EVENTS.removeAllListeners();
}

export async function publishEvent<K extends DomainEventName>(
  eventType: K,
  data: DomainEventMap[K],
  options?: { waitForHandlers?: boolean },
): Promise<void> {
  const payload: EventPayload<K> = {
    type: eventType,
    data: { ...data },
    timestamp: new Date().toISOString(),
  };

  if (options?.waitForHandlers) {
    // `EventEmitter.emit` discards promises. Bounded producers that must not
    // outrun their consumers await the subscriber wrappers directly.
    for (const listener of EVENTS.listeners(eventType)) {
      await listener(payload);
    }
    return;
  }

  EVENTS.emit(eventType, payload);
}

/**
 * Subscribers are isolated by default so a failed best-effort handler does not
 * break the write that triggered it. Critical consumers can opt into propagated
 * errors when their publisher awaits handlers.
 */
export function subscribeToEvent<K extends DomainEventName>(
  eventType: K,
  handler: (data: DomainEventData<K>) => Promise<void>,
  options?: { propagateErrors?: boolean },
): void {
  EVENTS.on(eventType, async (payload: EventPayload<K>) => {
    if (options?.propagateErrors) {
      await handler(payload.data);
      return;
    }
    try {
      await handler(payload.data);
    } catch (error) {
      console.error(`Error processing event ${eventType}:`, error);
    }
  });
}
