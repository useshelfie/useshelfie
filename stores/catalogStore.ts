import { create, StoreApi, UseBoundStore } from 'zustand';

// Export the interface
export interface CatalogState {
    // A simple counter. Incrementing it will trigger listeners.
    refetchTrigger: number;
    // Function to increment the trigger
    triggerCatalogProductRefetch: () => void;
}

// Let Zustand infer the type of 'set' based on the generic
export const useCatalogStore: UseBoundStore<StoreApi<CatalogState>> = create<CatalogState>((set) => ({
    refetchTrigger: 0,
    triggerCatalogProductRefetch: () => set((state: CatalogState) => ({
        refetchTrigger: state.refetchTrigger + 1
    })),
})); 