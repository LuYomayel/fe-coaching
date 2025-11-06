import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useRpeTab } from '../../hooks/coach/useRpeTab';
import { useRpeMethodDialog } from '../../hooks/dialogs/useRpeMethodDialog';
import { useRpeAssignmentDialog } from '../../hooks/dialogs/useRpeAssignmentDialog';
import { RpeMethodDialog } from '../dialogs/RpeMethodDialog';
import { RpeAssignmentDialog } from '../dialogs/RpeAssignmentDialog';
import { useUser } from '../../contexts/UserContext';

export function RpeTab() {
  const intl = useIntl();
  const state = useRpeTab();
  const { user } = useUser();
  const rpeMethodDialog = useRpeMethodDialog(user?.userId || 0);
  const rpeAssignDialog = useRpeAssignmentDialog(user?.userId || 0);

  return (
    <div className="p-3">
      <div className="flex gap-2 mb-3">
        <Button
          label={intl.formatMessage({ id: 'coach.createRpeMethod' })}
          icon="pi pi-plus-circle"
          onClick={() => rpeMethodDialog.openCreate()}
          className="p-button-primary"
        />
        <Button
          label={intl.formatMessage({ id: 'coach.assignRpe' })}
          icon="pi pi-link"
          onClick={() => {
            state.setSelectedType(null);
            state.setSelectedTarget(null);
            state.setSelectedRpe(null);
            rpeAssignDialog.open();
          }}
          className="p-button-outlined"
          disabled={state.rpeMethods.length === 0}
        />
      </div>

      <Card title={intl.formatMessage({ id: 'coach.rpeMethods' })}>
        <div className="grid">
          {state.rpeMethods.map((rpe) => (
            <div key={rpe.id} className="col-12 md:col-6 lg:col-4">
              <div className="surface-card shadow-2 border-round p-4">
                <h3 className="text-xl font-bold m-0 mb-3">{rpe.name}</h3>
                <div className="flex align-items-center gap-2 mb-3 text-600">
                  <i className="pi pi-sliders-h"></i>
                  <span>
                    {rpe.minValue} - {rpe.maxValue} ({intl.formatMessage({ id: 'rpe.step' })}: {rpe.step})
                  </span>
                </div>
                <div className="flex gap-2 justify-content-end">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-text p-button-rounded"
                    onClick={() => rpeMethodDialog.openEdit(rpe as any)}
                    tooltip={intl.formatMessage({ id: 'common.edit' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-rounded p-button-danger"
                    onClick={() => state.deleteMethod(rpe.id)}
                    tooltip={intl.formatMessage({ id: 'common.delete' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-3" title={intl.formatMessage({ id: 'coach.rpeAssignments' })}>
        <DataTable value={state.rpeAssignments} stripedRows paginator rows={10} dataKey="id">
          <Column
            field="rpeId"
            header={intl.formatMessage({ id: 'rpe.method' })}
            body={(row) => state.getRpeNameById(row)}
            style={{ minWidth: '200px' }}
          />
          <Column
            field="targetType"
            header={intl.formatMessage({ id: 'rpe.targetType' })}
            body={(row) => (
              <span className="inline-flex align-items-center gap-2 bg-primary-100 text-primary-900 px-2 py-1 border-round">
                <i className={`pi ${row.targetType === 'exercise' ? 'pi-heart' : 'pi-user'}`}></i>
                {state.formatTargetType(row.targetType)}
              </span>
            )}
            style={{ minWidth: '150px' }}
          />
          <Column
            field="targetName"
            header={intl.formatMessage({ id: 'rpe.targetName' })}
            style={{ minWidth: '200px' }}
          />
          <Column
            field="createdAt"
            header={intl.formatMessage({ id: 'common.createdAt' })}
            style={{ minWidth: '150px' }}
          />
        </DataTable>
      </Card>

      <RpeMethodDialog
        visible={rpeMethodDialog.visible}
        loading={rpeMethodDialog.loading}
        mode={rpeMethodDialog.mode}
        form={rpeMethodDialog.form}
        onHide={rpeMethodDialog.close}
        onChange={(patch) => rpeMethodDialog.setField(Object.keys(patch)[0] as any, Object.values(patch)[0] as any)}
        onGenerateValues={rpeMethodDialog.generateValues}
        onAddValue={rpeMethodDialog.addValueMeta}
        onUpdateValue={rpeMethodDialog.updateValueMeta}
        onRemoveValue={rpeMethodDialog.removeValueMeta}
        onSave={async () => {
          const res = await rpeMethodDialog.save();
          if (res.success) state.loadRpeData();
          return res;
        }}
      />

      <RpeAssignmentDialog
        visible={rpeAssignDialog.visible}
        loading={rpeAssignDialog.loading}
        types={state.typeOptions}
        selectedType={state.selectedType}
        onChangeType={(v) => {
          state.setSelectedType(v);
          rpeAssignDialog.setType(v);
        }}
        targets={state.targets}
        selectedTargetId={state.selectedTarget}
        onChangeTargetId={(id) => {
          state.setSelectedTarget(id);
          rpeAssignDialog.setTargetId(id);
        }}
        rpeMethods={state.rpeMethods.map((r) => ({ label: r.name, value: r.id }))}
        selectedRpeMethodId={state.selectedRpe}
        onChangeRpeMethodId={(id) => {
          state.setSelectedRpe(id);
          rpeAssignDialog.setRpeMethodId(id);
        }}
        onHide={rpeAssignDialog.close}
        onAssign={async () => {
          const res = await rpeAssignDialog.assign();
          if (res.success) state.loadRpeData();
          return res;
        }}
      />
    </div>
  );
}
