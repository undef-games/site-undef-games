import { mountSiteSurface } from '@undef/scanlines-system'
import '@undef/scanlines-system/styles/site.css'

const root = document.getElementById('scanlines-root')

if (root) {
  mountSiteSurface(root)
}
