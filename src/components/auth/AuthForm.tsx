import React, { useState } from 'react';
import { SignUpPage } from '../../pages/SignUpPage';
import { LoginPage } from '../../pages/LoginPage';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const navigateToLogin = () => setIsSignUp(false);
  const navigateToSignUp = () => setIsSignUp(true);

  if (isSignUp) {
    return <SignUpPage onNavigateToLogin={navigateToLogin} />;
  }

  return <LoginPage onNavigateToSignUp={navigateToSignUp} />;
};