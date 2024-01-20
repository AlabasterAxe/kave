

export function normalizedVideoPointToScreen(
    {
      offset,
      zoom,
      viewportSize,
      videoSize,
    }: {
      offset: { x: number; y: number };
      zoom: number;
      viewportSize: { x: number; y: number };
      videoSize: { x: number; y: number };
    },
    point: { x: number; y: number }
  ) {
      const videoAspectRatio = videoSize.x / videoSize.y;
      const viewportAspectRatio = viewportSize.x / viewportSize.y;
    
      // The video is scaled to fit the viewport
      let videoOnViewportSize;
      let videoOnViewportOffset;
      if (viewportAspectRatio > videoAspectRatio) {
        videoOnViewportSize = { x: (viewportSize.y * videoAspectRatio) * zoom, y: viewportSize.y * zoom };
      } else {
        videoOnViewportSize = { x: viewportSize.x * zoom, y: (viewportSize.x / videoAspectRatio) * zoom };
      }
      videoOnViewportOffset = { x: (viewportSize.x - videoOnViewportSize.x) / 2, y: (viewportSize.y - videoOnViewportSize.y) / 2 };
    
      return {x: point.x * videoOnViewportSize.x + videoOnViewportOffset.x + offset.x, y: point.y * videoOnViewportSize.y + videoOnViewportOffset.y - offset.y};
  }

