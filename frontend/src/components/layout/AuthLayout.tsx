import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BubblesBackground from '../BubblesBackground';
import AnimatedPage from '../AnimatedPage';

const AuthLayout: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <BubblesBackground />
      <AnimatedPage key={location.pathname}>
        <Outlet />
      </AnimatedPage>
    </>
  );
};

export default AuthLayout;
