import { Composition } from 'remotion';
import { BeforeAfterStory } from './templates/BeforeAfterStory';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BeforeAfterStory"
        component={BeforeAfterStory}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          hookText: '広がる髪、もう諦めてた',
          beforeImageUrl: 'https://picsum.photos/seed/before/1080/1920',
          afterImageUrl: 'https://picsum.photos/seed/after/1080/1920',
          menuName: '縮毛矯正＋カット',
          price: '¥18,000',
          duration: '2時間30分',
          salonName: 'SALON TOKYO',
          fontPairId: 'B' as const,
        }}
      />
    </>
  );
};
