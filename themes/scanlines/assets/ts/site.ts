import { mountSiteSurface } from '../../../../packages/scanlines-system/src/index'
import '../../../../packages/scanlines-system/src/styles/site.css'

const root = document.getElementById('scanlines-root')

if (root) {
  mountSiteSurface(root)
}
