export type DispatchSelectionOption = {
  id: string;
  label: string;
};

export function getDispatchSelectionLabel(value: string | null, options: DispatchSelectionOption[], placeholder: string) {
  return options.find((option) => option.id === value)?.label ?? placeholder;
}
