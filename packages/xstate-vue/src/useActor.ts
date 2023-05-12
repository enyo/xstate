import { ActorRef, EventObject, SnapshotFrom } from 'xstate';
import { shallowRef, isRef, watch, Ref } from 'vue';

const noop = () => {
  /* ... */
};

export function useActor<TActor extends ActorRef<any, any>>(
  actorRef: TActor | Ref<TActor>
): {
  snapshot: Ref<SnapshotFrom<TActor>>;
  send: TActor['send'];
};
export function useActor<TEvent extends EventObject, TSnapshot>(
  actorRef: ActorRef<TEvent, TSnapshot> | Ref<ActorRef<TEvent, TSnapshot>>
): { snapshot: Ref<TSnapshot>; send: (event: TEvent) => void };
export function useActor(
  actorRef: ActorRef<EventObject, unknown> | Ref<ActorRef<EventObject, unknown>>
): {
  snapshot: Ref<unknown>;
  send: (event: EventObject) => void;
} {
  const actorRefRef = isRef(actorRef) ? actorRef : shallowRef(actorRef);
  const snapshot = shallowRef(actorRefRef.value.getSnapshot());

  const send: typeof actorRefRef.value.send = (event) => {
    actorRefRef.value.send(event);
  };

  watch(
    actorRefRef,
    (newActor, _, onCleanup) => {
      snapshot.value = newActor.getSnapshot();
      const { unsubscribe } = newActor.subscribe({
        next: (emitted) => (snapshot.value = emitted),
        error: noop,
        complete: noop
      });
      onCleanup(() => unsubscribe());
    },
    {
      immediate: true
    }
  );

  return { snapshot, send };
}
