import { useState } from 'react';
import { useIntl } from 'react-intl';
import VerificationCodeDialog from '../components/dialogs/VerificationCodeDialog';
import { useHomePage } from '../hooks/useHomePage';
import { useLoginDialog } from '../hooks/dialogs/useLoginDialog';
import { useSignUpDialog } from '../hooks/dialogs/useSignUpDialog';
import { useVerificationDialog } from '../hooks/dialogs/useVerificationDialog';
import { useForgotPasswordVerification } from '../hooks/dialogs/useForgotPasswordVerification';
import { useResetPassword } from '../hooks/dialogs/useResetPassword';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import LoginDialog from '../components/dialogs/LoginDialog';
import SignUpDialog from '../components/dialogs/SignUpDialog';
import ForgotPasswordVerificationDialog from '../components/dialogs/ForgotPasswordVerificationDialog';
import ResetPasswordDialog from '../components/dialogs/ResetPasswordDialog';

import Header from '../components/home/header';
import Footer from '../components/home/footer';
import Hero from '../components/home/hero';
import Features from '../components/home/features';
import Subscriptions from '../components/home/subscriptions';
import './Home.css';

export default function HomePage() {
  const intl = useIntl();
  const { showConfirmationDialog } = useConfirmationDialog();
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const { isScrolled, featuresRef, pricingRef, contactRef, scrollToSection } = useHomePage();

  const verificationDialog = useVerificationDialog();
  const loginDialog = useLoginDialog({
    onRequireVerification: (email: string, password: string) => {
      setPendingCredentials({ email, password });
      verificationDialog.open(email);
    }
  });
  const signUpDialog = useSignUpDialog({
    onRequireVerification: (email: string, password: string) => {
      console.log('onRequireVerification', { email, password });
      setPendingCredentials({ email, password });
      verificationDialog.open(email);
    }
  });

  // Forgot password flow
  const forgotPasswordVerification = useForgotPasswordVerification({
    onSuccess: (email: string, code: string) => {
      setVerifiedEmail(email);
      setVerificationCode(code);
      setForgotPasswordVisible(false);
      setResetPasswordVisible(true);
    }
  });

  const resetPassword = useResetPassword({
    email: verifiedEmail,
    verificationCode: verificationCode,
    onSuccess: async (newPassword: string) => {
      setResetPasswordVisible(false);
      try {
        await loginDialog.loginWithCredentials({ email: verifiedEmail, password: newPassword });
      } catch (error) {
        console.error('Auto-login after password reset failed', error);
        loginDialog.setEmail(verifiedEmail);
        loginDialog.open();
      }
    }
  });

  const handleVerificationSuccess = async () => {
    verificationDialog.handleSuccess();
    loginDialog.resetForm();
    signUpDialog.resetForm();

    if (pendingCredentials) {
      try {
        await loginDialog.loginWithCredentials(pendingCredentials);
      } catch (error) {
        console.error('Error logging in', error);
      } finally {
        setPendingCredentials(null);
      }
    }
  };

  const handleForgotPassword = () => {
    loginDialog.close();
    forgotPasswordVerification.setEmail(loginDialog.formValues.email);
    setForgotPasswordVisible(true);
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
          signUpDialog.setEmail(loginDialog.formValues.email);
          signUpDialog.open();
        }}
        onForgotPassword={handleForgotPassword}
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
          loginDialog.setEmail(signUpDialog.formValues.email);
          loginDialog.open();
        }}
      />
      <VerificationCodeDialog
        visible={verificationDialog.visible}
        onHide={verificationDialog.close}
        email={verificationDialog.email}
        onVerificationSuccess={handleVerificationSuccess}
      />
      <ForgotPasswordVerificationDialog
        visible={forgotPasswordVisible}
        onHide={() => setForgotPasswordVisible(false)}
        email={forgotPasswordVerification.email}
        code={forgotPasswordVerification.code}
        codeSent={forgotPasswordVerification.codeSent}
        isSendingCode={forgotPasswordVerification.isSendingCode}
        isVerifying={forgotPasswordVerification.isVerifying}
        isResending={forgotPasswordVerification.isResending}
        onEmailChange={forgotPasswordVerification.handleEmailChange}
        onCodeChange={forgotPasswordVerification.handleCodeChange}
        onSendCode={forgotPasswordVerification.sendVerificationCode}
        onVerifyCode={forgotPasswordVerification.verifyCode}
        onResendCode={forgotPasswordVerification.resendCode}
        onReset={forgotPasswordVerification.reset}
      />
      <ResetPasswordDialog
        visible={resetPasswordVisible}
        onHide={() => {
          showConfirmationDialog({
            message: intl.formatMessage({ id: 'resetPassword.confirm.exit' }),
            header: intl.formatMessage({ id: 'common.confirmation' }),
            icon: 'pi pi-exclamation-triangle',
            accept: () => setResetPasswordVisible(false)
          });
        }}
        newPassword={resetPassword.newPassword}
        confirmPassword={resetPassword.confirmPassword}
        isResetting={resetPassword.isResetting}
        errors={resetPassword.errors}
        onNewPasswordChange={resetPassword.handleNewPasswordChange}
        onConfirmPasswordChange={resetPassword.handleConfirmPasswordChange}
        onResetPassword={resetPassword.resetPassword}
        onReset={resetPassword.reset}
      />
    </div>
  );
}
