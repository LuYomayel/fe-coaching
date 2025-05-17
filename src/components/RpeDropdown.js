import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import '../styles/RpeDropdown.css';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { fetchWorkoutInstance, getRpeMethods, getRpeMethodAssigned } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { ProgressSpinner } from 'primereact/progressspinner';

const RpeOption = ({ color, value, emoji }) => (
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

export default function RpeDropdownComponent({ selectedRpe, onChange, cycleId, clientId }) {
  const showToast = useToast();
  const { planId } = useParams();
  const { user } = useContext(UserContext);

  // eslint-disable-next-line
  const [workout, setWorkout] = useState(null);
  const [selectedRpeMethod, setSelectedRpeMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRpeMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await getRpeMethodAssigned(clientId, planId || -1, cycleId || -1);

      if (data) {
        setSelectedRpeMethod(data);
      } else {
        console.warn('No se encontró un método RPE asignado');
        setSelectedRpeMethod(null);
      }
    } catch (error) {
      console.error('Error al cargar los métodos RPE:', error);
      setError('Error al cargar los métodos RPE');
      showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
    } finally {
      setLoading(false);
    }
  }, [clientId, showToast, planId, user.userId]);

  const fetchWorkoutData = useCallback(async () => {
    if (!selectedRpeMethod) return;

    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchWorkoutInstance(planId);
      setWorkout(data);
    } catch (error) {
      setError('Error al cargar el entrenamiento');
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [planId, selectedRpeMethod, showToast]);

  useEffect(() => {
    fetchRpeMethods();
  }, [fetchRpeMethods]);

  useEffect(() => {
    if (selectedRpeMethod) {
      fetchWorkoutData();
    }
  }, [selectedRpeMethod, fetchWorkoutData]);

  const getRpeOptions = useMemo(() => {
    if (!selectedRpeMethod) return [];

    if (selectedRpeMethod.valuesMeta.length === 0) {
      return Array.from(
        {
          length: (selectedRpeMethod.maxValue - selectedRpeMethod.minValue) / selectedRpeMethod.step + 1
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

    return selectedRpeMethod.valuesMeta.map((meta) => ({
      label: meta.value.toString(),
      value: meta.value,
      color: meta.color,
      emoji: meta.emoji
    }));
  }, [selectedRpeMethod]);

  const handleChange = useCallback(
    (e) => {
      const value = typeof e.value === 'number' ? e.value : parseFloat(e.value);
      onChange({ value });
    },
    [onChange]
  );

  // Plantilla personalizada para cada ítem del dropdown
  const itemTemplate = (option) => {
    return <RpeOption color={option.color} value={option.value} emoji={option.emoji} />;
  };

  // Plantilla para la opción seleccionada
  const selectedItemTemplate = (option) => {
    if (!option) {
      return <span>Seleccione valor RPE</span>;
    }
    return <RpeOption color={option.color} value={option.value} emoji={option.emoji} />;
  };

  if (loading) {
    return <ProgressSpinner style={{ width: '50px', height: '50px' }} />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!selectedRpeMethod) {
    return <div className="warning-message">No hay método RPE seleccionado</div>;
  }

  const shouldUseInputNumber = selectedRpeMethod.valuesMeta.length > 10 || getRpeOptions.length > 10;

  return (
    <div className="rpe-dropdown">
      <div className="rpe-dropdown-name">
        <label className="block mb-1"> {selectedRpeMethod.name}: </label>
      </div>
      <div>
        {shouldUseInputNumber ? (
          <InputNumber
            value={selectedRpe}
            min={selectedRpeMethod.minValue}
            max={selectedRpeMethod.maxValue}
            step={selectedRpeMethod.step}
            onValueChange={handleChange}
            placeholder="Ingrese valor RPE"
            className="p-inputnumber-sm"
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-secondary"
            incrementButtonClassName="p-button-secondary"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
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
          />
        )}
      </div>
    </div>
  );
}
