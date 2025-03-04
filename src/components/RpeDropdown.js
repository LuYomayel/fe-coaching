import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback
} from 'react';
import '../styles/RpeDropdown.css';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import {
  fetchWorkoutInstance,
  getRpeMethods
} from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { ProgressSpinner } from 'primereact/progressspinner';

const RpeOption = ({ color, value, emoji }) => (
  <div className="rpe-option">
    <span
      className="rpe-color-indicator"
      style={{
        backgroundColor: color,
        width: 20,
        height: 20,
        display: 'inline-block',
        marginRight: 5,
        borderRadius: '4px'
      }}
    />
    <span>
      {value} {emoji}
    </span>
  </div>
);

export default function RpeDropdownComponent({ selectedRpe, onChange }) {
  const showToast = useToast();
  const { planId } = useParams();
  const { client } = useContext(UserContext);
  const [rpeMethods, setRpeMethods] = useState([]);
  // eslint-disable-next-line
  const [workout, setWorkout] = useState(null);
  const [selectedRpeMethod, setSelectedRpeMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRpeMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getRpeMethods(client.coach.user.id);
      // console.log(data)
      const methods = data;
      setRpeMethods(methods);
    } catch (error) {
      setError('Error al cargar los métodos RPE');
      showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
    } finally {
      setLoading(false);
    }
  }, [client.coach.user.id, showToast]);

  const fetchWorkoutData = useCallback(async () => {
    if (!rpeMethods.length) return;

    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchWorkoutInstance(planId);
      setWorkout(data);

      let assignedRpeMethod = rpeMethods.find(
        (method) => method.name === data.assignedRpe
      );

      // Si no hay método RPE asignado, usar el primero disponible
      if (!assignedRpeMethod) {
        assignedRpeMethod = rpeMethods[0];
      }

      setSelectedRpeMethod(assignedRpeMethod);
    } catch (error) {
      setError('Error al cargar el entrenamiento');
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [planId, rpeMethods, showToast]);

  useEffect(() => {
    fetchRpeMethods();
  }, [fetchRpeMethods]);

  useEffect(() => {
    if (rpeMethods.length) {
      fetchWorkoutData();
    }
  }, [rpeMethods, fetchWorkoutData]);

  const getRpeOptions = useMemo(() => {
    if (!selectedRpeMethod) return [];

    if (selectedRpeMethod.valuesMeta.length === 0) {
      return Array.from(
        {
          length:
            (selectedRpeMethod.maxValue - selectedRpeMethod.minValue) /
              selectedRpeMethod.step +
            1
        },
        (_, index) => {
          const value =
            selectedRpeMethod.minValue + index * selectedRpeMethod.step;
          return {
            label: value.toString(),
            value: value
          };
        }
      );
    }

    return selectedRpeMethod.valuesMeta.map((meta) => ({
      label: <RpeOption {...meta} />,
      value: meta.value
    }));
  }, [selectedRpeMethod]);

  const handleChange = useCallback(
    (e) => {
      const value = typeof e.value === 'number' ? e.value : parseFloat(e.value);
      onChange({ value });
    },
    [onChange]
  );

  if (loading) {
    return <ProgressSpinner style={{ width: '50px', height: '50px' }} />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!selectedRpeMethod) {
    return (
      <div className="warning-message">No hay método RPE seleccionado</div>
    );
  }

  const shouldUseInputNumber =
    selectedRpeMethod.valuesMeta.length > 10 || getRpeOptions.length > 10;

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
          />
        )}
      </div>
    </div>
  );
}
