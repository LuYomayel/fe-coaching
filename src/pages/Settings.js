import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useSpinner } from '../utils/GlobalSpinner';
export default function Settings() {
  const intl = useIntl();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { locale, switchLanguage } = useLanguage();
  const [viewPreference, setViewPreference] = useState('default');
  const [allowIncompleteStudent, setAllowIncompleteStudent] = useState(true);
  const [developerOptions, setDeveloperOptions] = useState(false);
  const { setLoading } = useSpinner();
  const viewOptions = [
    { label: intl.formatMessage({ id: 'settings.view.default' }), value: 'default' },
    { label: intl.formatMessage({ id: 'settings.view.excel' }), value: 'excel' }
  ];

  const languageOptions = [
    { label: intl.formatMessage({ id: 'settings.language.es' }), value: 'es' },
    { label: intl.formatMessage({ id: 'settings.language.en' }), value: 'en' }
  ];

  const handleLanguageChange = (e) => {
    switchLanguage(e.value);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
        localStorage.setItem('theme', JSON.stringify(isDarkMode));
        localStorage.setItem('locale', locale);
        setLoading(false);
    }, 1000);
  };

  const handleCancel = () => {
    setLoading(true);
    setTimeout(() => {
      setIsDarkMode(JSON.parse(localStorage.getItem('theme')))
      switchLanguage(localStorage.getItem('locale'))
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="settings-page p-3 w-6 m-auto">
      <Card title={intl.formatMessage({ id: 'settings.title' })}>
        <div className="field-checkbox">
        <Checkbox
            inputId="darkMode"
            checked={isDarkMode}
            onChange={(e) => setIsDarkMode(e.checked)}
          />
          <label htmlFor="darkMode"><FormattedMessage id="settings.darkMode" /></label>
        </div>

        <div className="field">
          <label htmlFor="language"><FormattedMessage id="settings.language" /></label>
          <Dropdown id="language" value={locale} options={languageOptions} onChange={handleLanguageChange} />
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
          <Button label={intl.formatMessage({ id: 'common.save' })} icon="pi pi-check" onClick={handleSave}/>
          <Button label={intl.formatMessage({ id: 'common.cancel' })} icon="pi pi-times" onClick={handleCancel}/>
        </div>
      </Card>
    </div>
  );
}
