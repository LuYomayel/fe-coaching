import { RefObject } from 'react';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';

export interface FooterProps {
  contactRef: RefObject<HTMLDivElement | null>;
}

const Footer = ({ contactRef }: FooterProps) => {
  const intl = useIntl();

  return (
    <div ref={contactRef} style={{ padding: '3.5rem 0' }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="grid align-items-center">
          <div className="col-12 lg:col-8 text-center lg:text-left">
            <div className="flex align-items-center justify-content-center lg:justify-content-start gap-2 mb-3">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#6366f1',
                  borderRadius: '10px'
                }}
              >
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>ET</span>
              </div>
              <span
                style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--ios-text)' }}
              >
                EaseTrain
              </span>
            </div>
            <p
              style={{
                color: 'var(--ios-text-secondary)',
                marginBottom: '0.75rem',
                maxWidth: '28rem',
                lineHeight: 1.6,
                fontSize: '0.92rem'
              }}
              className="mx-auto lg:mx-0"
            >
              <FormattedMessage id="home.footer.description" />
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ios-text-tertiary)' }}>
              <FormattedMessage id="home.footer.copyright" />
            </p>
          </div>

          <div className="col-12 lg:col-4 text-center lg:text-right mt-4 lg:mt-0">
            <Button
              label={intl.formatMessage({ id: 'home.footer.contactWhatsApp' })}
              icon="pi pi-whatsapp"
              onClick={() => window.open('https://wa.me/541172394519', '_blank')}
              style={{
                background: '#25d366',
                border: 'none',
                borderRadius: '14px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.92rem',
                boxShadow: '0 2px 12px rgba(37, 211, 102, 0.25)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
