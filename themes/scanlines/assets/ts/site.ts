import { mountSiteSurface } from '@undef-games/scanlines-system'
import '@undef-games/scanlines-system/styles/site.css'

const root = document.getElementById('scanlines-root')

if (root) {
  mountSiteSurface(root)
}
