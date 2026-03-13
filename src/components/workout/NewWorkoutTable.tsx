/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { FaGripVertical, FaSave, FaPlus, FaTrash } from 'react-icons/fa';

import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycleDialog';
import VideoDialog from '../dialogs/VideoDialog';

import {
  useNewWorkoutTable,
  INewWorkoutTableProps,
  ITableRow,
  ITableExerciseRow,
  ITableGroupRow,
  IDayOption
} from '../../hooks/useNewWorkoutTable';

// ==================== INTERFACES ====================

interface ISortableRowProps {
  rowData: ITableRow;
  index: number;
  renderNameColumn: (rowData: ITableRow) => JSX.Element | string;
  renderDataCells: (rowData: ITableRow) => JSX.Element[] | null;
  handleDeleteExercise: (rowData: ITableExerciseRow) => void;
  isEditing: boolean;
  isDraggingGroup: boolean;
  activeGroup: number | null;
  hoverRowIndex: number | null;
  showInsertButton: boolean;
  firstColumnRef: React.RefObject<HTMLTableCellElement | null>;
  handleAddExerciseAtPosition: (index: number) => void;
  rowClassName: (rowData: ITableRow) => string;
  isDarkMode: boolean;
  intl: any;
  setHoverRowIndex: (index: number | null) => void;
  setShowInsertButton: (show: boolean) => void;
  isInsertButtonHovered: boolean;
  setIsInsertButtonHovered: (hovered: boolean) => void;
  insertPosition: 'above' | 'below';
  setInsertPosition: (position: 'above' | 'below') => void;
}

// ==================== SORTABLE ROW COMPONENT ====================

