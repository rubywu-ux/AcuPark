import React, { forwardRef } from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

const WebcamWrapper = forwardRef<Webcam, WebcamProps>((props, ref) => {
  return <Webcam ref={ref} {...props} />;
});

WebcamWrapper.displayName = 'WebcamWrapper';

export default WebcamWrapper;
