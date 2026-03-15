import { useState, useCallback } from 'react';

export function useEditMode() {
  const [isEditing, setIsEditing] = useState(false);

  const enterEditMode = useCallback(() => setIsEditing(true), []);
  const exitEditMode = useCallback(() => setIsEditing(false), []);
  const toggleEditMode = useCallback(() => setIsEditing((prev) => !prev), []);

  return {
    isEditing,
    setIsEditing,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
  };
}