function SortableRowComponent({
  rowData,
  index,
  renderNameColumn,
  renderDataCells,
  handleDeleteExercise,
  isEditing,
  isDraggingGroup,
  activeGroup,
  hoverRowIndex,
  showInsertButton,
  firstColumnRef,
  handleAddExerciseAtPosition,
  rowClassName,
  isDarkMode,
  intl,
  setHoverRowIndex,
  setShowInsertButton,
  isInsertButtonHovered,
  setIsInsertButtonHovered,
  insertPosition,
  setInsertPosition
}: ISortableRowProps) {
  const rowKey =
    rowData.rowType === 'group' ? `group-${rowData.groupNumber}` : `ex-${rowData.groupNumber}-${rowData.rowIndex}`;

  const isDraggable =
    isEditing &&
    (rowData.rowType === 'group' || (rowData.rowType === 'exercise' && !isDraggingGroup && !rowData.isDragDisabled));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowKey,
    disabled: !isDraggable
  });

  const style: Record<string, any> = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    ...(isDragging || (isDraggingGroup && rowData.isBeingDragged)
      ? {
          background: isDarkMode ? 'rgba(52, 73, 94, 0.95)' : 'rgba(248, 249, 250, 0.95)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          border: isDarkMode ? '2px solid #3498db' : '2px solid #4299e1',
          zIndex: 1000
        }
      : {}),
    ...(isDraggingGroup && rowData.groupNumber === activeGroup && !rowData.isBeingDragged
      ? {
          opacity: 0.6,
          background: isDarkMode ? 'rgba(52, 73, 94, 0.3)' : 'rgba(248, 249, 250, 0.3)',
          border: isDarkMode ? '1px dashed #3498db' : '1px dashed #4299e1'
        }
      : {})
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={`${rowClassName(rowData)} ${isDragging ? 'dragging' : ''} ${
          isDraggingGroup && rowData.isBeingDragged
            ? 'group-being-dragged'
            : isDraggingGroup && rowData.groupNumber === activeGroup && !rowData.isBeingDragged
              ? 'group-placeholder'
              : isDraggingGroup && rowData.rowType === 'group' && rowData.groupNumber !== activeGroup
                ? 'group-drop-zone'
                : isDraggingGroup
                  ? 'group-drag-active'
                  : ''
        }`}
        {...(isEditing && isDraggable ? { ...attributes, ...listeners } : {})}
      >
        {/* Hover area and insert button */}
        <td
          style={{
            width: '32px',
            minWidth: '32px',
            maxWidth: '32px',
            padding: 0,
            position: 'relative',
            background: 'transparent',
            border: 'none',
            zIndex: 2
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (y < rect.height / 2) {
              setInsertPosition('above');
            } else {
              setInsertPosition('below');
            }
            if (isEditing) {
              setHoverRowIndex(index);
              setShowInsertButton(true);
            }
          }}
          onMouseLeave={() => {
            setTimeout(() => {
              if (!isInsertButtonHovered) {
                setHoverRowIndex(null);
                setShowInsertButton(false);
              }
            }, 50);
          }}
        >
          {isEditing && showInsertButton && hoverRowIndex === index && (
            <Button
              onMouseEnter={() => setIsInsertButtonHovered(true)}
              onMouseLeave={() => {
                setIsInsertButtonHovered(false);
                setHoverRowIndex(null);
                setShowInsertButton(false);
              }}
              onClick={() => handleAddExerciseAtPosition(index)}
              style={{
                position: 'absolute',
                left: '-10px',
                [insertPosition === 'above' ? 'top' : 'bottom']: '-12px',
                transform: 'translateY(0%)',
                zIndex: 10,
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'background 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                outline: 'none',
                padding: 0
              }}
              title={intl.formatMessage({
                id: 'workoutTable.insertExercise',
                defaultMessage: 'Insert exercise here'
              })}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                <FaPlus style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }} />
              </span>
            </Button>
          )}
        </td>
        <td ref={firstColumnRef} className={`name-column ${isEditing ? 'editable-column' : ''}`}>
          <div className="name-column-content">
            {isEditing && isDraggable && <FaGripVertical className="drag-handle" />}
            {isEditing && rowData.rowType === 'exercise' && (
              <FaTrash
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExercise(rowData as ITableExerciseRow);
                }}
              />
            )}
            {rowData.rowType === 'group' && (
              <div
                className="group-indicator"
                style={{
                  backgroundColor: `hsl(${(rowData.groupNumber * 35) % 360}, 70%, ${isDarkMode ? '45%' : '60%'})`
                }}
              />
            )}
            <div className="name-value">{renderNameColumn(rowData)}</div>
          </div>
        </td>
        {renderDataCells(rowData)}
      </tr>
    </>
  );
}

const SortableRow = memo(SortableRowComponent);

// ==================== MAIN COMPONENT ====================

