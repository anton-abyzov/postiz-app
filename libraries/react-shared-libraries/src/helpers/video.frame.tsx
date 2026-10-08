'use client';

import { FC } from 'react';
export const VideoFrame: FC<{
  url: string;
  autoplay?: boolean;
}> = (props) => {
  const { url } = props;
  const isLightbox = !!props?.autoplay;
  return (
    <video
      className={isLightbox ? 'w-full h-full rounded-[4px]' : 'w-full h-full object-cover rounded-[4px]'}
      src={url + (isLightbox ? '' : '#t=0.1')}
      preload={isLightbox ? 'auto' : 'metadata'}
      controls={isLightbox}
      playsInline
      autoPlay={isLightbox}
    />
  );
};
