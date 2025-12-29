"use client";

import React from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

interface WebcamWrapperProps extends Partial<WebcamProps> {
  webcamRef?: React.Ref<Webcam>;
}

const WebcamWrapper = ({ webcamRef, ...props }: WebcamWrapperProps) => {
  return <Webcam ref={webcamRef} {...(props as WebcamProps)} />;
};

export default WebcamWrapper;
