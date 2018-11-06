import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { HomeCollector, HomeResults } from './containers/Home';
import NotFound from './containers/NotFound';

const Routes = () => {
  return (
    <Switch>
      <Route path='/espp' exact component={HomeCollector} />
      <Route path='/espp/results' exact component={HomeResults} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default Routes;
