import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './containers/Home';
import NotFound from './containers/NotFound';

const Routes = () => {
  return (
    <Switch>
      <Route path='/espp' exact component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default Routes;
