import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { IPlanExercise, IPlanGroup } from '../types/workout/plan-state';

interface SetConfigDialogProps {
  visible: boolean;
  onHide: () => void;
  selectedExercise: IPlanExercise | null;
  selectedGroup: IPlanGroup | null;
  toggleSetConfiguration: (groupId: string | number, exerciseId: string | number, enable: boolean) => void;
  updateSetConfiguration: (
    groupId: string | number,
    exerciseId: string | number,
    setIndex: number,
    property: string,
    value: string
  ) => void;
}

export const SetConfigDialog: React.FC<SetConfigDialogProps> = ({
  visible,
  onHide,
  selectedExercise,
  selectedGroup,
  toggleSetConfiguration,
  updateSetConfiguration
}) => {
  if (!selectedExercise || !selectedGroup) return null;

  const handleToggleSetConfig = (checked: boolean) => {
    toggleSetConfiguration(selectedGroup.id, selectedExercise.id, checked);
  };

  return (
    <Dialog
      header="Configuración de Sets"
      visible={visible}
      style={{ width: '800px' }}
      onHide={onHide}
      footer={
        <div>
          <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
        </div>
      }
    >
      <div>
        <div className="mb-4 p-3 surface-100 border-round">
          <div className="flex align-items-center gap-3">
            <Checkbox
              inputId="useSetConfig"
              checked={!!selectedExercise.setConfiguration}
              onChange={(e) => handleToggleSetConfig(!!e.checked)}
            />
            <label htmlFor="useSetConfig" className="font-semibold cursor-pointer">
              Configurar sets individuales
            </label>
          </div>
          <p className="text-sm mt-2 mb-0 text-600">
            Activa esta opción si quieres definir repeticiones, peso y otras propiedades específicas para cada set.
          </p>
        </div>

        {selectedExercise.setConfiguration ? (
          <div>
            <div className="text-sm mb-3 font-semibold">Total de sets: {selectedExercise.sets || 0}</div>

            {selectedExercise.setConfiguration.map((set, index) => (
              <div key={index} className="mb-3 p-3 border-1 surface-border border-round">
                <div className="font-semibold mb-2">Set {set.setNumber}</div>
                <div className="grid">
                  <div className="col-4">
                    <label className="block text-xs mb-1">Repeticiones</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.repetitions || ''}
                      onChange={(e) =>
                        updateSetConfiguration(
                          selectedGroup.id,
                          selectedExercise.id,
                          index,
                          'repetitions',
                          e.target.value
                        )
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="col-4">
                    <label className="block text-xs mb-1">Peso (kg)</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.weight || ''}
                      onChange={(e) =>
                        updateSetConfiguration(selectedGroup.id, selectedExercise.id, index, 'weight', e.target.value)
                      }
                      placeholder="50"
                    />
                  </div>
                  <div className="col-4">
                    <label className="block text-xs mb-1">Tiempo (seg)</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.time || ''}
                      onChange={(e) =>
                        updateSetConfiguration(selectedGroup.id, selectedExercise.id, index, 'time', e.target.value)
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="col-4">
                    <label className="block text-xs mb-1">Descanso (seg)</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.restInterval || ''}
                      onChange={(e) =>
                        updateSetConfiguration(
                          selectedGroup.id,
                          selectedExercise.id,
                          index,
                          'restInterval',
                          e.target.value
                        )
                      }
                      placeholder="60"
                    />
                  </div>
                  <div className="col-4">
                    <label className="block text-xs mb-1">Tempo</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.tempo || ''}
                      onChange={(e) =>
                        updateSetConfiguration(selectedGroup.id, selectedExercise.id, index, 'tempo', e.target.value)
                      }
                      placeholder="2-0-2-0"
                    />
                  </div>
                  <div className="col-4">
                    <label className="block text-xs mb-1">Distancia (m)</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.distance || ''}
                      onChange={(e) =>
                        updateSetConfiguration(selectedGroup.id, selectedExercise.id, index, 'distance', e.target.value)
                      }
                      placeholder="100"
                    />
                  </div>
                  <div className="col-12">
                    <label className="block text-xs mb-1">Notas</label>
                    <InputText
                      className="w-full p-inputtext-sm"
                      value={set.notes || ''}
                      onChange={(e) =>
                        updateSetConfiguration(selectedGroup.id, selectedExercise.id, index, 'notes', e.target.value)
                      }
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-600">
            <i className="pi pi-info-circle mb-2" style={{ fontSize: '2rem' }}></i>
            <p>Activa la configuración individual de sets para personalizar cada serie del ejercicio.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
