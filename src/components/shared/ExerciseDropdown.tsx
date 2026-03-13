import React, { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';

export interface ExerciseDropdownProps {
  exercises: Array<{ id: number; name: string }>;
  value: number | null;
  onChange: (value: number | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
}

export const ExerciseDropdown: React.FC<ExerciseDropdownProps> = ({
  exercises,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Seleccionar ejercicio',
  className = 'w-full p-inputtext-sm',
  showClear = true
}) => {
  const [filterValue, setFilterValue] = useState('');

  const sortedExercises = useMemo(() => {
    if (!filterValue) return exercises;
    const lower = filterValue.toLowerCase();
    return [...exercises].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aExact = aName === lower;
      const bExact = bName === lower;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      const aStarts = aName.startsWith(lower);
      const bStarts = bName.startsWith(lower);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      return aName.localeCompare(bName);
    });
  }, [exercises, filterValue]);

  return (
    <Dropdown
      className={className}
      options={sortedExercises}
      optionLabel="name"
      optionValue="id"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.value)}
      filter
      showClear={showClear}
      filterInputAutoFocus={false}
      resetFilterOnHide
      onFilter={(e: { filter: string }) => setFilterValue(e.filter)}
      onHide={() => setFilterValue('')}
      onFocus={onFocus}
      onBlur={onBlur}
      emptyMessage="No se encontraron ejercicios"
      emptyFilterMessage="No se encontraron ejercicios"
    />
  );
};
