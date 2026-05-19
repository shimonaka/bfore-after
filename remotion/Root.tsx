import { Composition } from 'remotion';
import {
  BeforeAfterStory,
  computeTotalFrames,
  type BeforeAfterStoryProps,
} from './templates/BeforeAfterStory';

const defaultProps: BeforeAfterStoryProps = {
  hookText: '広がる髪\nもう諦めてた',
  beforeMedia: {
    type: 'image',
    url: '/samples/before.png',
  },
  afterMedia: {
    type: 'image',
    url: '/samples/after.png',
  },
  menuName: '縮毛矯正＋カット',
  price: '¥18,000',
  duration: '2時間30分',
  salonName: 'SALON TOKYO',
  fontPairId: 'B',
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BeforeAfterStory"
        component={BeforeAfterStory}
        durationInFrames={computeTotalFrames(
          defaultProps.beforeMedia,
          defaultProps.afterMedia
        )}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: computeTotalFrames(
            props.beforeMedia,
            props.afterMedia
          ),
        })}
      />
    </>
  );
};
