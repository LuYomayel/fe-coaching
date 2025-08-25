import React from 'react';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { Dumbbell } from 'lucide-react';

const Footer = ({ contactRef }) => {
  const intl = useIntl();

  return (
    <div ref={contactRef} className="surface-section py-8 sm:py-12">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6">
        <div className="grid align-items-center">
          <div className="col-12 lg:col-8 text-center lg:text-left">
            <div className="flex align-items-center justify-content-center lg:justify-content-start mb-4">
              <Dumbbell className="mr-3 text-primary" size={24} />
              <span className="font-bold text-2xl text-900">EaseTrain</span>
            </div>
            <p className="text-600 mb-4 max-w-30rem mx-auto lg:mx-0">
              <FormattedMessage id="home.footer.description" />
            </p>
            <p className="text-sm text-500">
              <FormattedMessage id="home.footer.copyright" />
            </p>
          </div>
          <div className="col-12 lg:col-4 text-center lg:text-right mt-4 lg:mt-0">
            <Button
              label={intl.formatMessage({ id: 'home.footer.contactWhatsApp' })}
              className="p-button-rounded p-button-lg shadow-2"
              icon="pi pi-whatsapp"
              onClick={() => window.open('https://wa.me/541172394519', '_blank')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
