"use client";

import React from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

interface WebcamWrapperProps extends WebcamProps {
  webcamRef?: React.Ref<Webcam>;
}

const WebcamWrapper = ({ webcamRef, ...props }: WebcamWrapperProps) => {
  return <Webcam ref={webcamRef} {...props} />;
};

export default WebcamWrapper;
