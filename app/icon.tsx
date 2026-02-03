import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: '#06b6d4', // Your Cyan-500
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'black', // Text color
          borderRadius: '50%', // Circle shape
          fontWeight: 900,
          fontStyle: 'italic',
        }}
      >
        V
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
