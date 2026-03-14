import { useMemo, useCallback } from 'react';

import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { IRpeMethod } from 'types/rpe/rpe-method-assigned';

export interface RpeOptionProps {
  color: string;
  value: number;
  emoji: string;
}

const RpeOption = ({ color, value, emoji }: RpeOptionProps) => (
  <div className="rpe-option">
    {color && (
      <span
        className="rpe-color-indicator"
        style={{
          backgroundColor: `#${color}`,
          width: 20,
          height: 20,
          display: 'inline-block',
          marginRight: 5,
          borderRadius: '4px'
        }}
      />
    )}
    <span className="rpe-value">{value}</span>
    {emoji && <span className="rpe-emoji ml-2">{emoji}</span>}
  </div>
);

export interface RpeDropdownComponentProps {
  selectedRpe: number;
  onChange: (e: { value: number | null }) => void;
  rpeMethod: IRpeMethod;
}
export default function RpeDropdownComponent({ selectedRpe, onChange, rpeMethod }: RpeDropdownComponentProps) {
  const selectedRpeMethod = rpeMethod;

  const getRpeOptions = useMemo(() => {
    if (!selectedRpeMethod) return [];

    if ((selectedRpeMethod as IRpeMethod)?.valuesMeta?.length === 0) {
      return Array.from(
        {
          length: (selectedRpeMethod?.maxValue - selectedRpeMethod?.minValue) / selectedRpeMethod?.step + 1
        },
        (_, index) => {
          const value = selectedRpeMethod.minValue + index * selectedRpeMethod.step;
          return {
            label: value.toString(),
            value: value,
            color: null,
            emoji: null
          };
        }
      );
    }

    return selectedRpeMethod?.valuesMeta?.map((meta) => ({
      label: meta.value.toString(),
      value: meta.value,
      color: meta.color,
      emoji: meta.emoji
    }));
  }, [selectedRpeMethod]);

  const handleChange = useCallback(
    (e: { value: number | undefined | string | null }) => {
      let value = e.value;

      // Si es undefined, null, string vacío, o NaN, enviar null
      if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) {
        onChange({ value: null });
        return;
      }

      // Si es un string, intentar convertir a número
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          onChange({ value: null });
          return;
        }
        value = numValue;
      }

      // Verificar que el valor esté dentro del rango permitido
      if (selectedRpeMethod && (value < selectedRpeMethod.minValue || value > selectedRpeMethod.maxValue)) {
        onChange({ value: null });
        return;
      }

      onChange({ value });
    },
    [onChange, selectedRpeMethod]
  );

  // Plantilla personalizada para cada ítem del dropdown
  const itemTemplate = (option: { color: string; value: number; emoji: string }) => {
    return <RpeOption color={option.color} value={option.value} emoji={option.emoji} />;
  };

  // Plantilla para la opción seleccionada
  const selectedItemTemplate = (option: { color: string; value: number; emoji: string }) => {
    if (!option || option.value === null || option.value === undefined) {
      return <span className="text-500">Seleccione valor RPE</span>;
    }
    return <RpeOption color={option.color} value={option.value} emoji={option.emoji} />;
  };

  const shouldUseInputNumber = (selectedRpeMethod?.valuesMeta?.length || 0) > 10 || (getRpeOptions?.length || 0) > 10;

  return (
    <div className="rpe-dropdown w-full">
      <div>
        <label className=""> {selectedRpeMethod.name}: </label>
      </div>
      <div className="w-full">
        {shouldUseInputNumber ? (
          <InputNumber
            value={selectedRpe}
            min={selectedRpeMethod.minValue}
            max={selectedRpeMethod.maxValue}
            step={selectedRpeMethod.step}
            onValueChange={handleChange}
            placeholder="Ingrese valor RPE"
            className="p-inputnumber-sm p-inputtext-sm w-full"
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-secondary p-button-sm"
            incrementButtonClassName="p-button-secondary p-button-sm"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            allowEmpty={true}
          />
        ) : (
          <Dropdown
            value={selectedRpe}
            options={getRpeOptions}
            onChange={handleChange}
            placeholder="Seleccione valor RPE"
            optionLabel="label"
            className="w-full"
            itemTemplate={itemTemplate}
            valueTemplate={selectedItemTemplate}
            showClear={true}
            emptyMessage="No hay opciones disponibles"
          />
        )}
      </div>
    </div>
  );
}
