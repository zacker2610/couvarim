import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ČoUvarím.sk',
    short_name: 'ČoUvarím',
    description: 'Inteligentný asistent pre vašu kuchyňu',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F5F2',
    theme_color: '#9CAF88',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
