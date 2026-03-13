import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';

import { useIntl } from 'react-intl';
import { useExercisesTab } from '../../hooks/coach/useExercisesTab';
import { useRpeMethods } from '../../hooks/coach/useRpeMethods';
import { ExerciseExcelImport } from './ExerciseExcelImport';
import { useSpinner } from '../../utils/GlobalSpinner';
import VideoDialog from '../dialogs/VideoDialog';
import { CreateExerciseDialog } from '../../dialogs/CreateExerciseDialog';
import { extractYouTubeVideoId, getYouTubeThumbnail } from 'utils/UtilFunctions';

export function ExercisesTab() {
  const intl = useIntl();
  const { setLoading } = useSpinner();
  const state = useExercisesTab();
  const { rpeMethods } = useRpeMethods();

  const handleVideoClick = (url: string | null | undefined) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;
      state.setCurrentVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      state.setVideoDialogVisible(true);
    } catch (error) {
      console.error('Error extracting YouTube video ID:', error);
    }
  };

  const renderHeader = (text: string) => (
    <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-2 py-2">
      <div className="flex align-items-center gap-2">
        <h2 className="text-xl font-bold mb-0">{text}</h2>
      </div>
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <InputText
            value={state.searchTerm}
            onChange={(e) => state.onGlobalFilterChange(e.target.value)}
            placeholder={intl.formatMessage({ id: 'common.search' })}
          />
        </span>
      </div>
      <div className="flex align-items-center gap-2">
        {state.isEditingExercises ? (
          <>
            <Button
              label={intl.formatMessage({ id: 'common.saveAll' })}
              icon="pi pi-save"
              className="p-button-success"
              onClick={state.handleMassUpdateExercises}
              disabled={false}
            />
            <Button
              label={intl.formatMessage({ id: 'common.cancel' })}
              icon="pi pi-times"
              className="p-button-outlined p-button-danger"
              onClick={state.cancelMassUpdate}
            />
          </>
        ) : (
          false && (
            <Button
              label={intl.formatMessage({ id: 'common.edit' })}
              icon="pi pi-pencil"
              onClick={() => {
                state.setOriginalExercisesForEdit(JSON.parse(JSON.stringify(state.exercises)));
                state.setIsEditingExercises(true);
              }}
            />
          )
        )}
        {!state.isEditingExercises && (
          <>
            <Button
              label={intl.formatMessage(
                { id: 'common.add' },
                { item: intl.formatMessage({ id: 'coach.exercise.titleSingular' }) }
              )}
              icon="pi pi-plus"
              onClick={state.openCreateExerciseDialog}
            />
            <ExerciseExcelImport onAfterImport={() => state.setRefreshKey((k) => k + 1)} setLoading={setLoading} />
          </>
        )}
      </div>
    </div>
  );

  const videoBodyTemplate = (rowData: any) => (
    <a href="#/" onClick={() => handleVideoClick(rowData.multimedia)}>
      <img
        src={getYouTubeThumbnail(rowData.multimedia)}
        alt="Video thumbnail"
        style={{ width: '100px', cursor: 'pointer' }}
      />
    </a>
  );

  const textEditor = (options: any) => (
    <InputText
      type="text"
      value={options.value || ''}
      onChange={(e) => {
        options.editorCallback(e.target.value);
        const updatedOptions = { ...options, value: e.target.value };
        state.debouncedSaveExercise(updatedOptions);
      }}
      className="w-full text-sm"
    />
  );

  const createDropdownEditor = (dataOptions: any[]) => {
    const DropdownEditor = (options: any) => {
      const editorData = state.dropdownEditor(options, dataOptions);
      return (
        <Dropdown
          value={editorData.value?.id ?? null}
          options={editorData.options}
          optionLabel="name"
          optionValue="id"
          onChange={(e) => editorData.onChange(e.value)}
          className="w-full text-sm"
          showClear
        />
      );
    };
    DropdownEditor.displayName = 'DropdownEditor';
    return DropdownEditor;
  };

  const createMultiSelectEditor = (dataOptions: any[]) => {
    const MultiSelectEditor = (options: any) => {
      const editorData = state.multiSelectEditor(options, dataOptions);
      return (
        <MultiSelect
          value={editorData.value}
          options={editorData.options}
          optionLabel="name"
          optionValue="id"
          onChange={(e) => editorData.onChange(e.value)}
          className="w-full text-sm"
          display="chip"
          maxSelectedLabels={2}
        />
      );
    };
    MultiSelectEditor.displayName = 'MultiSelectEditor';
    return MultiSelectEditor;
  };

  return (
    <div className="p-2">
      <Card className="p-0">
        <DataTable
          value={state.exercises}
          stripedRows
          lazy
          paginator
          first={(state.currentPage - 1) * state.limit}
          rows={state.limit}
          totalRecords={state.totalRecords}
          onPage={state.onPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate={`${intl.formatMessage({ id: 'common.showing', defaultMessage: 'Mostrando' })} {first} - {last} ${intl.formatMessage({ id: 'common.of', defaultMessage: 'de' })} {totalRecords} ${intl.formatMessage({ id: 'coach.tabs.exercises' })}`}
          emptyMessage={intl.formatMessage({ id: 'coach.noExercisesFound' })}
          header={renderHeader(intl.formatMessage({ id: 'coach.tabs.exercises' }))}
          breakpoint="960px"
          dataKey="id"
          scrollable
          scrollHeight="700px"
          editMode={state.isEditingExercises ? 'cell' : undefined}
          size="small"
          className="text-sm"
          loading={state.loading}
        >
          <Column
            field="name"
            header={intl.formatMessage({ id: 'exercise.name' })}
            editor={(options) => textEditor(options)}
            sortable
            frozen
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '150px', maxWidth: '200px' }}
            body={(rowData) => (
              <div className="flex align-items-center gap-1">
                <span className="font-medium text-xs white-space-nowrap overflow-hidden text-overflow-ellipsis">
                  {rowData.name}
                </span>
                {state.hasMissingData(rowData) && (
                  <i className="pi pi-exclamation-triangle text-xs" style={{ color: 'red' }} />
                )}
              </div>
            )}
          />

          <Column
            field="multimedia"
            header={intl.formatMessage({ id: 'exercise.video' })}
            editor={(options) => textEditor(options)}
            body={(rowData) =>
              state.isEditingExercises ? (
                <span className="text-xs">{rowData.multimedia || ''}</span>
              ) : (
                videoBodyTemplate(rowData)
              )
            }
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2"
            style={{ minWidth: '100px', maxWidth: '120px' }}
          />

          <Column
            field="category"
            header={intl.formatMessage({ id: 'exercises.field.category' })}
            editor={createDropdownEditor(state.categories)}
            body={state.categoryBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '120px', maxWidth: '150px' }}
          />

          <Column
            field="variant"
            header={intl.formatMessage({ id: 'exercises.field.variant' })}
            editor={createDropdownEditor(state.variants)}
            body={state.variantBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '100px', maxWidth: '130px' }}
          />

          <Column
            field="contractionType"
            header={intl.formatMessage({ id: 'exercises.field.contractionType' })}
            editor={createDropdownEditor(state.contractions)}
            body={state.contractionTypeBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '110px', maxWidth: '140px' }}
          />

          <Column
            field="difficultyLevel"
            header={intl.formatMessage({ id: 'exercises.field.difficultyLevel' })}
            editor={createDropdownEditor(state.difficulties)}
            body={state.difficultyLevelBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '100px', maxWidth: '130px' }}
          />

          <Column
            field="movementPlane"
            header={intl.formatMessage({ id: 'exercises.field.movementPlane' })}
            editor={createDropdownEditor(state.movementPlanes)}
            body={state.movementPlaneBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '110px', maxWidth: '140px' }}
          />

          <Column
            field="unilateralType"
            header={intl.formatMessage({ id: 'exercises.field.unilateralType' })}
            editor={createDropdownEditor(state.unilateralTypes)}
            body={state.unilateralTypeBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '100px', maxWidth: '130px' }}
          />

          <Column
            field="movementPattern"
            header={intl.formatMessage({ id: 'exercises.field.movementPattern' })}
            editor={createDropdownEditor(state.movementPatterns)}
            body={state.movementPatternBodyTemplate}
            sortable
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '120px', maxWidth: '150px' }}
          />

          <Column
            field="equipments"
            header={intl.formatMessage({ id: 'exercises.field.equipment' })}
            editor={createMultiSelectEditor(state.equipments)}
            body={state.equipmentsBodyTemplate}
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '150px', maxWidth: '200px' }}
          />

          <Column
            field="muscles"
            header={intl.formatMessage({ id: 'exercises.field.muscles' })}
            editor={createMultiSelectEditor(state.muscles)}
            body={state.musclesBodyTemplate}
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '150px', maxWidth: '200px' }}
          />

          <Column
            field="regressionExercise"
            header={intl.formatMessage({ id: 'exercises.field.regressionExercise' })}
            editor={createDropdownEditor(state.exercises)}
            body={state.regressionExerciseBodyTemplate}
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '130px', maxWidth: '170px' }}
          />

          <Column
            field="progressionExercise"
            header={intl.formatMessage({ id: 'exercises.field.progressionExercise' })}
            editor={createDropdownEditor(state.exercises)}
            body={state.progressionExerciseBodyTemplate}
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '130px', maxWidth: '170px' }}
          />

          <Column
            field="rpeMethod"
            header={intl.formatMessage({ id: 'exercises.field.rpeMethod' })}
            editor={createDropdownEditor(rpeMethods)}
            body={state.rpeMethodBodyTemplate}
            className="text-xs"
            headerClassName="text-xs p-2"
            bodyClassName="p-2 text-xs"
            style={{ minWidth: '130px', maxWidth: '170px' }}
          />

          {!state.isEditingExercises && (
            <Column
              header={intl.formatMessage({ id: 'common.actions' })}
              frozen
              alignFrozen="right"
              body={(rowData) => (
                <div className="flex gap-1">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-outlined p-button-sm"
                    onClick={() => state.openEditExerciseDialog(rowData)}
                    tooltip={intl.formatMessage({ id: 'common.edit' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-outlined p-button-danger p-button-sm"
                    onClick={() => state.handleDeleteExercise(rowData.id)}
                    tooltip={intl.formatMessage({ id: 'common.delete' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
              )}
              className="text-xs"
              headerClassName="text-xs p-2"
              bodyClassName="p-2"
              style={{ minWidth: '100px', maxWidth: '120px' }}
            />
          )}
        </DataTable>
      </Card>

      <VideoDialog
        visible={state.videoDialogVisible}
        onHide={() => state.setVideoDialogVisible(false)}
        videoUrl={state.currentVideoUrl || ''}
      />

      {state.exerciseDialogVisible && (
        <CreateExerciseDialog
          exercise={state.newExercise}
          exerciseDialogVisible={state.exerciseDialogVisible}
          closeExerciseDialog={state.closeExerciseDialog}
          dialogMode={state.dialogMode}
          setExerciseDialogVisible={state.setExerciseDialogVisible}
          setRefreshKey={state.setRefreshKey}
          categories={state.categories}
          contractions={state.contractions}
          difficulties={state.difficulties}
          equipments={state.equipments}
          movementPatterns={state.movementPatterns}
          movementPlanes={state.movementPlanes}
          muscles={state.muscles}
          unilateralTypes={state.unilateralTypes}
          variants={state.variants}
          exercises={state.dialogExercises}
          rpeMethods={rpeMethods}
        />
      )}
    </div>
  );
}
