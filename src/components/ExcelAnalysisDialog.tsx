import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useIntl } from 'react-intl';
import { Checkbox } from 'primereact/checkbox';

const ExcelAnalysisDialog = ({ visible, onHide, analysisData, onConfirm, setAnalysisData }) => {
  const intl = useIntl();
  const [localAnalysisData, setLocalAnalysisData] = useState(analysisData);

  useEffect(() => {
    //console.log('ExcelAnalysisDialog - Received analysisData:', analysisData);

    // Solo inicializamos si no hay selectedChanges definidos
    const hasInitializedChanges = analysisData?.exercisesToUpdate?.some(
      (exercise) => exercise.selectedChanges && Object.keys(exercise.selectedChanges).length > 0
    );

    if (!hasInitializedChanges) {
      // Crear una copia profunda del analysisData
      const updatedAnalysisData = JSON.parse(JSON.stringify(analysisData));

      // Inicializar selectedChanges como true para todos los campos en exercisesToUpdate
      if (updatedAnalysisData?.exercisesToUpdate) {
        updatedAnalysisData.exercisesToUpdate = updatedAnalysisData.exercisesToUpdate.map((exercise) => {
          if (exercise.changes) {
            exercise.selectedChanges = Object.keys(exercise.changes).reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {});
          }
          return exercise;
        });
      }

      setLocalAnalysisData(updatedAnalysisData);
      setAnalysisData(updatedAnalysisData);
    } else {
      setLocalAnalysisData(analysisData);
    }
  }, [analysisData]);

  const renderFooter = () => {
    return (
      <div>
        <Button
          label={intl.formatMessage({ id: 'common.cancel' })}
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-text"
        />
        <Button
          label={intl.formatMessage({ id: 'common.confirm' })}
          icon="pi pi-check"
          onClick={() => {
            //console.log('ExcelAnalysisDialog - Confirming with data:', localAnalysisData);
            onConfirm();
          }}
          autoFocus
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <span className={`status-badge ${rowData.status.toLowerCase()}`}>
        {rowData.status === 'NEW' ? <i className="pi pi-plus-circle mr-2" /> : <i className="pi pi-sync mr-2" />}
        {intl.formatMessage({ id: `exercises.status.${rowData.status.toLowerCase()}` })}
      </span>
    );
  };

  const changesBodyTemplate = (rowData) => {
    if (!rowData.changes || Object.keys(rowData.changes).length === 0) return null;
    return (
      <div className="changes-cell">
        {Object.entries(rowData.changes).map(([field, value]: [string, any], index: number) => (
          <div key={index} className="change-item">
            <Checkbox
              checked={rowData.selectedChanges?.[field] !== false}
              onChange={(e) => {
                //console.log('Checkbox changed:', { field, checked: e.checked, rowData });

                // Crear una copia profunda del estado local
                const updatedAnalysisData = JSON.parse(JSON.stringify(localAnalysisData));

                // Encontrar el ejercicio en exercisesToUpdate
                const exerciseIndex = updatedAnalysisData.exercisesToUpdate.findIndex(
                  (exercise) => exercise.id === rowData.id
                );

                if (exerciseIndex !== -1) {
                  // Inicializar selectedChanges si no existe
                  if (!updatedAnalysisData.exercisesToUpdate[exerciseIndex].selectedChanges) {
                    updatedAnalysisData.exercisesToUpdate[exerciseIndex].selectedChanges = {};
                  }

                  // Actualizar el estado del checkbox
                  updatedAnalysisData.exercisesToUpdate[exerciseIndex].selectedChanges[field] = e.checked;

                  //console.log('Updated exercise:', updatedAnalysisData.exercisesToUpdate[exerciseIndex]);

                  // Actualizar el estado local y el estado del padre
                  setLocalAnalysisData(updatedAnalysisData);
                  setAnalysisData(updatedAnalysisData);
                }
              }}
            />
            <i className="pi pi-info-circle mr-2" />
            {intl.formatMessage({ id: `exercises.field.${field}` })}: {value.old} → {value.new}
          </div>
        ))}
      </div>
    );
  };

  const currentDataBodyTemplate = (rowData) => {
    // Verificar si currentData existe
    if (!rowData.currentData) {
      return <div className="data-cell">-</div>;
    }

    return (
      <div className="data-cell">
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.description' })}:</strong>{' '}
          {rowData.currentData.description || '-'}
        </div>
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.exerciseType' })}:</strong>{' '}
          {rowData.currentData.exerciseType || '-'}
        </div>
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.equipmentNeeded' })}:</strong>{' '}
          {rowData.currentData.equipmentNeeded || '-'}
        </div>
      </div>
    );
  };

  const newDataBodyTemplate = (rowData) => {
    // Verificar si newData existe
    if (!rowData.newData) {
      return <div className="data-cell">-</div>;
    }

    return (
      <div className="data-cell">
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.description' })}:</strong>{' '}
          {rowData.newData.description || '-'}
        </div>
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.exerciseType' })}:</strong>{' '}
          {rowData.newData.exerciseType || '-'}
        </div>
        <div>
          <strong>{intl.formatMessage({ id: 'exercises.field.equipmentNeeded' })}:</strong>{' '}
          {rowData.newData.equipmentNeeded || '-'}
        </div>
      </div>
    );
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: '90vw' }}
      header={intl.formatMessage({ id: 'exercises.analysis.title' })}
      modal
      className="p-fluid"
      footer={renderFooter()}
      onHide={onHide}
    >
      <div className="analysis-summary mb-4">
        <h3>{intl.formatMessage({ id: 'exercises.analysis.summary' })}</h3>
        <p>
          {intl.formatMessage(
            { id: 'exercises.analysis.total' },
            {
              total: (analysisData?.exercisesToUpdate?.length || 0) + (analysisData?.exercisesToCreate?.length || 0),
              new: analysisData?.exercisesToCreate?.length || 0,
              existing: analysisData?.exercisesToUpdate?.length || 0
            }
          )}
        </p>
      </div>

      <DataTable
        value={[
          ...(analysisData?.exercisesToUpdate || []).map((ex) => ({ ...ex, status: 'EXISTING' })),
          ...(analysisData?.exercisesToCreate || []).map((ex) => ({ ...ex, status: 'NEW' }))
        ]}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        className="p-datatable-sm"
      >
        <Column
          field="name"
          header={intl.formatMessage({ id: 'exercises.name' })}
          sortable
          filter
          filterPlaceholder={intl.formatMessage({ id: 'common.search' })}
        />
        <Column
          field="status"
          header={intl.formatMessage({ id: 'exercises.status' })}
          body={statusBodyTemplate}
          sortable
        />
        <Column
          field="currentData"
          header={intl.formatMessage({ id: 'exercises.currentData' })}
          body={currentDataBodyTemplate}
        />
        <Column field="newData" header={intl.formatMessage({ id: 'exercises.newData' })} body={newDataBodyTemplate} />
        <Column field="changes" header={intl.formatMessage({ id: 'exercises.changes' })} body={changesBodyTemplate} />
      </DataTable>
    </Dialog>
  );
};

export default ExcelAnalysisDialog;