export default function NewWorkoutTable({
  cycleOptions,
  clientData,
  isExcelOnlyMode = false,
  clientName = '',
  onToggleExcelMode
}: INewWorkoutTableProps) {
  const hook = useNewWorkoutTable({ cycleOptions, clientData, isExcelOnlyMode, clientName, onToggleExcelMode });

  const {
    intl,
    isDarkMode,
    isEditing,
    setIsEditing,
    cycleId,
    setCycleId,
    dayNumber,
    setDayNumber,
    isLoading,
    numWeeks,
    tableData,
    rpeMethod,
    isDraggingGroup,
    activeId,
    activeGroup,
    newCycleDialogVisible,
    setNewCycleDialogVisible,
    propDialogVisible,
    setPropDialogVisible,
    newProp,
    setNewProp,
    availableProps,
    setExtraProps,
    hoverRowIndex,
    setHoverRowIndex,
    showInsertButton,
    setShowInsertButton,
    isInsertButtonHovered,
    setIsInsertButtonHovered,
    insertPosition,
    setInsertPosition,
    dayOptions,
    propertyLabels,
    tableStyles,
    usedProps,
    sensors,
    firstColumnRef,
    coachExercises,
    rowClassName,
    selectHeaderName,
    handleDragStart,
    handleDragEnd,
    handleCancelEdit,
    handleAddExerciseAtPosition,
    handleAddGroup,
    handleAddExercise,
    handleSaveChanges,
    handlePropertyChange,
    handlePropertyBlur,
    handleExerciseNameChange,
    handleGroupLabelChange,
    handleDeleteExercise,
    getYouTubeThumbnail,
    videoDialogVisible,
    setVideoDialogVisible,
    selectedVideoUrl,
    handleVideoClick
  } = hook;

  // ==================== RENDER HELPERS ====================

  const renderNameColumn = (rowData: ITableRow): JSX.Element | string => {
    if (rowData.rowType === 'group') {
      const groupRow = rowData as ITableGroupRow;
      return isEditing ? (
        <InputText
          value={groupRow.label || `Group ${groupRow.groupNumber}`}
          onChange={(e) => handleGroupLabelChange(groupRow, e.target.value)}
          style={{ width: '100%' }}
        />
      ) : (
        groupRow.label || `Group ${groupRow.groupNumber}`
      );
    }

    const exerciseRow = rowData as ITableExerciseRow;
    const exerciseObj = coachExercises.find((ex: any) => ex.name === exerciseRow.name);
    const videoUrl = exerciseObj?.multimedia;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {videoUrl && (
          <img
            src={getYouTubeThumbnail(videoUrl)}
            alt="Video thumbnail"
            style={{
              width: 48,
              height: 27,
              objectFit: 'cover',
              borderRadius: 4,
              cursor: 'pointer',
              marginRight: 8,
              border: '1px solid #ccc'
            }}
            onClick={() => handleVideoClick(videoUrl)}
            title={intl.formatMessage({ id: 'exercise.video.view' })}
          />
        )}
        {isEditing ? (
          <Dropdown
            value={exerciseRow.name}
            options={coachExercises.map((ex: any) => ({ label: ex.name, value: ex.name }))}
            onChange={(e) => handleExerciseNameChange(exerciseRow, e.value)}
            filter
            showClear={false}
            className="w-full"
            style={{ width: '100%' }}
            placeholder={intl.formatMessage({ id: 'exercise.selectExercise' })}
          />
        ) : (
          exerciseRow.name || '-'
        )}
      </div>
    );
  };

  const renderEditableCell = useCallback(
    (rowData: ITableRow, prop: string, weekNum: number, currentValue: any) => {
      if (!rowData.weeksData[weekNum]) {
        rowData.weeksData[weekNum] = { exerciseInstanceId: null };
      }

      switch (prop) {
        case 'sets':
        case 'repetitions':
        case 'weight':
        case 'time':
        case 'restInterval':
        case 'duration':
        case 'distance':
        case 'tempo':
        case 'difficulty':
          return (
            <InputText
              value={currentValue === undefined || currentValue === null ? '' : currentValue}
              onBlur={() => handlePropertyBlur(rowData, prop, weekNum)}
              onChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.target.value)}
              size={1}
              className="p-inputtext-sm w-full"
            />
          );
        case 'notes':
          return (
            <InputText
              value={currentValue || ''}
              onBlur={() => handlePropertyBlur(rowData, prop, weekNum)}
              onChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.target.value)}
              className="p-inputtext-sm w-full"
            />
          );
        default:
          return currentValue;
      }
    },
    [handlePropertyBlur, handlePropertyChange]
  );

  const renderDataCells = useCallback(
    (rowData: ITableRow): JSX.Element[] | null => {
      if (!usedProps) return null;

      if (rowData.rowType === 'group') {
        const totalColumns = usedProps.reduce((acc: number, list: string[]) => acc + list.length, 0);
        return Array.from({ length: totalColumns }).map((_, idx) => (
          <td key={`group-${rowData.groupNumber}-${idx}`} className="group-empty-cell" />
        ));
      }

      return usedProps.flatMap((propsList: string[], weekIndex: number) => {
        const realWeek = weekIndex + 1;
        return propsList.map((prop: string) => {
          const cellKey = `ex-${(rowData as ITableExerciseRow).name}-w${realWeek}-${prop}`;
          const cellValue =
            rowData.weeksData[realWeek] && rowData.weeksData[realWeek][prop] != null
              ? rowData.weeksData[realWeek][prop]
              : '';

          return (
            <td key={cellKey} className={`data-cell ${prop === 'weight' ? 'text-left' : ''}`}>
              {isEditing ? renderEditableCell(rowData, prop, realWeek, cellValue) : cellValue}
            </td>
          );
        });
      });
    },
    [usedProps, isEditing, renderEditableCell]
  );

  const renderTableHeader = useCallback(() => {
    if (!numWeeks || !usedProps) return null;

    return (
      <thead>
        <tr className="table-header-row">
          <th
            style={{
              width: '32px',
              minWidth: '32px',
              maxWidth: '32px',
              padding: 0,
              background: 'transparent',
              border: 'none'
            }}
            rowSpan={2}
          ></th>
          <th rowSpan={2} className="exercise-column">
            {intl.formatMessage({ id: 'workoutTable.exercise' })}
          </th>
          {usedProps.map((propsList: string[], i: number) => (
            <th key={`week${i}`} colSpan={propsList.length} className="week-header">
              {intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}
            </th>
          ))}
        </tr>
        <tr className="property-header-row">
          {usedProps.map((propsList: string[], i: number) =>
            propsList.map((prop: string) => (
              <th className="property-header" key={`${prop}-header-${i}`}>
                {prop === 'weight' ? (
                  <div className="flex align-items-center justify-between">
                    {propertyLabels[prop]}
                    <Button
                      icon="pi pi-plus"
                      className="p-button-text p-button-sm"
                      onClick={() => setPropDialogVisible(true)}
                    />
                  </div>
                ) : (
                  selectHeaderName(prop)
                )}
              </th>
            ))
          )}
        </tr>
      </thead>
    );
  }, [numWeeks, usedProps, intl, rpeMethod, propertyLabels, selectHeaderName, setPropDialogVisible]); // eslint-disable-line

  const dayItemTemplate = (option: IDayOption) => {
    const result = hook.dayItemTemplate(option);
    return <div className={`day-option ${result.isUsed ? 'highlighted-option' : ''}`}>{result.label}</div>;
  };

  // ==================== MAIN RENDER ====================

  return (
    <div
      className={`workout-table-container ${isDarkMode ? 'dark-mode' : ''} ${isExcelOnlyMode ? 'fullscreen-mode' : ''}`}
    >
      {/* 1) Cycle & Day selection */}
      <div className="cycle-day-selector">
        {isExcelOnlyMode && (
          <div className="excel-internal-header">
            <h3 className="m-0">
              <i className="pi pi-table mr-2"></i>
              {intl.formatMessage({ id: 'clientDashboard.tabs.excelView' })} - {clientName}
            </h3>
          </div>
        )}
        <div className="field">
          <label className="selector-label">{intl.formatMessage({ id: 'common.cycle' })}</label>
          <Dropdown
            inputId="cycle"
            value={cycleId}
            options={cycleOptions}
            onChange={(e) => setCycleId(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectCycle' })}
            optionLabel="label"
            optionValue="value"
            className="p-inputtext-sm w-full"
            itemTemplate={(option: any) => (
              <div className={option.value === -1 ? 'highlighted-option' : ''}>{option.label}</div>
            )}
            appendTo={isExcelOnlyMode ? 'self' : undefined}
            panelStyle={isExcelOnlyMode ? { zIndex: 10001 } : {}}
          />
        </div>
        <div className="field">
          <label className="selector-label">{intl.formatMessage({ id: 'common.day' })}</label>
          <Dropdown
            inputId="day"
            value={dayNumber}
            options={dayOptions}
            onChange={(e) => setDayNumber(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectDay' })}
            optionLabel="label"
            optionValue="value"
            className="p-inputtext-sm w-full"
            itemTemplate={dayItemTemplate}
            disabled={!cycleId}
            appendTo={isExcelOnlyMode ? 'self' : undefined}
            panelStyle={isExcelOnlyMode ? { zIndex: 10001 } : {}}
          />
        </div>
      </div>

      {/* 2) Editing Buttons */}
      <div className="table-action-buttons">
        {!isEditing ? (
          <button className="p-button p-component p-button-outlined" onClick={() => setIsEditing(true)}>
            <i className="pi pi-pencil mr-2"></i>
            {intl.formatMessage({ id: 'common.edit' })}
          </button>
        ) : (
          <div className="flex justify-content-between">
            <div className="flex align-items-center justify-content-between gap-1">
              <button className="p-button p-component p-button-success" onClick={handleSaveChanges}>
                <FaSave className="mr-2" />
                {intl.formatMessage({ id: 'common.save' })}
              </button>

              <button className="p-button p-component p-button-secondary" onClick={() => handleAddExercise()}>
                <FaPlus className="mr-2" />
                {intl.formatMessage({ id: 'plan.group.addExercise' })}
              </button>

              <button
                className="p-button p-component p-button-secondary"
                onClick={() => handleAddGroup(tableData.length)}
              >
                <FaPlus className="mr-2" />
                {intl.formatMessage({ id: 'plan.group.addGroup' })}
              </button>

              <button className="p-button p-component p-button-outlined p-button-danger" onClick={handleCancelEdit}>
                <i className="pi pi-times mr-2"></i>
                {intl.formatMessage({ id: 'common.cancel' })}
              </button>
            </div>
            <div className="changes-indicator ml-2 flex align-items-center">
              <i className="pi pi-info-circle"></i>
              <span>
                <FormattedMessage
                  id="workoutTable.editModeActive"
                  defaultMessage="Edit mode active. Drag to reorganize and click Save when done."
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4) Loading/Empty state */}
      {isLoading ? (
        <div className="workout-loading">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          <p>{intl.formatMessage({ id: 'exercise.properties.loading' })}</p>
        </div>
      ) : tableData.length === 0 ? (
        <div className="workout-no-data">
          <i className="pi pi-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <p>
            <FormattedMessage id="common.noData" />
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="workout-table-wrapper">
            <table className="workout-table" style={tableStyles}>
              {renderTableHeader()}
              <tbody>
                <SortableContext
                  items={
                    isDraggingGroup
                      ? tableData.filter((row) => row.rowType === 'group').map((row) => `group-${row.groupNumber}`)
                      : tableData.map((row) =>
                          row.rowType === 'group' ? `group-${row.groupNumber}` : `ex-${row.groupNumber}-${row.rowIndex}`
                        )
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {tableData.map((rowData, index) => (
                    <SortableRow
                      key={
                        rowData.rowType === 'group'
                          ? `group-${rowData.groupNumber}`
                          : `ex-${rowData.groupNumber}-${rowData.rowIndex}-${(rowData as ITableExerciseRow).exerciseInstanceId}`
                      }
                      rowData={rowData}
                      index={index}
                      renderNameColumn={renderNameColumn}
                      renderDataCells={renderDataCells}
                      handleDeleteExercise={handleDeleteExercise}
                      isEditing={isEditing}
                      isDraggingGroup={isDraggingGroup}
                      activeGroup={activeGroup}
                      hoverRowIndex={hoverRowIndex}
                      showInsertButton={showInsertButton}
                      firstColumnRef={firstColumnRef}
                      handleAddExerciseAtPosition={handleAddExerciseAtPosition}
                      rowClassName={rowClassName}
                      isDarkMode={isDarkMode}
                      intl={intl}
                      setHoverRowIndex={setHoverRowIndex}
                      setShowInsertButton={setShowInsertButton}
                      isInsertButtonHovered={isInsertButtonHovered}
                      setIsInsertButtonHovered={setIsInsertButtonHovered}
                      insertPosition={insertPosition}
                      setInsertPosition={setInsertPosition}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>

          <DragOverlay>
            {activeId ? (
              <table className={`workout-table drag-overlay-table ${isDraggingGroup ? 'group-drag' : ''}`}>
                <tbody>
                  {tableData
                    .filter((row) => {
                      if (isDraggingGroup) {
                        return row.isBeingDragged;
                      } else {
                        return row.rowType === 'group'
                          ? `group-${row.groupNumber}` === activeId
                          : `ex-${row.groupNumber}-${row.rowIndex}` === activeId;
                      }
                    })
                    .map((rowData, index) => (
                      <tr
                        key={`overlay-${index}`}
                        className={`${rowClassName(rowData)} dragging-overlay ${isDraggingGroup ? 'group-dragging-animation' : ''}`}
                      >
                        <td className="name-column dragging">
                          <div className="name-column-content">
                            <FaGripVertical className="drag-handle" />
                            {isDraggingGroup && <div className="group-drag-indicator" />}
                            <div className="name-value">
                              {rowData.rowType === 'group' && (
                                <div
                                  className="group-indicator"
                                  style={{
                                    backgroundColor: `hsl(${(rowData.groupNumber * 35) % 360}, 70%, ${isDarkMode ? '45%' : '60%'})`
                                  }}
                                ></div>
                              )}
                              {renderNameColumn(rowData)}
                            </div>
                          </div>
                        </td>
                        {renderDataCells(rowData)}
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Floating save/cancel in edit mode */}
      {isEditing && (
        <div className="floating-actions">
          <button
            className="p-button p-component p-button-success p-button-rounded"
            onClick={handleSaveChanges}
            title={intl.formatMessage({ id: 'common.save' })}
          >
            <FaSave />
          </button>
          <button
            className="p-button p-component p-button-danger p-button-rounded"
            onClick={handleCancelEdit}
            title={intl.formatMessage({ id: 'common.cancel' })}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
      )}

      <CreateTrainingCycleDialog
        clientId={clientData?.id}
        visible={newCycleDialogVisible}
        onHide={() => setNewCycleDialogVisible(false)}
        setRefreshKey={() => undefined}
      />
      <Dialog
        header="Add another column"
        visible={propDialogVisible}
        onHide={() => setPropDialogVisible(false)}
        footer={
          <Button
            label="Add"
            onClick={() => {
              if (newProp) {
                setExtraProps((prev: string[]) => [...prev, newProp]);
                setNewProp(null);
              }
              setPropDialogVisible(false);
            }}
          />
        }
      >
        <Dropdown
          value={newProp}
          options={availableProps.map((p: string) => ({ label: propertyLabels[p] || p, value: p }))}
          onChange={(e) => setNewProp(e.value)}
          placeholder="Select property..."
          className="w-full"
        />
      </Dialog>
      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={selectedVideoUrl ?? ''}
      />

      {/* Floating button to toggle Excel mode */}
      {onToggleExcelMode && (
        <Button
          icon={isExcelOnlyMode ? 'pi pi-eye' : 'pi pi-table'}
          className="p-button-rounded p-button-info excel-toggle-button-internal"
          onClick={onToggleExcelMode}
          tooltip={
            isExcelOnlyMode
              ? intl.formatMessage(
                  { id: 'clientDashboard.showFullDashboard' },
                  { defaultMessage: 'Show full dashboard' }
                )
              : intl.formatMessage({ id: 'clientDashboard.showExcelOnly' }, { defaultMessage: 'Show Excel view only' })
          }
          tooltipOptions={{ position: 'left' }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        />
      )}
    </div>
  );
}
