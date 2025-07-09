import React, { createContext, useContext, useReducer, ReactNode } from "react";

// ==================== DRAFT STATE TYPES ====================

interface DraftState {
  drafts: Record<number, string>; // conversationId -> draft content
}

// ==================== DRAFT ACTIONS ====================

type DraftAction =
  | { type: "SET_DRAFT"; payload: { conversationId: number; content: string } }
  | { type: "CLEAR_DRAFT"; payload: number } // conversationId
  | { type: "CLEAR_ALL_DRAFTS" };

// ==================== INITIAL STATE ====================

const initialState: DraftState = {
  drafts: {},
};

// ==================== DRAFT REDUCER ====================

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "SET_DRAFT":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.payload.conversationId]: action.payload.content,
        },
      };

    case "CLEAR_DRAFT":
      const { [action.payload]: removed, ...remainingDrafts } = state.drafts;
      return {
        ...state,
        drafts: remainingDrafts,
      };

    case "CLEAR_ALL_DRAFTS":
      return {
        ...state,
        drafts: {},
      };

    default:
      return state;
  }
}

// ==================== CONTEXT TYPES ====================

interface DraftContextType {
  drafts: Record<number, string>;
  setDraft: (conversationId: number, content: string) => void;
  getDraft: (conversationId: number) => string;
  clearDraft: (conversationId: number) => void;
  clearAllDrafts: () => void;
  hasDraft: (conversationId: number) => boolean;
}

// ==================== CONTEXT CREATION ====================

const DraftContext = createContext<DraftContextType | undefined>(undefined);

// ==================== DRAFT PROVIDER ====================

interface DraftProviderProps {
  children: ReactNode;
}

export const DraftProvider: React.FC<DraftProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(draftReducer, initialState);

  // ==================== DRAFT ACTIONS ====================

  const setDraft = (conversationId: number, content: string) => {
    if (content.trim() === "") {
      // Clear draft if content is empty
      clearDraft(conversationId);
      return;
    }

    dispatch({
      type: "SET_DRAFT",
      payload: { conversationId, content },
    });
    console.log(
      `📝 DraftContext: Saved draft for conversation ${conversationId}`
    );
  };

  const getDraft = (conversationId: number): string => {
    return state.drafts[conversationId] || "";
  };

  const clearDraft = (conversationId: number) => {
    if (state.drafts[conversationId]) {
      dispatch({ type: "CLEAR_DRAFT", payload: conversationId });
      console.log(
        `🗑️ DraftContext: Cleared draft for conversation ${conversationId}`
      );
    }
  };

  const clearAllDrafts = () => {
    dispatch({ type: "CLEAR_ALL_DRAFTS" });
    console.log("🧹 DraftContext: Cleared all drafts");
  };

  const hasDraft = (conversationId: number): boolean => {
    return Boolean(state.drafts[conversationId]?.trim());
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue: DraftContextType = {
    drafts: state.drafts,
    setDraft,
    getDraft,
    clearDraft,
    clearAllDrafts,
    hasDraft,
  };

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

export const useDraft = (): DraftContextType => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error("useDraft must be used within a DraftProvider");
  }
  return context;
};

export default DraftContext;
