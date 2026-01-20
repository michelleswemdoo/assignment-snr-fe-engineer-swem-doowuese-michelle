import type { FormField, GroupField } from '../types';

// So the result gives you:the actual field, the list it lives in, and its position in that list

export type FieldSearchResult = {
  field: FormField;
  parent: FormField[];
  index: number;
};

const pathStartsWith = (target: string[], prefix: string[]): boolean => {
  return (
    target.length >= prefix.length &&
    prefix.every((id, idx) => id === target[idx])
  );
};

const checkWithinScope = (
  parentPath: undefined | string[],
  currentPath: string[],
): boolean => {
  if (parentPath === undefined) return true;

  if (parentPath.length === 0) return currentPath.length === 0;

  // currentpath is where I am now
  // parentPath is where I want to be or look
  return pathStartsWith(currentPath, parentPath);
};
// This code is not just about “does the field exist?” but also about
// navigating a tree structure safely and predictably.

// Depth-First Search with path-prefix pruning
export const findField = (
  fieldId: string,
  fields: FormField[],
  parentPath?: string[],
): FieldSearchResult | null => {
  const searchRecursive = (
    fieldList: FormField[],
    currentPath: string[] = [],
  ): FieldSearchResult | null => {
    // Early rejection for root-only search
    if (parentPath?.length === 0 && currentPath.length > 0) return null;

    // Compute scope check once per recursion level (invariant for all fields in this level)
    const isWithinScope = checkWithinScope(parentPath, currentPath);

    for (let i = 0; i < fieldList.length; i++) {
      const field = fieldList[i];

      if (isWithinScope && field.id === fieldId) {
        return { field, parent: fieldList, index: i };
      }

      if (field.type === 'group') {
        const nextPath = [...currentPath, field.id];

        if (parentPath === undefined) {
          const found = searchRecursive((field as GroupField).fields, nextPath);
          if (found) return found;
        } else {
          const isAtOrBeyondPrefix = pathStartsWith(nextPath, parentPath);
          const isBuildingPrefix =
            nextPath.length < parentPath.length &&
            nextPath.every((id, idx) => id === parentPath[idx]);

          if (isAtOrBeyondPrefix || isBuildingPrefix) {
            const found = searchRecursive(
              (field as GroupField).fields,
              nextPath,
            );
            if (found) return found;
          }
        }
      }
    }
    return null;
  };

  return searchRecursive(fields);
};

export const findFieldByPath = (
  fieldId: string,
  parentPath: string[],
  fields: FormField[],
): FormField | null => {
  const result = findField(fieldId, fields, parentPath);
  return result ? result.field : null;
};
