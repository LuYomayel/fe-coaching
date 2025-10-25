import React, { useState } from 'react';
import VerificationCodeDialog from '../dialogs/VerificationCodeDialog';
import { useHomePage } from '../hooks/useHomePage';
import { useLoginDialog } from '../hooks/dialogs/useLoginDialog';
import { useSignUpDialog } from '../hooks/dialogs/useSignUpDialog';
import { useVerificationDialog } from '../hooks/dialogs/useVerificationDialog';
import LoginDialog from '../components/dialogs/LoginDialog';
import SignUpDialog from '../components/dialogs/SignUpDialog';

import Header from '../components/home/header';
import Footer from '../components/home/footer';
import Hero from '../components/home/hero';
import Features from '../components/home/features';
import Subscriptions from '../components/home/subscriptions';
import './Home.css';

export default function HomePage() {
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const { isScrolled, featuresRef, pricingRef, contactRef, scrollToSection } = useHomePage();

  const verificationDialog = useVerificationDialog();
  const loginDialog = useLoginDialog({
    onRequireVerification: (email) => verificationDialog.open(email)
  });
  const signUpDialog = useSignUpDialog({
    onRequireVerification: ({ email, password }) => {
      setPendingCredentials({ email, password });
      verificationDialog.open(email);
    }
  });

  const handleVerificationSuccess = async () => {
    verificationDialog.handleSuccess();
    loginDialog.resetForm();
    signUpDialog.resetForm();

    if (pendingCredentials) {
      try {
        await loginDialog.loginWithCredentials(pendingCredentials);
      } finally {
        setPendingCredentials(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isScrolled={isScrolled}
        onLoginClick={loginDialog.open}
        onSignUpClick={signUpDialog.open}
        onScrollToFeatures={() => scrollToSection(featuresRef)}
        onScrollToPricing={() => scrollToSection(pricingRef)}
        onScrollToContact={() => scrollToSection(contactRef)}
      />
      <main className="flex-grow-1">
        <Hero onSignUpClick={signUpDialog.open} onScrollToFeatures={() => scrollToSection(featuresRef)} />
        <Features featuresRef={featuresRef} />
        <Subscriptions pricingRef={pricingRef} onSignUpClick={signUpDialog.open} />
      </main>
      <Footer contactRef={contactRef} />
      <LoginDialog
        visible={loginDialog.visible}
        onHide={loginDialog.close}
        formValues={loginDialog.formValues}
        formErrors={loginDialog.formErrors}
        onFieldChange={loginDialog.handleFieldChange}
        onSubmit={loginDialog.handleSubmit}
        loading={loginDialog.loading}
        onSwitchToSignUp={() => {
          loginDialog.close();
          signUpDialog.open();
        }}
      />
      <SignUpDialog
        visible={signUpDialog.visible}
        onHide={signUpDialog.close}
        formValues={signUpDialog.formValues}
        formErrors={signUpDialog.formErrors}
        onFieldChange={signUpDialog.handleFieldChange}
        onSubmit={signUpDialog.handleSubmit}
        loading={signUpDialog.loading}
        onSwitchToLogin={() => {
          signUpDialog.close();
          loginDialog.open();
        }}
      />
      <VerificationCodeDialog
        visible={verificationDialog.visible}
        onHide={verificationDialog.close}
        email={verificationDialog.email}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
