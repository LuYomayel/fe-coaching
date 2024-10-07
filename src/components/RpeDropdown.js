import React, { useState, useEffect, useContext } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber'; // Importar InputNumber
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { fetchWorkoutInstance, getRpeMethods } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';

export default function RpeDropdownComponent({ selectedRpe, onChange }) {
  const showToast = useToast();
  const { planId } = useParams();
  const { client } = useContext(UserContext);
  const [rpeMethods, setRpeMethods] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [selectedRpeMethod, setSelectedRpeMethod] = useState(null);

  useEffect(() => {
    const fetchRpe = async () => {
      try {
        const methods = await getRpeMethods(client.coach.user.id);
        setRpeMethods(methods);
      } catch (error) {
        showToast('error', 'Error fetching RPE methods', error.message);
      }
    };

    fetchRpe();
  }, [showToast, client.coach.user.id]);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await fetchWorkoutInstance(planId);
        setWorkout(data);
        const assignedRpeMethod = rpeMethods.find((method) => method.name === data.assignedRpe);
        setSelectedRpeMethod(assignedRpeMethod);
      } catch (error) {
        showToast('error', 'Error fetching workout', error.message);
      }
    };

    if (rpeMethods.length) fetchWorkout();
  }, [planId, rpeMethods, showToast]);

  const getRpeOptions = (method) => {
    if (method.valuesMeta.length === 0) {
      const options = [];
      for (let value = method.minValue; value <= method.maxValue; value += method.step) {
        options.push({
          label: value.toString(),
          value: value,
        });
      }
      return options;
    } else {
      return method.valuesMeta.map((meta) => ({
        label: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                backgroundColor: meta.color,
                width: 20,
                height: 20,
                display: 'inline-block',
                marginRight: 5,
              }}
            ></span>
            <span>{meta.value} {meta.emoji}</span>
          </div>
        ),
        value: meta.value,
      }));
    }
  };

  return (
    <div className="rpe-dropdown">
      {selectedRpeMethod ? (
        selectedRpeMethod.valuesMeta.length > 10 || getRpeOptions(selectedRpeMethod).length > 10 ? ( // Cambiar a InputNumber si hay más de 10 opciones
          <InputNumber
            value={selectedRpe}
            min={selectedRpeMethod.minValue}
            max={selectedRpeMethod.maxValue}
            step={selectedRpeMethod.step}
            onValueChange={(e) => onChange({ value: e.value })}
            placeholder="Enter RPE Value"
          />
        ) : (
          <Dropdown
            value={selectedRpe}
            options={getRpeOptions(selectedRpeMethod)}
            onChange={onChange}
            placeholder="Select RPE Value"
            optionLabel="label"
          />
        )
      ) : (
        <p>Loading RPE...</p>
      )}
    </div>
  );
}