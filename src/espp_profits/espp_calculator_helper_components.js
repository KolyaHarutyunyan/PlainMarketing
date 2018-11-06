import React from 'react';
import { isMobile } from 'react-device-detect';
import { Icon, Tooltip } from 'antd';

import './espp_calculator_helper_components.css';

export const ESPPCalculatorTooltip = ({ tooltipText, child = null }) => {
  return (
    <Tooltip overlayClassName='espp-calculator-tooltip' title={tooltipText} trigger={isMobile ? 'click' : 'hover'}>
      {child === null ? <Icon type='question-circle' theme='filled' /> : child}
    </Tooltip>
  );
};
