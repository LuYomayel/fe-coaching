import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { useIntl, FormattedMessage } from 'react-intl';
import { useStudentDialog } from '../hooks/dialogs/useStudentDialog';
import { Dialog } from 'primereact/dialog';

/**
 * Componente presentacional para el diálogo de estudiante
 * Toda la lógica de estado y validación está en el hook useStudentDialog
 */
const StudentDialog = ({ onClose, setRefreshKey, studentData, visible }) => {
  const intl = useIntl();
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));

  const {
    formData,
    loading,
    errors,
    isEditing,
    sessionModeOptions,
    contactMethodOptions,
    genders,
    fitnessGoals,
    activityLevels,
    updateField,
    handleSubmit
  } = useStudentDialog(studentData, onClose, setRefreshKey);

  return (
    <Dialog
      className="responsive-dialog "
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: '50vw' }}
      visible={visible}
      onHide={onClose}
      header={intl.formatMessage({ id: 'students.dialog.newStudent' })}
    >
      <div className="p-3">
        <div className="flex flex-row gap-2">
          <div className="p-field w-full">
            <label htmlFor="email">
              <FormattedMessage id="email" /> <span className="text-red-500">*</span>
            </label>
            <InputText
              id="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={isEditing}
              className={errors.email ? 'p-invalid w-full' : 'w-full'}
            />
            {errors.email && <small className="p-error">{errors.email}</small>}
          </div>
          <div className="p-field w-full">
            <label htmlFor="name">
              <FormattedMessage id="name" /> <span className="text-red-500">*</span>
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={errors.name ? 'p-invalid w-full' : 'w-full'}
            />
            {errors.name && <small className="p-error">{errors.name}</small>}
          </div>
        </div>

        <div className="p-field">
          <label htmlFor="gender">
            <FormattedMessage id="gender" />
          </label>
          <Dropdown
            id="gender"
            options={genders}
            value={formData.gender}
            optionLabel="label"
            optionValue="value"
            className="w-full"
            onChange={(e) => updateField('gender', e.target.value)}
          />
        </div>

        <div className="flex flex-row gap-2">
          <div className="p-field w-full">
            <label htmlFor="fitnessGoal">
              <FormattedMessage id="fitnessGoal" />
            </label>
            <MultiSelect
              id="fitnessGoal"
              options={fitnessGoals}
              value={formData.fitnessGoal ? formData.fitnessGoal.split(',') : []}
              onChange={(e) => updateField('fitnessGoal', e.value.join(','))}
              className="w-full"
            />
          </div>
          {formData.fitnessGoal.includes('other') && (
            <div className="p-field w-full">
              <label htmlFor="customFitnessGoal">
                <FormattedMessage id="fitnessGoal.custom" />
              </label>
              <InputText
                id="customFitnessGoal"
                value={formData.customFitnessGoal}
                onChange={(e) => updateField('customFitnessGoal', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="p-field">
          <label htmlFor="activityLevel">
            <FormattedMessage id="activityLevel" />
          </label>
          <Dropdown
            id="activityLevel"
            options={activityLevels}
            value={formData.activityLevel}
            onChange={(e) => updateField('activityLevel', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-row gap-2 align-items-center justify-content-between">
          <div className="p-field">
            <label htmlFor="height">
              <FormattedMessage id="height" /> {propertyUnits?.height ? `(${propertyUnits?.height})` : ''}
            </label>

            <InputNumber
              id="height"
              value={formData.height}
              onChange={(e) => updateField('height', e.value)}
              suffix={propertyUnits?.height}
              maxLength={3}
              min={0}
              className={`${errors.height ? 'p-invalid' : ''} w-full`}
            />

            {errors.height && <small className="p-error">{errors.height}</small>}
          </div>

          <div className="p-field">
            <label htmlFor="weight ">
              <FormattedMessage id="weight" /> {propertyUnits?.weight ? `(${propertyUnits?.weight})` : ''}
            </label>
            <InputNumber
              id="weight"
              value={formData.weight}
              onChange={(e) => updateField('weight', e.value)}
              suffix={propertyUnits?.weight}
              maxLength={3}
              min={0}
              className={`${errors.weight ? 'p-invalid' : ''} w-full`}
            />
            {errors.weight && <small className="p-error">{errors.weight}</small>}
          </div>
        </div>

        <div className="p-field">
          <label htmlFor="birthdate">
            <FormattedMessage id="birthdate" />
          </label>
          <Calendar
            id="birthdate"
            locale={intl.locale}
            dateFormat="dd/mm/yy"
            value={formData.birthdate}
            onChange={(e) => updateField('birthdate', e.target.value)}
            className={`${errors.birthdate ? 'p-invalid' : ''} w-full`}
          />
          {errors.birthdate && <small className="p-error">{errors.birthdate}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="sessionMode">
            <FormattedMessage id="student.sessionMode" />
          </label>
          <Dropdown
            id="sessionMode"
            value={formData.sessionMode}
            options={sessionModeOptions}
            onChange={(e) => updateField('sessionMode', e.value)}
            placeholder={intl.formatMessage({ id: 'student.selectSessionMode' })}
            className="w-full"
          />
        </div>

        {formData.sessionMode === 'presencial' && (
          <div className="p-field">
            <label htmlFor="location">
              <FormattedMessage id="student.location" />
            </label>
            <InputText
              id="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
              className={errors.location ? 'p-invalid w-full' : 'w-full'}
            />
            {errors.location && <small className="p-error">{errors.location}</small>}
          </div>
        )}

        {formData.sessionMode === 'virtual_sincronico' && (
          <div className="p-field">
            <label htmlFor="contactMethod">
              <FormattedMessage id="student.contactMethod" />
            </label>
            <Dropdown
              id="contactMethod"
              value={formData.contactMethod}
              options={contactMethodOptions}
              onChange={(e) => updateField('contactMethod', e.value)}
              placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
              className={errors.contactMethod ? 'p-invalid w-full' : 'w-full'}
            />
            {errors.contactMethod && <small className="p-error">{errors.contactMethod}</small>}
          </div>
        )}

        {formData.sessionMode === 'hibrido' && (
          <>
            <div className="p-field">
              <label htmlFor="location">
                <FormattedMessage id="student.location" />
              </label>
              <InputText
                id="location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder={intl.formatMessage({ id: 'student.locationPlaceholder' })}
                className={errors.location ? 'p-invalid w-full' : 'w-full'}
              />
              {errors.location && <small className="p-error">{errors.location}</small>}
            </div>
            <div className="p-field">
              <label htmlFor="contactMethod">
                <FormattedMessage id="student.contactMethod" />
              </label>
              <Dropdown
                id="contactMethod"
                value={formData.contactMethod}
                options={contactMethodOptions}
                onChange={(e) => updateField('contactMethod', e.value)}
                placeholder={intl.formatMessage({ id: 'student.selectContactMethod' })}
                className={errors.contactMethod ? 'p-invalid w-full' : 'w-full'}
              />
              {errors.contactMethod && <small className="p-error">{errors.contactMethod}</small>}
            </div>
          </>
        )}

        <Button label={intl.formatMessage({ id: 'save' })} icon="pi pi-save" loading={loading} onClick={handleSubmit} />
      </div>
    </Dialog>
  );
};

export default StudentDialog;
