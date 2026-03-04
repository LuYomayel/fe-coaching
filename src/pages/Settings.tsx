import { useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { InputText } from 'primereact/inputtext';
import { Accordion, AccordionTab } from 'primereact/accordion';

interface IPropertyUnits {
  height: string;
  sets: string;
  repetitions: string;
  time: string;
  weight: string;
  restInterval: string;
  tempo: string;
  difficulty: string;
  duration: string;
  distance: string;
}

const DEFAULT_UNITS: IPropertyUnits = {
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
};

export default function Settings() {
  const intl = useIntl();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { locale, switchLanguage } = useLanguage();
  const { setLoading } = useSpinner();

  const [propertyUnits, setPropertyUnits] = useState<IPropertyUnits>({ ...DEFAULT_UNITS });

  const languageOptions = [
    { label: intl.formatMessage({ id: 'settings.language.es' }), value: 'es' },
    { label: intl.formatMessage({ id: 'settings.language.en' }), value: 'en' }
  ];

  const handleLanguageChange = (e: DropdownChangeEvent) => {
    switchLanguage(e.value);
  };

  const handleUnitChange = (propertyKey: keyof IPropertyUnits, unit: string) => {
    setPropertyUnits((prevUnits) => ({
      ...prevUnits,
      [propertyKey]: unit
    }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('theme', JSON.stringify(isDarkMode));
      localStorage.setItem('locale', locale);
      localStorage.setItem('propertyUnits', JSON.stringify(propertyUnits));
      setLoading(false);
    }, 10000);
  };

  const handleCancel = () => {
    setLoading(true);
    setTimeout(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
      const savedLocale = localStorage.getItem('locale') as 'es' | 'en' | null;
      if (savedLocale) {
        switchLanguage(savedLocale);
      }
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
            onChange={(e: CheckboxChangeEvent) => setIsDarkMode(!!e.checked)}
          />
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
              {(Object.keys(propertyUnits) as Array<keyof IPropertyUnits>).map((propertyKey) => (
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

        <div className="flex justify-content-around">
          <Button label={intl.formatMessage({ id: 'common.save' })} icon="pi pi-check" onClick={handleSave} />
          <Button label={intl.formatMessage({ id: 'common.cancel' })} icon="pi pi-times" onClick={handleCancel} />
        </div>
      </Card>
    </div>
  );
}
