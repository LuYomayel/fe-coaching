import React from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Steps } from 'primereact/steps';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { useIntl, FormattedMessage } from 'react-intl';

import SubscriptionPaymentPage from './SubscriptionPayment';
import { useCoachProfileForm, trainingTypeOptions } from '../hooks/coach/useCoachProfileForm';

const CoachProfileForm = () => {
  const intl = useIntl();
  const {
    steps,
    activeStep,
    formValues,
    formErrors,
    loading,
    plansLoading,
    summaryItems,
    selectedPlan,
    isPlanDialogVisible,
    openPlanDialog,
    closePlanDialog,
    handleInputChange,
    handleTrainingTypeChange,
    handleGymToggle,
    handleSubscriptionChange,
    handleNext,
    handleBack,
    handlePlanConfirmed
  } = useCoachProfileForm();

  const renderError = (field) =>
    formErrors[field] ? (
      <small className="p-error block mt-1" role="alert">
        {formErrors[field]}
      </small>
    ) : null;

  const SectionTitle = ({ titleId, subtitleId }) => (
    <div className="flex flex-column gap-1">
      <h2 className="m-0">{intl.formatMessage({ id: titleId })}</h2>
      <p className="text-600 m-0">{intl.formatMessage({ id: subtitleId })}</p>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="flex flex-column">
      <SectionTitle titleId="coachProfileForm.step.personalInfo" subtitleId="coachProfileForm.subtitle.personalInfo" />
      <div className="flex flex-column gap-3">
        <div className="flex flex-column gap-2">
          <label htmlFor="name">
            <FormattedMessage id="coachProfileForm.name" />
          </label>
          <InputText
            id="name"
            value={formValues.name}
            onChange={handleInputChange('name')}
            className={classNames({ 'p-invalid': formErrors.name })}
            placeholder={intl.formatMessage({ id: 'coachProfileForm.placeholder.name' })}
          />
          {renderError('name')}
        </div>
        <div className="flex flex-column gap-2">
          <label htmlFor="bio">
            <FormattedMessage id="coachProfileForm.bio" />
          </label>
          <InputTextarea
            id="bio"
            autoResize
            rows={4}
            value={formValues.bio}
            onChange={handleInputChange('bio')}
            className={classNames({ 'p-invalid': formErrors.bio })}
            placeholder={intl.formatMessage({ id: 'coachProfileForm.placeholder.bio' })}
          />
          {renderError('bio')}
        </div>
        <div className="flex flex-column gap-2">
          <label htmlFor="experience">
            <FormattedMessage id="coachProfileForm.experience" />
          </label>
          <InputTextarea
            id="experience"
            autoResize
            rows={4}
            value={formValues.experience}
            onChange={handleInputChange('experience')}
            className={classNames({ 'p-invalid': formErrors.experience })}
            placeholder={intl.formatMessage({ id: 'coachProfileForm.placeholder.experience' })}
          />
          {renderError('experience')}
        </div>
      </div>
    </div>
  );

  const renderTrainingDetails = () => (
    <div className="flex flex-column gap-4">
      <SectionTitle
        titleId="coachProfileForm.step.trainingDetails"
        subtitleId="coachProfileForm.subtitle.trainingDetails"
      />
      <div className="flex flex-column gap-2">
        <label htmlFor="trainingSpecialties" className="flex align-items-center justify-content-between">
          <span>
            <FormattedMessage id="coachProfileForm.trainingType" />
          </span>
          <Tag value={<FormattedMessage id="coachProfileForm.helper.training" />} severity="info" />
        </label>
        <MultiSelect
          id="trainingSpecialties"
          value={formValues.trainingSpecialties}
          options={trainingTypeOptions}
          optionLabel="label"
          onChange={handleTrainingTypeChange}
          className={classNames({ 'p-invalid': formErrors.trainingSpecialties })}
          placeholder={intl.formatMessage({ id: 'coachProfileForm.selectTrainingTypes' })}
          display="chip"
        />
        {renderError('trainingSpecialties')}
      </div>
      <div className="flex align-items-center gap-2">
        <Checkbox inputId="hasGym" checked={formValues.hasGym} onChange={handleGymToggle} />
        <label htmlFor="hasGym">
          <FormattedMessage id="coachProfileForm.hasGym" />
        </label>
      </div>
      <div className="flex flex-column gap-2">
        <label htmlFor="gymLocation">
          <FormattedMessage id="coachProfileForm.gymLocation" />
        </label>
        <InputText
          id="gymLocation"
          value={formValues.gymLocation}
          onChange={handleInputChange('gymLocation')}
          disabled={!formValues.hasGym}
          className={classNames({ 'p-invalid': formErrors.gymLocation })}
          placeholder={intl.formatMessage({ id: 'coachProfileForm.placeholder.gymLocation' })}
        />
        {renderError('gymLocation')}
      </div>
    </div>
  );

  const renderSubscription = () => {
    const subscriptionOptions = [
      {
        key: 'freeTrial',
        title: intl.formatMessage({ id: 'coachProfileForm.freeTrial' }),
        description: intl.formatMessage({ id: 'coachProfileForm.helper.freeTrial' }),
        accent: 'success'
      }
      /* TODO: Add paid plan when it's available
      {
        key: 'paid',
        title: intl.formatMessage({ id: 'coachProfileForm.paid' }),
        description: intl.formatMessage({ id: 'coachProfileForm.helper.paid' }),
        accent: 'info'
      }
        */
    ];

    const showPlanCta = formValues.subscriptionType === 'paid' && !selectedPlan;

    return (
      <div className="flex flex-column gap-3">
        <SectionTitle
          titleId="coachProfileForm.step.subscription"
          subtitleId="coachProfileForm.subtitle.subscription"
        />
        <div className="grid">
          {subscriptionOptions.map((option) => (
            <div key={option.key} className="col-12 md:col-6">
              <Card
                className={classNames(
                  'p-4 border-1 border-round-2xl surface-card shadow-2 cursor-pointer transition-all transition-duration-200',
                  { 'border-primary shadow-4': formValues.subscriptionType === option.key }
                )}
                onClick={() => handleSubscriptionChange(option.key)}
              >
                <div className="flex justify-content-between align-items-start gap-3">
                  <div className="flex flex-column gap-1">
                    <h4 className="m-0">{option.title}</h4>
                    <p className="m-0 text-600">{option.description}</p>
                  </div>
                  <Tag value={option.key === 'freeTrial' ? 'FREE' : 'PRO'} severity={option.accent} />
                </div>
                {option.key === 'paid' && formValues.subscriptionType === 'paid' && selectedPlan && (
                  <div className="flex justify-content-between align-items-center border-round-lg bg-primary-50 p-3 mt-3">
                    <div className="flex flex-column">
                      <span className="text-600 text-xs text-uppercase">
                        <FormattedMessage id="coachProfileForm.subscriptionPlan" />
                      </span>
                      <h5 className="m-0">{selectedPlan.name}</h5>
                    </div>
                    <div className="text-right">
                      {selectedPlan.price && (
                        <p className="m-0 text-xl font-semibold">
                          ${selectedPlan.price}
                          <span className="text-sm font-normal ml-1 text-600">/month</span>
                        </p>
                      )}
                      {selectedPlan.max_clients && (
                        <Tag
                          severity="secondary"
                          value={`${selectedPlan.max_clients} ${intl.formatMessage({ id: 'coachProfileForm.clients' })}`}
                        />
                      )}
                    </div>
                  </div>
                )}
                {option.key === 'paid' && formValues.subscriptionType === 'paid' && (
                  <Button
                    type="button"
                    label={intl.formatMessage({ id: 'coachProfileForm.choosePlan' })}
                    className="p-button-outlined w-full mt-3"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPlanDialog();
                    }}
                  />
                )}
              </Card>
            </div>
          ))}
        </div>
        {renderError('subscriptionType')}
        {renderError('planId')}
        {showPlanCta && (
          <Button
            type="button"
            label={intl.formatMessage({ id: 'coachProfileForm.plan.cta' })}
            onClick={openPlanDialog}
          />
        )}
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-column gap-3">
      <SectionTitle titleId="coachProfileForm.step.confirmation" subtitleId="coachProfileForm.subtitle.confirmation" />
      <Card className="border-1 border-round-2xl surface-card shadow-1 p-4">
        <h3 className="mt-0">
          <FormattedMessage id="coachProfileForm.summary" />
        </h3>
        <div className="flex flex-column gap-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex flex-column gap-1 border-bottom-1 surface-border pb-2">
              <span className="text-600 text-xs text-uppercase">{item.label}</span>
              <div className="font-semibold">
                {Array.isArray(item.value)
                  ? item.value.map((chip) => <Tag key={chip} value={chip} severity="secondary" className="mr-2 mb-2" />)
                  : item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-content-between align-items-center gap-3 flex-wrap">
          <span className="text-600 text-xs text-uppercase">
            <FormattedMessage id="coachProfileForm.subscriptionPlan" />
          </span>
          {selectedPlan ? (
            <div className="flex flex-column text-right">
              <h4 className="m-0">{selectedPlan.name}</h4>
              <p className="m-0 text-600">
                {selectedPlan.price ? `$${selectedPlan.price}/month · ` : ''}
                {selectedPlan.max_clients &&
                  `${selectedPlan.max_clients} ${intl.formatMessage({ id: 'coachProfileForm.clients' })}`}
              </p>
            </div>
          ) : (
            <span className="text-600">
              <FormattedMessage id="coachProfileForm.plan.notSelected" />
            </span>
          )}
        </div>
      </Card>
    </div>
  );

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderTrainingDetails();
      case 2:
        return renderSubscription();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <div className="surface-ground min-h-screen p-4">
      <div className="max-w-screen-lg mx-auto flex flex-column gap-4">
        <header className="flex flex-column gap-1">
          <h1 className="m-0">
            <FormattedMessage id="coachProfileForm.title" />
          </h1>
          <p className="m-0 text-600">
            <FormattedMessage id="coachProfileForm.subtitle.personalInfo" />
          </p>
        </header>
        <Steps model={steps} activeIndex={activeStep} readOnly className="surface-card shadow-2 border-round-2xl p-3" />
        <div className="grid">
          <div className="col-12 lg:col-8">
            <Card className="surface-card shadow-3 border-round-2xl p-4">{renderStep()}</Card>
            <div className="flex flex-column sm:flex-row justify-content-between gap-3 mt-3">
              <Button
                type="button"
                label={intl.formatMessage({ id: 'common.back' })}
                icon="pi pi-arrow-left"
                outlined
                disabled={activeStep === 0}
                onClick={handleBack}
              />
              <Button
                type="button"
                label={intl.formatMessage({
                  id: activeStep === steps.length - 1 ? 'coachProfileForm.submit' : 'common.next'
                })}
                iconPos="right"
                icon={activeStep === steps.length - 1 ? 'pi pi-check' : 'pi pi-arrow-right'}
                onClick={handleNext}
                loading={loading}
              />
            </div>
          </div>
          <div className="col-12 lg:col-4">
            <Card className="surface-card shadow-2 border-round-2xl p-4">
              <h3 className="mt-0">
                <FormattedMessage id="coachProfileForm.summary" />
              </h3>
              <div className="flex flex-column gap-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex flex-column gap-1 border-bottom-1 surface-border pb-2">
                    <span className="text-600 text-xs text-uppercase">{item.label}</span>
                    <div className="font-semibold">
                      {Array.isArray(item.value)
                        ? item.value.map((chip) => (
                            <Tag key={chip} value={chip} severity="secondary" className="mr-2 mb-2" />
                          ))
                        : item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Dialog
        header={intl.formatMessage({ id: 'coachProfileForm.dialog.header' })}
        visible={isPlanDialogVisible}
        style={{ width: '50vw' }}
        className="surface-card border-round-2xl"
        onHide={closePlanDialog}
        draggable={false}
        dismissableMask
      >
        <SubscriptionPaymentPage onPlanConfirmed={handlePlanConfirmed} onClose={closePlanDialog} />
      </Dialog>
    </div>
  );
};

export default CoachProfileForm;
