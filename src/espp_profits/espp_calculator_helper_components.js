import React from 'react';
import { isMobile } from 'react-device-detect';
import { Icon, Tooltip } from 'antd';

import './espp_calculator_helper_components.css';

export const ESPPCalculatorTooltip = ({ tooltipText }) => {
  return (
    <Tooltip overlayClassName='espp-calculator-tooltip' title={tooltipText} trigger={isMobile ? 'click' : 'hover'}>
      <Icon type='question-circle' theme='filled' />
    </Tooltip>
  );
};
