import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import Button from "../components/Button";
import Modal from "../components/Modal";

export function useEditBlocker({ enabled, hasUnsavedChanges }) {
  const blocker = useBlocker(hasUnsavedChanges);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      if (!hasUnsavedChanges()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, hasUnsavedChanges]);

  return blocker;
}

export function UnsavedChangesModal({ blocker }) {
  return (
    <Modal open={blocker.state === "blocked"} onClose={() => blocker.reset()} title="Unsaved Changes">
      <p>You have unsaved changes. Are you sure you want to leave this page?</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => blocker.reset()}>
          Stay
        </Button>
        <Button variant="danger" onClick={() => blocker.proceed()}>
          Leave
        </Button>
      </div>
    </Modal>
  );
}
