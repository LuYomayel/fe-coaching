import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useUserSettings } from '../hooks/useUserSettings';

import { InputText } from 'primereact/inputtext';
import { Accordion, AccordionTab } from 'primereact/accordion';
export default function Settings() {
  const intl = useIntl();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { locale, switchLanguage } = useLanguage();
  const userSettings = useUserSettings();
  const { setLoading } = useSpinner();

  const [propertyUnits, setPropertyUnits] = useState({
    height: 'cm',
    sets: '',
    repetitions: '',
    time: 's',
    weight: 'kg',
    restInterval: 's',
    tempo: '',
    difficulty: '',
    duration: 's',
    distance: 'km'
  });

  const languageOptions = [
    { label: intl.formatMessage({ id: 'settings.language.es' }), value: 'es' },
    { label: intl.formatMessage({ id: 'settings.language.en' }), value: 'en' }
  ];

  const handleLanguageChange = (e) => {
    switchLanguage(e.value);
  };

  const handleUnitChange = (propertyKey, unit) => {
    setPropertyUnits((prevUnits) => ({
      ...prevUnits,
      [propertyKey]: unit
    }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      userSettings.saveAllSettings({
        theme: isDarkMode,
        locale,
        units: propertyUnits
      });
      setLoading(false);
    }, 10000);
  };

  const handleCancel = () => {
    setLoading(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        const savedLocale = localStorage.getItem('locale');
        if (savedTheme) setIsDarkMode(JSON.parse(savedTheme));
        if (savedLocale) switchLanguage(savedLocale);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="settings-page p-3 w-6 m-auto">
      <Card title={intl.formatMessage({ id: 'settings.title' })}>
        <div className="field-checkbox">
          <Checkbox inputId="darkMode" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.checked)} />
          <label htmlFor="darkMode">
            <FormattedMessage id="settings.darkMode" />
          </label>
        </div>

        <div className="field">
          <label htmlFor="language">
            <FormattedMessage id="settings.language" />
          </label>
          <Dropdown id="language" value={locale} options={languageOptions} onChange={handleLanguageChange} />
        </div>
        <div className="field">
          <Accordion>
            <AccordionTab header={intl.formatMessage({ id: 'settings.unitConfiguration' })}>
              {Object.keys(propertyUnits).map((propertyKey) => (
                <div key={propertyKey} className="flex justify-content-between align-items-center mb-2">
                  <span className="mr-4">
                    {intl.formatMessage({
                      id: `exercise.properties.${propertyKey === 'repetitions' ? 'reps' : propertyKey}`
                    })}
                  </span>
                  <InputText
                    value={propertyUnits[propertyKey]}
                    onChange={(e) => handleUnitChange(propertyKey, e.target.value)}
                    placeholder="Enter Unit"
                    style={{ width: '120px' }}
                  />
                </div>
              ))}
            </AccordionTab>
          </Accordion>
        </div>
        {/*
        <div className="field">
          <label htmlFor="viewPreference"><FormattedMessage id="settings.viewPreference" /></label>
          <Dropdown id="viewPreference" value={viewPreference} options={viewOptions} onChange={(e) => setViewPreference(e.value)} />
        </div>

        

        <div className="field-checkbox">
          <Checkbox inputId="allowIncompleteStudent" checked={allowIncompleteStudent} onChange={(e) => setAllowIncompleteStudent(e.checked)} />
          <label htmlFor="allowIncompleteStudent"><FormattedMessage id="settings.allowIncompleteStudent" /></label>
        </div>

        <div className="field-checkbox">
          <Checkbox inputId="developerOptions" checked={developerOptions} onChange={(e) => setDeveloperOptions(e.checked)} />
          <label htmlFor="developerOptions"><FormattedMessage id="settings.developerOptions" /></label>
        </div>
        */}

        <div className="flex justify-content-around">
          <Button label={intl.formatMessage({ id: 'common.save' })} icon="pi pi-check" onClick={handleSave} />
          <Button label={intl.formatMessage({ id: 'common.cancel' })} icon="pi pi-times" onClick={handleCancel} />
        </div>
      </Card>
    </div>
  );
}
